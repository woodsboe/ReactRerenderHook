import { useState } from 'react'
import {
  useAdvancedRenderTracker,
  AdvancedRenderTrackerOverlay,
  RenderTrackerProvider,
} from 'react-rerender-hook'

// ─── Demo 1: Prop change tracking ─────────────────────────────────────────
interface CounterProps {
  count: number
  label: string
  theme: string
}

function CounterDisplay({ count, label, theme }: CounterProps) {
  const { renderCount, renderHistory } = useAdvancedRenderTracker(
    'CounterDisplay',
    { count, label, theme },
    {},
    { logToConsole: false },
  )
  const last = renderHistory[renderHistory.length - 1]
  return (
    <div className="component-box">
      <div className="box-label">CounterDisplay component</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          {label}: <strong>{count}</strong> &nbsp;·&nbsp; Theme: <code>{theme}</code>
        </span>
        <span className="render-badge">Renders: {renderCount}</span>
      </div>
      {last && Object.keys(last.propChanges).length > 0 && (
        <div className="hint">
          Last changed props: {Object.keys(last.propChanges).join(', ')}
        </div>
      )}
    </div>
  )
}

// ─── Demo 2: Deep vs. shallow comparison ──────────────────────────────────
interface UserCardProps {
  user: { name: string; age: number }
  deepCompare: boolean
}

function UserCard({ user, deepCompare }: UserCardProps) {
  const { renderCount, renderHistory } = useAdvancedRenderTracker(
    'UserCard',
    { user },
    {},
    { deepCompare, logToConsole: false },
  )
  const last = renderHistory[renderHistory.length - 1]
  return (
    <div className="component-box">
      <div className="box-label">UserCard component</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          {user.name}, age {user.age}
        </span>
        <span className="render-badge">Renders: {renderCount}</span>
      </div>
      {last && (
        <div className="hint">
          Mode: <code>{deepCompare ? 'deepCompare' : 'shallow'}</code> &nbsp;·&nbsp; Last reason:{' '}
          {Object.keys(last.propChanges).join(', ') || '(no prop change detected)'}
        </div>
      )}
    </div>
  )
}

// ─── Demo 3: Hook dependency tracking ─────────────────────────────────────
interface FilteredListProps {
  items: string[]
  filter: string
}

function FilteredList({ items, filter }: FilteredListProps) {
  const filtered = items.filter((i) => i.toLowerCase().includes(filter.toLowerCase()))
  const { renderCount, renderHistory } = useAdvancedRenderTracker(
    'FilteredList',
    { filter },
    { filteredCount: filtered.length },
    { logToConsole: false },
  )
  const last = renderHistory[renderHistory.length - 1]
  return (
    <div className="component-box">
      <div className="box-label">FilteredList component</div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <span>
          Showing {filtered.length} / {items.length}
        </span>
        <span className="render-badge">Renders: {renderCount}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {filtered.map((item) => (
          <span
            key={item}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 5,
              padding: '2px 8px',
              fontSize: '0.8rem',
              color: '#e2e8f0',
            }}
          >
            {item}
          </span>
        ))}
        {filtered.length === 0 && (
          <span style={{ color: '#475569' }}>No matches</span>
        )}
      </div>
      {last && Object.keys(last.hookChanges).length > 0 && (
        <div className="hint">
          Hook deps changed: {Object.keys(last.hookChanges).join(', ')}
        </div>
      )}
    </div>
  )
}

// ─── Demo 4: Global visual overlay ─────────────────────────────────────────
interface OverlayDemoProps {
  value: string
  counter: number
}

function OverlayMetricCard({ value, counter }: OverlayDemoProps) {
  const { renderCount, renderHistory } = useAdvancedRenderTracker(
    'OverlayMetricCard',
    { value, counter },
    {},
    { logToConsole: false },
  )
  const last = renderHistory[renderHistory.length - 1]

  return (
    <div className="component-box">
      <div className="box-label">OverlayMetricCard component</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          value: <code>{value}</code> &nbsp;·&nbsp; counter: <strong>{counter}</strong>
        </span>
        <span className="render-badge">Renders: {renderCount}</span>
      </div>
      {last && Object.keys(last.propChanges).length > 0 && (
        <div className="hint">Last changed props: {Object.keys(last.propChanges).join(', ')}</div>
      )}
    </div>
  )
}

function OverlayTextPreview({ value }: { value: string }) {
  const normalized = value.trim().toLowerCase()
  const { renderCount, renderHistory } = useAdvancedRenderTracker(
    'OverlayTextPreview',
    { value },
    { normalizedLength: normalized.length },
    { logToConsole: false },
  )
  const last = renderHistory[renderHistory.length - 1]

  return (
    <div className="component-box">
      <div className="box-label">OverlayTextPreview component</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          normalized: <code>{normalized || '(empty)'}</code>
        </span>
        <span className="render-badge">Renders: {renderCount}</span>
      </div>
      {last && Object.keys(last.hookChanges).length > 0 && (
        <div className="hint">Hook deps changed: {Object.keys(last.hookChanges).join(', ')}</div>
      )}
    </div>
  )
}

function OverlayPanelController() {
  const [showOverlay, setShowOverlay] = useState(true)

  return (
    <>
      <div className="controls" style={{ marginTop: 10 }}>
        <button
          className="secondary"
          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
          onClick={() => setShowOverlay((v) => !v)}
        >
          {showOverlay ? 'Hide' : 'Show'} overlay
        </button>
      </div>
      {showOverlay && <AdvancedRenderTrackerOverlay onClose={() => setShowOverlay(false)} />}
    </>
  )
}

// ─── App ───────────────────────────────────────────────────────────────────
export default function App() {
  // Demo 1
  const [count, setCount] = useState(0)
  const [label, setLabel] = useState('Count')
  const [theme, setTheme] = useState('blue')

  // Demo 2
  const [userName, setUserName] = useState('Alice')
  const [userAge, setUserAge] = useState(30)
  const [deepCompare, setDeepCompare] = useState(true)
  // Deliberately create a new object reference on every parent render
  const userObj = { name: userName, age: userAge }

  // Demo 3
  const [filter, setFilter] = useState('')
  const items = ['React', 'Vue', 'Angular', 'Svelte', 'Solid', 'Preact', 'Qwik', 'Remix']

  // Demo 4
  const [overlayValue, setOverlayValue] = useState('hello')
  const [overlayCounter, setOverlayCounter] = useState(0)

  return (
    <div>
      <h1>ReactRerenderHook</h1>
      <p>
        Interactive demo of <code>useAdvancedRenderTracker</code> and{' '}
        <code>AdvancedRenderTrackerOverlay</code>. Each section shows a component tracking its own
        re-renders. Check the browser console for detailed logs.
      </p>

      {/* ── 1 ── */}
      <div className="section">
        <div className="section-title">1 — Prop change tracking</div>
        <div className="section-desc">
          Interact with the controls to change individual props. The component shows which props
          changed on the last render.
        </div>
        <div className="controls">
          <button onClick={() => setCount((c) => c + 1)}>+ Count</button>
          <button className="secondary" onClick={() => setCount((c) => c - 1)}>
            − Count
          </button>
          <label>
            Label:
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} />
          </label>
          <label>
            Theme:
            <input type="text" value={theme} onChange={(e) => setTheme(e.target.value)} />
          </label>
        </div>
        <CounterDisplay count={count} label={label} theme={theme} />
      </div>

      {/* ── 2 ── */}
      <div className="section">
        <div className="section-title">2 — Deep vs. shallow comparison</div>
        <div className="section-desc">
          The user object is recreated on every parent render. With{' '}
          <code>deepCompare: true</code>, re-renders are only counted when the values actually
          differ. Toggle the checkbox and click "Re-render parent" to see the difference.
        </div>
        <div className="controls">
          <button onClick={() => setUserAge((a) => a + 1)}>Birthday +1</button>
          <button
            className="secondary"
            onClick={() => setUserName((n) => (n === 'Alice' ? 'Bob' : 'Alice'))}
          >
            Toggle name
          </button>
          <label>
            <input
              type="checkbox"
              checked={deepCompare}
              onChange={(e) => setDeepCompare(e.target.checked)}
            />
            deepCompare
          </label>
          <button className="secondary" onClick={() => setCount((c) => c + 1)}>
            Re-render parent (count++)
          </button>
        </div>
        <UserCard user={userObj} deepCompare={deepCompare} />
        <div className="hint" style={{ marginTop: 8 }}>
          With deepCompare <strong>on</strong>: clicking "Re-render parent" does not increase
          UserCard's render count because the object values haven't changed. With it{' '}
          <strong>off</strong>, every new object reference counts as a change.
        </div>
      </div>

      {/* ── 3 ── */}
      <div className="section">
        <div className="section-title">3 — Hook dependency tracking</div>
        <div className="section-desc">
          In addition to props, the hook can track arbitrary computed values as "hook dependencies".
          Here <code>filteredCount</code> is passed as a hook dep — it changes only when the filter
          actually produces a different result count.
        </div>
        <div className="controls">
          <label>
            Filter:
            <input
              type="text"
              placeholder="e.g. re"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </label>
        </div>
        <FilteredList items={items} filter={filter} />
      </div>

      {/* ── 4 ── */}
      <div className="section">
        <div className="section-title">4 — Visual overlay</div>
        <div className="section-desc">
          <code>RenderTrackerProvider</code> aggregates multiple tracked components into one
          draggable, resizable <code>AdvancedRenderTrackerOverlay</code> panel.
        </div>
        <div className="controls">
          <button onClick={() => setOverlayCounter((c) => c + 1)}>Increment counter</button>
          <label>
            Value:
            <input
              type="text"
              value={overlayValue}
              onChange={(e) => setOverlayValue(e.target.value)}
            />
          </label>
        </div>
        <RenderTrackerProvider>
          <OverlayMetricCard value={overlayValue} counter={overlayCounter} />
          <OverlayTextPreview value={overlayValue} />
          <OverlayPanelController />
        </RenderTrackerProvider>
      </div>
    </div>
  )
}
