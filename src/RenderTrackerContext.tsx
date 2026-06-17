import React, { createContext, useContext, useMemo, useReducer } from "react";
import type { RenderRecord } from "./AdvancedRenderTrackerHook";

export interface TrackedRenderHistory {
    id: string;
    name: string;
    renderCount: number;
    history: RenderRecord[];
    updatedAt: number;
}

export interface RenderTrackerContextValue {
    components: TrackedRenderHistory[];
}

interface InternalRenderTrackerState {
    components: Record<string, TrackedRenderHistory>;
    order: string[];
}

interface RecordComponentAction {
    type: "record";
    component: TrackedRenderHistory;
}

interface UnregisterComponentAction {
    type: "unregister";
    id: string;
}

type RenderTrackerAction = RecordComponentAction | UnregisterComponentAction;

interface RenderTrackerDispatchContextValue {
    recordComponent: (component: TrackedRenderHistory) => void;
    unregisterComponent: (id: string) => void;
}

const RenderTrackerStateContext = createContext<RenderTrackerContextValue | null>(null);
const RenderTrackerDispatchContext = createContext<RenderTrackerDispatchContextValue | null>(null);

const initialState: InternalRenderTrackerState = {
    components: {},
    order: [],
};

const renderTrackerReducer = (
    state: InternalRenderTrackerState,
    action: RenderTrackerAction
): InternalRenderTrackerState => {
    switch (action.type) {
        case "record": {
            const existing = state.components[action.component.id];
            const order = existing ? state.order : [...state.order, action.component.id];

            return {
                order,
                components: {
                    ...state.components,
                    [action.component.id]: {
                        ...action.component,
                        history: action.component.history.slice(),
                    },
                },
            };
        }
        case "unregister": {
            if (!state.components[action.id]) {
                return state;
            }

            const { [action.id]: _removed, ...components } = state.components;

            return {
                components,
                order: state.order.filter((id) => id !== action.id),
            };
        }
        default:
            return state;
    }
};

export const RenderTrackerProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(renderTrackerReducer, initialState);

    const dispatchValue = useMemo<RenderTrackerDispatchContextValue>(
        () => ({
            recordComponent: (component) => dispatch({ type: "record", component }),
            unregisterComponent: (id) => dispatch({ type: "unregister", id }),
        }),
        []
    );

    const stateValue = useMemo<RenderTrackerContextValue>(
        () => ({
            components: state.order
                .map((id) => state.components[id])
                .filter((component): component is TrackedRenderHistory => Boolean(component)),
        }),
        [state]
    );

    return (
        <RenderTrackerDispatchContext.Provider value={dispatchValue}>
            <RenderTrackerStateContext.Provider value={stateValue}>
                {children}
            </RenderTrackerStateContext.Provider>
        </RenderTrackerDispatchContext.Provider>
    );
};

export const useRenderTrackerContext = (): RenderTrackerContextValue => {
    const context = useContext(RenderTrackerStateContext);

    if (!context) {
        throw new Error("useRenderTrackerContext must be used within a RenderTrackerProvider.");
    }

    return context;
};

export const useOptionalRenderTrackerContext = (): RenderTrackerContextValue | null =>
    useContext(RenderTrackerStateContext);

export const useOptionalRenderTrackerDispatch = (): RenderTrackerDispatchContextValue | null =>
    useContext(RenderTrackerDispatchContext);
