import { useRef, useLayoutEffect } from "react";

// Enhanced deep equal utility with circular reference protection
const deepEqual = (a: any, b: any, visited = new WeakMap()): boolean => {
    if (Object.is(a, b)) return true;
    if (typeof a !== typeof b) return false;
    if (typeof a !== "object" || a == null || b == null) return false;

    // Handle React elements — they are objects with $$typeof
    if (a.$$typeof) {
        return a === b;
    }

    // Check for circular references
    if (visited.has(a)) {
        return visited.get(a) === b;
    }
    visited.set(a, b);

    if (Array.isArray(a)) {
        if (!Array.isArray(b) || a.length !== b.length) return false;
        return a.every((el, idx) => deepEqual(el, b[idx], visited));
    }

    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every((key) => deepEqual(a[key], b[key], visited));
};

type PropsType = Record<string, any>;
type HookDependencies = Record<string, any>;

export interface RenderRecord {
    renderNumber: number;
    timestamp: number;
    durationMs: number;
    propChanges: Record<string, { from: any; to: any }>;
    hookChanges: Record<string, { from: any; to: any }>;
}

export interface RenderTrackerOptions {
    logToConsole?: boolean;
    trackHooks?: boolean;
    deepCompare?: boolean;
    maxHistory?: number;
    slowRenderThresholdMs?: number;
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
    // Fix #10: Remove redundant outer default object — destructured defaults are sufficient
    options: RenderTrackerOptions = {}
) => {
    const {
        logToConsole = true,
        trackHooks = true,
        // Fix #7: Align defaults with documentation (deepCompare: true, maxHistory: 50)
        deepCompare = true,
        maxHistory = 50,
        slowRenderThresholdMs = 16.67, // Default to ~60fps threshold
    } = options;

    const startTime = performance.now();

    // Fix #1: Increment synchronously during render so the returned value is never stale.
    // Using a ref (not state) avoids triggering a re-render loop — refs update without
    // scheduling a new render, so the count reflects the current render immediately.
    const renderCountRef = useRef(0);
    renderCountRef.current += 1;
    const currentRender = renderCountRef.current;

    const prevProps = useRef<PropsType>(props);
    const prevHookDeps = useRef<HookDependencies>(hookDependencies);
    const renderHistory = useRef<RenderRecord[]>([]);

    // Use layout effect to capture duration as close to the render commit as possible
    useLayoutEffect(() => {
        const durationMs = performance.now() - startTime;
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

        // Fix #2: Merge keys from both previous and current props to detect removed props
        const allPropKeys = new Set([
            ...Object.keys(prevProps.current),
            ...Object.keys(props),
        ]);
        const propChanges: Record<string, { from: any; to: any }> = {};
        allPropKeys.forEach((key) => {
            if (!compareFn(prevProps.current[key], props[key])) {
                propChanges[key] = {
                    from: prevProps.current[key],
                    to: props[key],
                };
            }
        });

        // Track hook dependency changes — also detect removed dependencies
        const hookChanges: Record<string, { from: any; to: any }> = {};
        if (trackHooks) {
            const allHookKeys = new Set([
                ...Object.keys(prevHookDeps.current),
                ...Object.keys(hookDependencies),
            ]);
            allHookKeys.forEach((key) => {
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
            renderNumber: currentRender,
            timestamp,
            durationMs,
            propChanges,
            hookChanges,
        });

        // Keep only last N renders to avoid memory leaks
        while (renderHistory.current.length > maxHistory) {
            renderHistory.current.shift();
        }

        // Console logging
        if (logToConsole && currentRender > 1) {
            const isSlow = durationMs > slowRenderThresholdMs;
            const label = `🔄 ${name} re-render #${currentRender} (${durationMs.toFixed(2)}ms)${isSlow ? " ⚠️ SLOW" : ""}`;
            
            if (isSlow) {
                console.group(`%c${label}`, "color: #ff4d4d; font-weight: bold;");
            } else {
                console.group(label);
            }

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
            console.log(`🚀 ${name} initial render (${durationMs.toFixed(2)}ms)`);
        }

        // Update refs
        prevProps.current = props;
        prevHookDeps.current = hookDependencies;
    });

    return {
        renderCount: renderCountRef.current,
        renderHistory: renderHistory.current,
        getCurrentChanges: () => {
            const latest = renderHistory.current[renderHistory.current.length - 1];
            return latest ? { ...latest.propChanges, ...latest.hookChanges } : {};
        },
    };
};
