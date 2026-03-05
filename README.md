# React Rerender Hook

A powerful React hook and overlay component to track, debug, and visualize component re-renders. Identify why your components are re-rendering with detailed prop and hook dependency tracking.

## Features

- 🔄 **Track Re-renders**: Keep count of how many times a component renders.
- 📝 **Prop Tracking**: See exactly which props changed between renders.
- 🎣 **Hook Dependency Tracking**: Monitor changes in internal hook dependencies.
- 🔍 **Deep Comparison**: Optional deep equality check for complex objects.
- 📊 **Visual Overlay**: An interactive, draggable, and resizable overlay to inspect render history.
- 🪵 **Console Logging**: Detailed, grouped console logs with tables of changes.

## Usage

### `useAdvancedRenderTracker`

Add the hook to your component to start tracking renders.

```tsx
import { useAdvancedRenderTracker } from './rerender-hook/AdvancedRenderTrackerHook';

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

### `AdvancedRenderTrackerOverlay`

To see the render history in a visual overlay, use the `AdvancedRenderTrackerOverlay` component.

```tsx
import React, { useState } from 'react';
import { useAdvancedRenderTracker } from './rerender-hook/AdvancedRenderTrackerHook';
import { AdvancedRenderTrackerOverlay } from './rerender-hook/AdvancedRenderTrackerOverlay';

const DebuggableComponent = (props) => {
  const [showOverlay, setShowOverlay] = useState(true);
  const { renderHistory } = useAdvancedRenderTracker('DebuggableComponent', props);

  return (
    <div>
      <h1>My App</h1>
      
      {showOverlay && (
        <AdvancedRenderTrackerOverlay 
          history={renderHistory} 
          name="DebuggableComponent"
          onClose={() => setShowOverlay(false)}
        />
      )}
      
      {/* Component Content */}
    </div>
  );
};
```

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
| `deepCompare` | `boolean` | `false` | Use deep equality for comparisons. |
| `maxHistory` | `number` | `10` | Number of renders to keep in history. |

### `AdvancedRenderTrackerOverlay`

| Prop | Type | Description |
| :--- | :--- | :--- |
| `history` | `Array` | The history array returned by `useAdvancedRenderTracker`. |
| `name` | `string` | (Optional) Name to display in the header. |
| `onClose` | `function` | (Optional) Callback when the close button is clicked. |