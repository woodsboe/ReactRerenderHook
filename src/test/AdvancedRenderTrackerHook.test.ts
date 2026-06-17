import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAdvancedRenderTracker } from "../AdvancedRenderTrackerHook";

// ---------------------------------------------------------------------------
// deepEqual is not exported, but its behaviour is observable through the hook.
// We test it indirectly via the hook's propChanges output.
// ---------------------------------------------------------------------------

describe("useAdvancedRenderTracker — basic render tracking", () => {
    beforeEach(() => {
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "group").mockImplementation(() => {});
        vi.spyOn(console, "groupEnd").mockImplementation(() => {});
        vi.spyOn(console, "table").mockImplementation(() => {});
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("starts with renderCount 1 after initial render", () => {
        const { result } = renderHook(() =>
            useAdvancedRenderTracker("Test", {}, {}, { logToConsole: false })
        );
        // Ref increments synchronously during render, so it is 1 immediately
        expect(result.current.renderCount).toBe(1);
    });

    it("increments renderCount on each re-render", () => {
        let value = 1;
        const { result, rerender } = renderHook(() =>
            useAdvancedRenderTracker("Test", { value }, {}, { logToConsole: false })
        );
        expect(result.current.renderCount).toBe(1);

        value = 2;
        rerender();
        expect(result.current.renderCount).toBe(2);

        value = 3;
        rerender();
        expect(result.current.renderCount).toBe(3);
    });

    it("renderCount is not stale — reflects the current render synchronously after rerender", () => {
        let value = 0;
        const { result, rerender } = renderHook(() =>
            useAdvancedRenderTracker("Test", { value }, {}, { logToConsole: false })
        );

        for (let i = 1; i <= 5; i++) {
            value = i;
            rerender();
            // renderCount must equal i+1 (initial render = 1, then i more rerenders)
            expect(result.current.renderCount).toBe(i + 1);
        }
    });
});

describe("useAdvancedRenderTracker — prop change detection", () => {
    beforeEach(() => {
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "group").mockImplementation(() => {});
        vi.spyOn(console, "groupEnd").mockImplementation(() => {});
        vi.spyOn(console, "table").mockImplementation(() => {});
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("detects a changed primitive prop", () => {
        let value = 1;
        const { result, rerender } = renderHook(() =>
            useAdvancedRenderTracker("Test", { value }, {}, { logToConsole: false, deepCompare: false })
        );

        value = 2;
        rerender();

        const latest = result.current.renderHistory[result.current.renderHistory.length - 1];
        expect(latest.propChanges).toHaveProperty("value");
        expect(latest.propChanges.value.from).toBe(1);
        expect(latest.propChanges.value.to).toBe(2);
    });

    it("detects a removed prop (fix #2)", () => {
        // Simulate a prop being removed: start with { a, b }, then pass only { a }
        let props: Record<string, any> = { a: 1, b: 2 };
        const { result, rerender } = renderHook(() =>
            useAdvancedRenderTracker("Test", props, {}, { logToConsole: false, deepCompare: false })
        );

        props = { a: 1 }; // b is removed
        rerender();

        const latest = result.current.renderHistory[result.current.renderHistory.length - 1];
        expect(latest.propChanges).toHaveProperty("b");
        expect(latest.propChanges.b.from).toBe(2);
        expect(latest.propChanges.b.to).toBeUndefined();
    });

    it("detects an added prop", () => {
        let props: Record<string, any> = { a: 1 };
        const { result, rerender } = renderHook(() =>
            useAdvancedRenderTracker("Test", props, {}, { logToConsole: false, deepCompare: false })
        );

        props = { a: 1, b: 99 };
        rerender();

        const latest = result.current.renderHistory[result.current.renderHistory.length - 1];
        expect(latest.propChanges).toHaveProperty("b");
        expect(latest.propChanges.b.from).toBeUndefined();
        expect(latest.propChanges.b.to).toBe(99);
    });

    it("records no prop changes when props are unchanged (shallow)", () => {
        const props = { a: 1, b: "hello" };
        const { result, rerender } = renderHook(() =>
            useAdvancedRenderTracker("Test", props, {}, { logToConsole: false, deepCompare: false })
        );
        rerender();

        const latest = result.current.renderHistory[result.current.renderHistory.length - 1];
        expect(Object.keys(latest.propChanges)).toHaveLength(0);
    });
});

describe("useAdvancedRenderTracker — deep comparison", () => {
    beforeEach(() => {
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "group").mockImplementation(() => {});
        vi.spyOn(console, "groupEnd").mockImplementation(() => {});
        vi.spyOn(console, "table").mockImplementation(() => {});
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("does NOT flag an object prop as changed when deep values are equal", () => {
        // A new object reference with same contents — shallow would flag it, deep should not
        let obj = { x: 1, y: 2 };
        const { result, rerender } = renderHook(() =>
            useAdvancedRenderTracker("Test", { obj }, {}, { logToConsole: false, deepCompare: true })
        );

        obj = { x: 1, y: 2 }; // same content, new reference
        rerender();

        const latest = result.current.renderHistory[result.current.renderHistory.length - 1];
        expect(Object.keys(latest.propChanges)).toHaveLength(0);
    });

    it("DOES flag an object prop as changed when deep values differ", () => {
        let obj = { x: 1, y: 2 };
        const { result, rerender } = renderHook(() =>
            useAdvancedRenderTracker("Test", { obj }, {}, { logToConsole: false, deepCompare: true })
        );

        obj = { x: 1, y: 99 };
        rerender();

        const latest = result.current.renderHistory[result.current.renderHistory.length - 1];
        expect(latest.propChanges).toHaveProperty("obj");
    });

    it("handles circular references without throwing", () => {
        const circular: any = { a: 1 };
        circular.self = circular;

        expect(() => {
            const { rerender } = renderHook(() =>
                useAdvancedRenderTracker(
                    "Test",
                    { circular },
                    {},
                    { logToConsole: false, deepCompare: true }
                )
            );
            rerender();
        }).not.toThrow();
    });

    it("treats arrays with same elements as equal", () => {
        let arr = [1, 2, 3];
        const { result, rerender } = renderHook(() =>
            useAdvancedRenderTracker("Test", { arr }, {}, { logToConsole: false, deepCompare: true })
        );

        arr = [1, 2, 3]; // new reference, same content
        rerender();

        const latest = result.current.renderHistory[result.current.renderHistory.length - 1];
        expect(Object.keys(latest.propChanges)).toHaveLength(0);
    });

    it("treats arrays with different lengths as unequal", () => {
        let arr = [1, 2, 3];
        const { result, rerender } = renderHook(() =>
            useAdvancedRenderTracker("Test", { arr }, {}, { logToConsole: false, deepCompare: true })
        );

        arr = [1, 2, 3, 4];
        rerender();

        const latest = result.current.renderHistory[result.current.renderHistory.length - 1];
        expect(latest.propChanges).toHaveProperty("arr");
    });

    it("treats React elements as equal only by reference", () => {
        // React elements have $$typeof — deepEqual should use reference equality for them
        const elem: any = { $$typeof: Symbol.for("react.element"), type: "div", props: {} };
        const { result, rerender } = renderHook(() =>
            useAdvancedRenderTracker("Test", { elem }, {}, { logToConsole: false, deepCompare: true })
        );

        // Same reference — no change
        rerender();
        const latest1 = result.current.renderHistory[result.current.renderHistory.length - 1];
        expect(Object.keys(latest1.propChanges)).toHaveLength(0);
    });
});

describe("useAdvancedRenderTracker — hook dependency tracking", () => {
    beforeEach(() => {
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "group").mockImplementation(() => {});
        vi.spyOn(console, "groupEnd").mockImplementation(() => {});
        vi.spyOn(console, "table").mockImplementation(() => {});
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("detects a changed hook dependency", () => {
        let dep = "a";
        const { result, rerender } = renderHook(() =>
            useAdvancedRenderTracker("Test", {}, { dep }, { logToConsole: false, deepCompare: false })
        );

        dep = "b";
        rerender();

        const latest = result.current.renderHistory[result.current.renderHistory.length - 1];
        expect(latest.hookChanges).toHaveProperty("dep");
        expect(latest.hookChanges.dep.from).toBe("a");
        expect(latest.hookChanges.dep.to).toBe("b");
    });

    it("detects a removed hook dependency (fix #2 parity)", () => {
        let deps: Record<string, any> = { x: 1, y: 2 };
        const { result, rerender } = renderHook(() =>
            useAdvancedRenderTracker("Test", {}, deps, { logToConsole: false, deepCompare: false })
        );

        deps = { x: 1 };
        rerender();

        const latest = result.current.renderHistory[result.current.renderHistory.length - 1];
        expect(latest.hookChanges).toHaveProperty("y");
        expect(latest.hookChanges.y.from).toBe(2);
        expect(latest.hookChanges.y.to).toBeUndefined();
    });

    it("skips hook tracking when trackHooks=false", () => {
        let dep = "a";
        const { result, rerender } = renderHook(() =>
            useAdvancedRenderTracker("Test", {}, { dep }, {
                logToConsole: false,
                trackHooks: false,
                deepCompare: false,
            })
        );

        dep = "b";
        rerender();

        const latest = result.current.renderHistory[result.current.renderHistory.length - 1];
        expect(Object.keys(latest.hookChanges)).toHaveLength(0);
    });
});

describe("useAdvancedRenderTracker — history management", () => {
    beforeEach(() => {
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "group").mockImplementation(() => {});
        vi.spyOn(console, "groupEnd").mockImplementation(() => {});
        vi.spyOn(console, "table").mockImplementation(() => {});
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("respects maxHistory limit", () => {
        let value = 0;
        const { result, rerender } = renderHook(() =>
            useAdvancedRenderTracker("Test", { value }, {}, {
                logToConsole: false,
                maxHistory: 3,
                deepCompare: false,
            })
        );

        // Trigger 10 re-renders
        for (let i = 1; i <= 10; i++) {
            value = i;
            rerender();
        }

        expect(result.current.renderHistory.length).toBeLessThanOrEqual(3);
    });

    it("getCurrentChanges returns latest propChanges and hookChanges merged", () => {
        let value = 1;
        let dep = "x";
        const { result, rerender } = renderHook(() =>
            useAdvancedRenderTracker("Test", { value }, { dep }, { logToConsole: false, deepCompare: false })
        );

        value = 2;
        dep = "y";
        rerender();

        const changes = result.current.getCurrentChanges();
        expect(changes).toHaveProperty("value");
        expect(changes).toHaveProperty("dep");
    });

    it("getCurrentChanges returns empty object if no history", () => {
        // Fresh hook, never rerendered
        const { result } = renderHook(() =>
            useAdvancedRenderTracker("Test", {}, {}, { logToConsole: false })
        );
        // After mount, history has 1 entry with no changes
        const changes = result.current.getCurrentChanges();
        expect(typeof changes).toBe("object");
    });
});

describe("useAdvancedRenderTracker — default options", () => {
    beforeEach(() => {
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "group").mockImplementation(() => {});
        vi.spyOn(console, "groupEnd").mockImplementation(() => {});
        vi.spyOn(console, "table").mockImplementation(() => {});
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("logs to console by default", () => {
        const groupSpy = vi.spyOn(console, "group");
        let value = 1;
        const { rerender } = renderHook(() =>
            useAdvancedRenderTracker("Test", { value })
        );

        value = 2;
        rerender();

        expect(groupSpy).toHaveBeenCalled();
    });

    it("uses deepCompare=true by default (fix #7)", () => {
        // Two objects with same values but different references should NOT show as changed
        let obj = { a: 1 };
        const { result, rerender } = renderHook(() =>
            useAdvancedRenderTracker("Test", { obj }, {}, { logToConsole: false })
            // no deepCompare option — should default to true
        );

        obj = { a: 1 };
        rerender();

        const latest = result.current.renderHistory[result.current.renderHistory.length - 1];
        expect(Object.keys(latest.propChanges)).toHaveLength(0);
    });

    it("uses maxHistory=50 by default (fix #7)", () => {
        let value = 0;
        const { result, rerender } = renderHook(() =>
            useAdvancedRenderTracker("Test", { value }, {}, { logToConsole: false })
        );

        for (let i = 0; i < 60; i++) {
            value = i;
            rerender();
        }

        // Should keep up to 50, not 10
        expect(result.current.renderHistory.length).toBeLessThanOrEqual(50);
        expect(result.current.renderHistory.length).toBeGreaterThan(10);
    });
});

describe("useAdvancedRenderTracker — performance tracking", () => {
    beforeEach(() => {
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "group").mockImplementation(() => {});
        vi.spyOn(console, "groupEnd").mockImplementation(() => {});
        vi.spyOn(console, "table").mockImplementation(() => {});
        
        // Mock performance.now() to control duration
        let time = 1000;
        vi.spyOn(performance, "now").mockImplementation(() => {
            const current = time;
            time += 10; // Increment by 10ms for each call
            return current;
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("captures durationMs on every record", () => {
        const { result, rerender } = renderHook(() =>
            useAdvancedRenderTracker("Test", {}, {}, { logToConsole: false })
        );
        
        expect(result.current.renderHistory[0]).toHaveProperty("durationMs");
        expect(result.current.renderHistory[0].durationMs).toBeGreaterThanOrEqual(0);

        rerender();
        expect(result.current.renderHistory[1]).toHaveProperty("durationMs");
        expect(result.current.renderHistory[1].durationMs).toBeGreaterThanOrEqual(0);
    });

    it("identifies slow renders in console log", () => {
        const groupSpy = vi.mocked(console.group);
        
        // Reset performance.now mock to control it precisely
        let time = 1000;
        vi.mocked(performance.now).mockImplementation(() => {
            const current = time;
            // The hook calls performance.now() twice: once at start, once in useLayoutEffect
            return current;
        });

        const { rerender } = renderHook(({ threshold }) =>
            useAdvancedRenderTracker("Test", {}, {}, { logToConsole: true, slowRenderThresholdMs: threshold }),
            { initialProps: { threshold: 5 } }
        );

        // First render (initial render doesn't use console.group for re-render info)
        
        // Second render: trigger a slow one
        time = 1000;
        // startTime = 1000
        // in useLayoutEffect, performance.now() = 1010 -> duration = 10
        vi.mocked(performance.now).mockImplementation(() => {
            const current = time;
            time += 10;
            return current;
        });
        
        rerender({ threshold: 5 });

        // Check if the last group call includes the SLOW warning
        const lastCall = groupSpy.mock.calls[groupSpy.mock.calls.length - 1][0];
        expect(lastCall).toContain("⚠️ SLOW");
    });
});
