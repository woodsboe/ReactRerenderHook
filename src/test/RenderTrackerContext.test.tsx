import React, { useEffect } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useAdvancedRenderTracker } from "../AdvancedRenderTrackerHook";
import { AdvancedRenderTrackerOverlay } from "../AdvancedRenderTrackerOverlay";
import {
    RenderTrackerProvider,
    useRenderTrackerContext,
    type TrackedRenderHistory,
} from "../RenderTrackerContext";

const TrackedComponent = ({ name, value }: { name: string; value: unknown }) => {
    useAdvancedRenderTracker(name, { value }, {}, { logToConsole: false, deepCompare: false });

    return <div>{name} content</div>;
};

const SnapshotProbe = ({
    onSnapshot,
}: {
    onSnapshot: (components: TrackedRenderHistory[]) => void;
}) => {
    const { components } = useRenderTrackerContext();

    useEffect(() => {
        onSnapshot(components);
    }, [components, onSnapshot]);

    return null;
};

describe("RenderTrackerProvider", () => {
    beforeEach(() => {
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "group").mockImplementation(() => {});
        vi.spyOn(console, "groupEnd").mockImplementation(() => {});
        vi.spyOn(console, "table").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("aggregates render histories for multiple tracked components", async () => {
        const snapshots: TrackedRenderHistory[][] = [];

        render(
            <RenderTrackerProvider>
                <TrackedComponent name="FirstTracked" value={1} />
                <TrackedComponent name="SecondTracked" value="two" />
                <SnapshotProbe onSnapshot={(components) => snapshots.push(components)} />
            </RenderTrackerProvider>
        );

        await waitFor(() => {
            const latest = snapshots[snapshots.length - 1];
            expect(latest.map((component) => component.name).sort()).toEqual([
                "FirstTracked",
                "SecondTracked",
            ]);
            expect(latest.every((component) => component.history.length > 0)).toBe(true);
        });
    });

    it("lets the overlay render multiple provider-tracked components without history props", async () => {
        render(
            <RenderTrackerProvider>
                <TrackedComponent name="OverlayFirst" value={1} />
                <TrackedComponent name="OverlaySecond" value="two" />
                <AdvancedRenderTrackerOverlay />
            </RenderTrackerProvider>
        );

        await waitFor(() => {
            expect(screen.getByRole("tab", { name: /OverlayFirst/ })).toBeInTheDocument();
            expect(screen.getByRole("tab", { name: /OverlaySecond/ })).toBeInTheDocument();
        });
    });
});
