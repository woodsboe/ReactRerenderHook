import React, { useRef, useState, useEffect } from "react";

// Safe JSON stringify that handles circular references
const safeStringify = (obj: any, maxDepth = 3, currentDepth = 0): string => {
    if (currentDepth > maxDepth) {
        return "[Max Depth Reached]";
    }

    const seen = new WeakSet();

    const replacer = (key: string, value: any): any => {
        // Handle circular references
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return "[Circular Reference]";
            }
            seen.add(value);
        }

        // Handle React Fiber nodes
        if (value && typeof value === "object" && value.$$typeof) {
            return "[React Element]";
        }

        // Handle DOM elements
        if (value instanceof Element) {
            return `[DOM Element: ${value.tagName.toLowerCase()}]`;
        }

        // Handle functions
        if (typeof value === "function") {
            return `[Function: ${value.name || "anonymous"}]`;
        }

        // Handle other complex objects at max depth
        if (currentDepth >= maxDepth && typeof value === "object" && value !== null) {
            return "[Complex Object]";
        }

        return value;
    };

    try {
        return JSON.stringify(obj, replacer, 2);
    } catch (error) {
        return `[Serialization Error: ${error.message}]`;
    }
};

// Enhanced utility to help with safe value display
const formatValue = (val: any) => {
    if (val === null) return "null";
    if (val === undefined) return "undefined";
    if (typeof val === "string") return `"${val}"`;
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    if (typeof val === "function") return `[Function: ${val.name || "anonymous"}]`;

    // For objects, use safe stringify
    if (typeof val === "object") {
        return (
            <pre
                style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    maxHeight: "200px",
                    overflow: "auto",
                    fontSize: "12px",
                    background: "#1a1a2e",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #333",
                }}
            >
                {safeStringify(val)}
            </pre>
        );
    }

    return String(val);
};

// Resizable overlay hook
const useResizable = (initialSize = { width: 480, height: 400 }) => {
    const [size, setSize] = useState(initialSize);
    const [resizing, setResizing] = useState<string | null>(null);
    const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!resizing) return;

            const deltaX = e.clientX - resizeStart.current.x;
            const deltaY = e.clientY - resizeStart.current.y;

            let newWidth = resizeStart.current.width;
            let newHeight = resizeStart.current.height;

            if (resizing.includes('right')) {
                newWidth = Math.max(320, Math.min(window.innerWidth * 0.9, resizeStart.current.width + deltaX));
            }
            if (resizing.includes('left')) {
                newWidth = Math.max(320, Math.min(window.innerWidth * 0.9, resizeStart.current.width - deltaX));
            }
            if (resizing.includes('bottom')) {
                newHeight = Math.max(200, Math.min(window.innerHeight * 0.8, resizeStart.current.height + deltaY));
            }
            if (resizing.includes('top')) {
                newHeight = Math.max(200, Math.min(window.innerHeight * 0.8, resizeStart.current.height - deltaY));
            }

            setSize({ width: newWidth, height: newHeight });
        };

        const onUp = () => setResizing(null);

        if (resizing) {
            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
        }
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    }, [resizing]);

    const startResize = (direction: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setResizing(direction);
        resizeStart.current = {
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height,
        };
    };

    return { size, startResize, resizing };
};

// Draggable overlay
const useDraggable = (initial = { x: 40, y: 40 }) => {
    const nodeRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState(initial);
    const [dragging, setDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!dragging) return;
            setPos({
                x: e.clientX - dragOffset.current.x,
                y: e.clientY - dragOffset.current.y,
            });
        };
        const onUp = () => setDragging(false);

        if (dragging) {
            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
        }
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    }, [dragging]);

    const onMouseDown = (e: React.MouseEvent) => {
        if (!nodeRef.current) return;
        setDragging(true);
        const rect = nodeRef.current.getBoundingClientRect();
        dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    return { nodeRef, pos, onMouseDown };
};

export const AdvancedRenderTrackerOverlay = ({
    history,
    name = "Component",
    onClose,
}: {
    history: Array<{
        renderNumber: number;
        timestamp: number;
        propChanges: Record<string, { from: any; to: any }>;
        hookChanges: Record<string, { from: any; to: any }>;
    }>;
    name?: string;
    onClose?: () => void;
}) => {
    const { nodeRef, pos, onMouseDown } = useDraggable();
    const { size, startResize, resizing } = useResizable();
    const [collapsed, setCollapsed] = useState(false);
    const [expandedRows, setExpandedRows] = useState<{ [key: number]: boolean }>({});

    const toggleRow = (num: number) => setExpandedRows((prev) => ({ ...prev, [num]: !prev[num] }));

    const expandAll = () => {
        const all = Object.fromEntries(history.map((h) => [h.renderNumber, true]));
        setExpandedRows(all);
    };
    const collapseAll = () => setExpandedRows({});

    return (
        <div
            ref={nodeRef}
            style={{
                position: "fixed",
                left: pos.x,
                top: pos.y,
                zIndex: 99999,
                width: size.width,
                height: size.height,
                minWidth: 320,
                maxWidth: "90vw",
                maxHeight: "80vh",
                background: "#181820EE",
                color: "#f0f0f0",
                border: resizing ? "2px solid #4a9eff" : "1px solid #343452",
                borderRadius: 10,
                boxShadow: resizing ? "0 4px 24px 0 #4a9eff33" : "0 4px 18px 0 #0008",
                fontFamily: "system-ui, monospace",
                fontSize: 15,
                userSelect: "none",
                padding: 0,
                overflow: "hidden",
                transition: resizing ? "none" : "border 0.2s, box-shadow 0.2s",
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: "8px 12px",
                    background: "#232341",
                    borderBottom: "1px solid #282850",
                    borderRadius: "10px 10px 0 0",
                    cursor: "move",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
                onMouseDown={onMouseDown}
            >
                <span style={{ fontWeight: "bold" }}>🧩 {name} Render Tracker</span>
                <div style={{ display: "flex", gap: 6 }}>
                    <button
                        title={collapsed ? "Expand" : "Collapse"}
                        onClick={() => setCollapsed((c) => !c)}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#ccc",
                            cursor: "pointer",
                            fontSize: 18,
                            lineHeight: 1,
                            width: 28,
                            height: 28,
                        }}
                    >
                        {collapsed ? "▣" : "–"}
                    </button>
                    <button
                        title="Close"
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#ccc",
                            cursor: "pointer",
                            fontSize: 20,
                            lineHeight: 1,
                            width: 28,
                            height: 28,
                        }}
                    >
                        ×
                    </button>
                </div>
            </div>

            {/* Body */}
            {!collapsed && (
                <div
                    style={{
                        maxHeight: 400,
                        overflow: "auto",
                        padding: 10,
                        background: "#202034",
                    }}
                >
                    <div style={{ marginBottom: 8, display: "flex", gap: 8 }}>
                        <button onClick={expandAll} style={buttonStyle}>
                            Expand all
                        </button>
                        <button onClick={collapseAll} style={buttonStyle}>
                            Collapse all
                        </button>
                    </div>
                    {history.length === 0 && (
                        <div style={{ color: "#888", padding: 16 }}>No renders tracked yet.</div>
                    )}
                    {history.map((entry) => {
                        const isExpanded = expandedRows[entry.renderNumber] || false;
                        return (
                            <div
                                key={entry.renderNumber}
                                style={{
                                    marginBottom: 10,
                                    background: "#232341",
                                    borderRadius: 8,
                                    boxShadow: "0 1px 3px #0004",
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        cursor: "pointer",
                                        padding: "8px 10px",
                                        borderBottom: isExpanded ? "1px solid #2a2a48" : undefined,
                                        fontWeight: 500,
                                    }}
                                    onClick={() => toggleRow(entry.renderNumber)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            toggleRow(entry.renderNumber);
                                        }
                                    }}
                                    tabIndex={0}
                                    role="button"
                                    aria-expanded={isExpanded}
                                    title="Expand/collapse details"
                                >
                                    <span style={{ marginRight: 6, color: "#7fd" }}>
                                        #{entry.renderNumber}
                                    </span>
                                    <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                                    <span style={{ marginLeft: 12, color: "#8fd" }}>
                                        {Object.keys(entry.propChanges).length > 0 && "📝 Props "}
                                        {Object.keys(entry.hookChanges).length > 0 && "🎣 Hooks "}
                                        {Object.keys(entry.propChanges).length === 0 &&
                                            Object.keys(entry.hookChanges).length === 0 && (
                                                <span style={{ color: "#aaa" }}>No changes</span>
                                            )}
                                    </span>
                                    <span style={{ flex: 1 }} />
                                    <span style={{ fontSize: 18, color: "#fff6", marginRight: 2 }}>
                                        {isExpanded ? "▼" : "►"}
                                    </span>
                                </div>
                                {isExpanded && (
                                    <div
                                        style={{
                                            padding: "10px 12px",
                                            background: "#202038",
                                            fontSize: 14,
                                        }}
                                    >
                                        {/* Prop changes */}
                                        <div>
                                            <strong>Prop Changes:</strong>
                                            {Object.keys(entry.propChanges).length === 0 ? (
                                                <div style={{ color: "#888" }}>None</div>
                                            ) : (
                                                <ul style={{ margin: 0, paddingLeft: 18 }}>
                                                    {Object.entries(entry.propChanges).map(
                                                        ([key, { from, to }]) => (
                                                            <li
                                                                key={key}
                                                                style={{ marginBottom: "8px" }}
                                                            >
                                                                <span style={{ color: "#ffd080" }}>
                                                                    {key}:
                                                                </span>
                                                                <div style={{ marginTop: "4px" }}>
                                                                    <div
                                                                        style={{
                                                                            color: "#f99",
                                                                            marginBottom: "4px",
                                                                        }}
                                                                    >
                                                                        From: {formatValue(from)}
                                                                    </div>
                                                                    <div style={{ color: "#9f9" }}>
                                                                        To: {formatValue(to)}
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            )}
                                        </div>
                                        {/* Hook changes */}
                                        <div style={{ marginTop: 8 }}>
                                            <strong>Hook Dependency Changes:</strong>
                                            {Object.keys(entry.hookChanges).length === 0 ? (
                                                <div style={{ color: "#888" }}>None</div>
                                            ) : (
                                                <ul style={{ margin: 0, paddingLeft: 18 }}>
                                                    {Object.entries(entry.hookChanges).map(
                                                        ([key, { from, to }]) => (
                                                            <li
                                                                key={key}
                                                                style={{ marginBottom: "8px" }}
                                                            >
                                                                <span style={{ color: "#80d9ff" }}>
                                                                    {key}:
                                                                </span>
                                                                <div style={{ marginTop: "4px" }}>
                                                                    <div
                                                                        style={{
                                                                            color: "#f99",
                                                                            marginBottom: "4px",
                                                                        }}
                                                                    >
                                                                        From: {formatValue(from)}
                                                                    </div>
                                                                    <div style={{ color: "#9f9" }}>
                                                                        To: {formatValue(to)}
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Resize handles */}
            {/* Bottom-right corner resize handle */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 12,
                    height: 12,
                    cursor: "nw-resize",
                    background: "linear-gradient(-45deg, transparent 30%, #666 30%, #666 70%, transparent 70%)",
                    zIndex: 1,
                }}
                onMouseDown={startResize("bottom-right")}
                title="Resize overlay"
            />

            {/* Right edge resize handle */}
            <div
                style={{
                    position: "absolute",
                    top: 20,
                    right: 0,
                    bottom: 12,
                    width: 4,
                    cursor: "ew-resize",
                    background: "transparent",
                    zIndex: 1,
                }}
                onMouseDown={startResize("right")}
                title="Resize width"
            />

            {/* Bottom edge resize handle */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 20,
                    right: 12,
                    height: 4,
                    cursor: "ns-resize",
                    background: "transparent",
                    zIndex: 1,
                }}
                onMouseDown={startResize("bottom")}
                title="Resize height"
            />
        </div>
    );
};

const buttonStyle: React.CSSProperties = {
    background: "#282850",
    color: "#aef",
    border: "1px solid #40407a",
    borderRadius: 5,
    padding: "4px 10px",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    marginRight: 3,
};
