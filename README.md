# React Rerender Hook

A powerful React hook and overlay component to track, debug, and visualize component re-renders. Identify why your components are re-rendering with detailed prop and hook dependency tracking.

## Features

- 🔄 **Track Re-renders**: Keep count of how many times a component renders.
- 📝 **Prop Tracking**: See exactly which props changed between renders.
- 🎣 **Hook Dependency Tracking**: Monitor changes in internal hook dependencies.
- 🔍 **Deep Comparison**: Optional deep equality check for complex objects.
- 📊 **Visual Overlay**: An interactive, draggable, and resizable overlay to inspect render history.
- 🧩 **Shared Provider**: Aggregate multiple tracked components into one global overlay.
- 🪵 **Console Logging**: Detailed, grouped console logs with tables of changes.

## Installation

Install the package via your favorite package manager:

```bash
npm install react-rerender-hook
# or
yarn add react-rerender-hook
# or
pnpm add react-rerender-hook
```

### Install from Git

Since this package is configured with a `prepare` script, you can also install it directly from GitHub:

```bash
npm install -D https://github.com/woodsboe/ReactRerenderHook
# or
yarn add https://github.com/woodsboe/ReactRerenderHook
# or
pnpm add https://github.com/woodsboe/ReactRerenderHook
```

## Usage

### `useAdvancedRenderTracker`

Add the hook to your component to start tracking renders.

```tsx
import { useAdvancedRenderTracker } from 'react-rerender-hook';

const MyComponent = (props) => {
  const { renderHistory } = useAdvancedRenderTracker('MyComponent', props, {
    // Track internal dependencies that might cause re-renders
    someInternalValue: props.data?.id,
  });

  return (
    <div>
      {/* Your component logic */}
    </div>
  );
};
```

### `RenderTrackerProvider` and `AdvancedRenderTrackerOverlay`

Wrap a section of your app with `RenderTrackerProvider` to aggregate all tracked children into one shared overlay. The overlay reads from context, so you do not need to pass `renderHistory` through props.

```tsx
import React, { useState } from 'react';
import {
  useAdvancedRenderTracker,
  RenderTrackerProvider,
  AdvancedRenderTrackerOverlay,
} from 'react-rerender-hook';

const Header = ({ title }) => {
  useAdvancedRenderTracker('Header', { title });
  return <h1>{title}</h1>;
};

const Counter = ({ count }) => {
  useAdvancedRenderTracker('Counter', { count });
  return <strong>{count}</strong>;
};

const DebugPanel = () => {
  const [showOverlay, setShowOverlay] = useState(true);

  return showOverlay ? (
    <AdvancedRenderTrackerOverlay onClose={() => setShowOverlay(false)} />
  ) : null;
};

const App = () => (
  <RenderTrackerProvider>
    <Header title="My App" />
    <Counter count={1} />
    <DebugPanel />
  </RenderTrackerProvider>
);
```

You can still pass `history` and `name` directly to `AdvancedRenderTrackerOverlay` for the legacy single-component view.

## API Reference

### `useAdvancedRenderTracker(name, props, hookDependencies?, options?)`

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | Name of the component for logging and identification. |
| `props` | `object` | The component's props to track. |
| `hookDependencies` | `object` | (Optional) Internal values/dependencies to track. |
| `options` | `object` | (Optional) Configuration options (see below). |

#### Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `logToConsole` | `boolean` | `true` | Whether to log changes to the browser console. |
| `trackHooks` | `boolean` | `true` | Whether to track `hookDependencies`. |
| `deepCompare` | `boolean` | `true` | Use deep equality for comparisons. |
| `maxHistory` | `number` | `50` | Number of renders to keep in history. |

### `RenderTrackerProvider`

| Prop | Type | Description |
| :--- | :--- | :--- |
| `children` | `ReactNode` | Components that can register render history in the shared store. |

### `useRenderTrackerContext()`

Returns `{ components }`, where each component includes `id`, `name`, `renderCount`, `history`, and `updatedAt`. Must be used inside `RenderTrackerProvider`.

### `AdvancedRenderTrackerOverlay`

| Prop | Type | Description |
| :--- | :--- | :--- |
| `history` | `Array` | (Optional) Legacy single-component history array returned by `useAdvancedRenderTracker`. If omitted, the overlay reads all tracked components from `RenderTrackerProvider`. |
| `name` | `string` | (Optional) Name to display for the legacy single-component view. |
| `onClose` | `function` | (Optional) Callback when the close button is clicked. |