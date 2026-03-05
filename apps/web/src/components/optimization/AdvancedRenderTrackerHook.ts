import { useRef, useEffect } from "react";

// Enhanced deep equal utility with circular reference protection
const deepEqual = (a: any, b: any, visited = new WeakMap()): boolean => {
    if (Object.is(a, b)) return true;
    if (typeof a !== typeof b) return false;
    if (typeof a !== "object" || a == null || b == null) return false;

    // Check for circular references
    if (visited.has(a)) {
        return visited.get(a) === b;
    }
    visited.set(a, b);

    if (Array.isArray(a)) {
        if (!Array.isArray(b) || a.length !== b.length) return false;
        return a.every((el, idx) => deepEqual(el, b[idx], visited));
    }

    // Handle React elements and functions more gracefully
    if (a.$$typeof || typeof a === "function") {
        return a === b;
    }

    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every((key) => deepEqual(a[key], b[key], visited));
};

type PropsType = Record<string, any>;
type HookDependencies = Record<string, any>;

interface RenderTrackerOptions {
    logToConsole?: boolean;
    trackHooks?: boolean;
    deepCompare?: boolean;
    maxHistory?: number;
}

/**
 * Custom hook to track component re-renders with detailed prop and hook dependency changes.
 * @param {string} name - Name of the component for logging purposes.
 * @param props - Props of the component to track changes.
 * @param hookDependencies - Dependencies of hooks used in the component to track changes.
 * @param options - Options to customize the behavior of the tracker.
 */
export const useAdvancedRenderTracker = (
    name: string,
    props: PropsType,
    hookDependencies: HookDependencies = {},
    options: RenderTrackerOptions = {
        logToConsole: true,
        trackHooks: true,
        deepCompare: false,
        maxHistory: 10,
    }
) => {
    const {
        logToConsole = true,
        trackHooks = true,
        deepCompare = false,
        maxHistory = 10,
    } = options;

    const renderCount = useRef(0);
    const prevProps = useRef<PropsType>(props);
    const prevHookDeps = useRef<HookDependencies>(hookDependencies);
    const renderHistory = useRef<
        Array<{
            renderNumber: number;
            timestamp: number;
            propChanges: Record<string, { from: any; to: any }>;
            hookChanges: Record<string, { from: any; to: any }>;
        }>
    >([]);

    useEffect(() => {
        renderCount.current += 1;
        const timestamp = Date.now();

        const compareFn = deepCompare
            ? (a: any, b: any) => {
                  try {
                      return deepEqual(a, b);
                  } catch (error) {
                      // Fallback to shallow comparison if deep comparison fails
                      console.warn(
                          `Deep comparison failed for ${name}, falling back to shallow:`,
                          error
                      );
                      return a === b;
                  }
              }
            : (a: any, b: any) => a === b;

        // Track prop changes
        const propChanges: Record<string, { from: any; to: any }> = {};
        Object.keys(props).forEach((key) => {
            if (!compareFn(prevProps.current[key], props[key])) {
                propChanges[key] = {
                    from: prevProps.current[key],
                    to: props[key],
                };
            }
        });

        // Track hook dependency changes
        const hookChanges: Record<string, { from: any; to: any }> = {};
        if (trackHooks) {
            Object.keys(hookDependencies).forEach((key) => {
                if (!compareFn(prevHookDeps.current[key], hookDependencies[key])) {
                    hookChanges[key] = {
                        from: prevHookDeps.current[key],
                        to: hookDependencies[key],
                    };
                }
            });
        }

        // Store render history
        renderHistory.current.push({
            renderNumber: renderCount.current,
            timestamp,
            propChanges,
            hookChanges,
        });

        // Keep only last N renders to avoid memory leaks
        if (renderHistory.current.length > maxHistory) {
            renderHistory.current = renderHistory.current.slice(-maxHistory);
        }

        // Console logging
        if (logToConsole && renderCount.current > 1) {
            console.group(`🔄 ${name} re-render #${renderCount.current}`);

            if (Object.keys(propChanges).length > 0) {
                console.log("📝 Props that changed:", propChanges);
                console.table(propChanges);
            }
            if (Object.keys(hookChanges).length > 0) {
                console.log("🎣 Hook dependencies that changed:", hookChanges);
                console.table(hookChanges);
            }
            if (Object.keys(propChanges).length === 0 && Object.keys(hookChanges).length === 0) {
                console.log(
                    "⚠️ Re-render with no tracked changes (possible context/parent state update)"
                );
            }
            console.log("📊 Current state:", { props, hookDependencies });
            console.groupEnd();
        } else if (logToConsole) {
            console.log(`🚀 ${name} initial render`);
        }

        // Update refs
        prevProps.current = props;
        prevHookDeps.current = hookDependencies;
    });

    return {
        renderCount: renderCount.current,
        renderHistory: renderHistory.current,
        getCurrentChanges: () => {
            const latest = renderHistory.current[renderHistory.current.length - 1];
            return latest ? { ...latest.propChanges, ...latest.hookChanges } : {};
        },
    };
};
