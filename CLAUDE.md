# ReactRerenderHook

A React library for tracking, debugging, and visualizing component re-renders.

## Project Purpose

Provides a hook (`useAdvancedRenderTracker`) and visual overlay component (`AdvancedRenderTrackerOverlay`) to help developers identify why components re-render, with detailed prop and hook dependency change tracking.

## Tech Stack

- **Language:** TypeScript (strict mode, ESNext target)
- **Framework:** React 18 (peer dependency)
- **Bundler:** tsup (esbuild-based)
- **Output formats:** CommonJS, ESM, with `.d.ts` type definitions

## Commands

```bash
npm run build   # Production build (CJS + ESM, minified, with type defs)
npm run dev     # Watch mode for development
npm run lint    # TypeScript type checking (tsc --noEmit)
```

## Project Structure

```
src/
  index.ts                         # Public API entry point
  AdvancedRenderTrackerHook.ts     # Core hook and deep equality logic
  AdvancedRenderTrackerOverlay.tsx # Draggable/resizable visual overlay UI
dist/                              # Compiled output (gitignored)
```

## Key APIs

### `useAdvancedRenderTracker(name, props, hookDependencies?, options?)`

Tracks re-renders for a component. Returns render history with timestamps and change details.

Options:
- `logToConsole` — log render info to console (default: `true`)
- `trackHooks` — track hook dependency changes (default: `true`)
- `deepCompare` — use deep equality for change detection (default: `true`)
- `maxHistory` — max render records to retain (default: `50`)

### `AdvancedRenderTrackerOverlay`

Interactive overlay component that displays render history. Draggable, resizable, collapsible.

## Architecture Notes

- Deep equality utility includes circular reference protection
- Safe JSON serialization handles React elements and DOM nodes
- No runtime dependencies — only React as a peer dependency
- The overlay uses custom `useResizable` and `useDraggable` hooks internally
