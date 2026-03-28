import { useState, useEffect, useRef } from 'react';
import type { MindMap, MindMapNode, ViewState } from '../types';

export interface LogEntry {
  id: number;
  time: number;
  action: string;
  detail: string;
  type: 'node' | 'connection' | 'view' | 'map' | 'clipboard' | 'test';
}

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'pending' | 'running';
  detail?: string;
}

interface Props {
  map: MindMap;
  view: ViewState;
  selectedId: string | null;
  selectedConnectionId: string | null;
  connectingFrom: string | null;
  clipboard: MindMapNode | null;
  canUndo: boolean;
  canRedo: boolean;
  searchQuery: string;
  logs: LogEntry[];
  onRunTest: (testName: string) => void;
  onRunAllTests: () => void;
  onClose: () => void;
}

export function TestingPanel({
  map,
  view,
  selectedId,
  selectedConnectionId,
  connectingFrom,
  clipboard,
  canUndo,
  canRedo,
  searchQuery,
  logs,
  onRunTest,
  onRunAllTests,
  onClose,
}: Props) {
  const [tab, setTab] = useState<'state' | 'tests' | 'log'>('tests');
  const [testResults, setTestResults] = useState<TestResult[]>(defaultTests);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tab === 'log') {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length, tab]);

  // Auto-detect test results from state
  useEffect(() => {
    setTestResults(prev => prev.map(t => {
      switch (t.name) {
        case 'Nodes exist':
          return { ...t, status: map.nodes.length > 0 ? 'pass' : 'pending', detail: `${map.nodes.length} nodes` };
        case 'Connections exist':
          return { ...t, status: map.connections.length > 0 ? 'pass' : 'pending', detail: `${map.connections.length} connections` };
        case 'Node selected':
          return { ...t, status: selectedId ? 'pass' : 'pending', detail: selectedId ? `ID: ${selectedId.slice(0, 8)}...` : 'None' };
        case 'Connection selected':
          return { ...t, status: selectedConnectionId ? 'pass' : 'pending', detail: selectedConnectionId ? 'Active' : 'None' };
        case 'Undo available':
          return { ...t, status: canUndo ? 'pass' : 'pending', detail: canUndo ? 'History has entries' : 'Empty history' };
        case 'Redo available':
          return { ...t, status: canRedo ? 'pass' : 'pending', detail: canRedo ? 'Future has entries' : 'Empty' };
        case 'Clipboard has data':
          return { ...t, status: clipboard ? 'pass' : 'pending', detail: clipboard ? `"${clipboard.text}"` : 'Empty' };
        case 'Zoom changed':
          return { ...t, status: view.zoom !== 1 ? 'pass' : 'pending', detail: `${Math.round(view.zoom * 100)}%` };
        case 'Pan changed':
          return { ...t, status: (view.panX !== 0 || view.panY !== 0) ? 'pass' : 'pending', detail: `(${Math.round(view.panX)}, ${Math.round(view.panY)})` };
        case 'Search active':
          return { ...t, status: searchQuery ? 'pass' : 'pending', detail: searchQuery || 'Inactive' };
        case 'Connect mode':
          return { ...t, status: connectingFrom ? 'pass' : 'pending', detail: connectingFrom ? 'Active' : 'Inactive' };
        case 'Multiple roots':
          return { ...t, status: map.nodes.filter(n => n.parentId === null).length > 1 ? 'pass' : 'pending', detail: `${map.nodes.filter(n => n.parentId === null).length} roots` };
        case 'Child nodes exist':
          return { ...t, status: map.nodes.some(n => n.parentId !== null) ? 'pass' : 'pending', detail: `${map.nodes.filter(n => n.parentId !== null).length} children` };
        case 'Node colors varied':
          return { ...t, status: new Set(map.nodes.map(n => n.color)).size > 1 ? 'pass' : 'pending', detail: `${new Set(map.nodes.map(n => n.color)).size} colors` };
        case 'Node text edited':
          return { ...t, status: map.nodes.some(n => n.text !== 'Central Idea' && n.text !== 'New Idea') ? 'pass' : 'pending' };
        case 'Node resized':
          return { ...t, status: map.nodes.some(n => (n.width !== 140 && n.width !== 180) || (n.height !== 44 && n.height !== 60)) ? 'pass' : 'pending' };
        case 'Auto-layout used':
          return { ...t, status: logs.some(l => l.action === 'auto-layout') ? 'pass' : 'pending' };
        case 'Context menu opened':
          return { ...t, status: logs.some(l => l.action === 'context-menu') ? 'pass' : 'pending' };
        case 'Export triggered':
          return { ...t, status: logs.some(l => l.action === 'export') ? 'pass' : 'pending' };
        default:
          return t;
      }
    }));
  }, [map, view, selectedId, selectedConnectionId, connectingFrom, clipboard, canUndo, canRedo, searchQuery, logs]);

  const passCount = testResults.filter(t => t.status === 'pass').length;
  const totalCount = testResults.length;
  const pct = Math.round((passCount / totalCount) * 100);

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: pct === 100 ? '#059669' : pct > 50 ? '#F59E0B' : '#94A3B8' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            UI Testing
          </span>
          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
            {passCount}/{totalCount}
          </span>
        </div>
        <button onClick={onClose} style={closeBtnStyle}>&times;</button>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '0 16px 8px', flexShrink: 0 }}>
        <div style={{ height: 4, background: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: pct === 100 ? '#059669' : pct > 50 ? '#F59E0B' : '#4F46E5',
            borderRadius: 2,
            transition: 'width 0.3s, background 0.3s',
          }} />
        </div>
        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, textAlign: 'center' }}>
          {pct}% complete — interact with the app to pass tests
        </div>
      </div>

      {/* Tabs */}
      <div style={tabBarStyle}>
        {(['tests', 'state', 'log'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              ...tabStyle,
              color: tab === t ? '#4F46E5' : '#64748B',
              borderBottom: tab === t ? '2px solid #4F46E5' : '2px solid transparent',
              fontWeight: tab === t ? 700 : 500,
            }}
          >
            {t === 'tests' ? `Tests (${passCount}/${totalCount})` : t === 'state' ? 'Live State' : `Log (${logs.length})`}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={bodyStyle}>
        {tab === 'tests' && (
          <>
            <button onClick={onRunAllTests} style={runAllBtnStyle}>
              Run All Tests
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {testResults.map((t, i) => (
                <div key={i} style={testRowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>
                      {t.status === 'pass' ? '✅' : t.status === 'fail' ? '❌' : t.status === 'running' ? '⏳' : '⬜'}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.name}
                      </div>
                      {t.detail && (
                        <div style={{ fontSize: 10, color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.detail}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onRunTest(t.name)}
                    style={runBtnStyle}
                    title={`Run "${t.name}"`}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'state' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <StateSection title="Map">
              <StateRow label="Name" value={map.name} />
              <StateRow label="ID" value={map.id.slice(0, 8) + '...'} />
              <StateRow label="Nodes" value={String(map.nodes.length)} />
              <StateRow label="Connections" value={String(map.connections.length)} />
              <StateRow label="Roots" value={String(map.nodes.filter(n => !n.parentId).length)} />
            </StateSection>

            <StateSection title="Selection">
              <StateRow label="Node" value={selectedId ? selectedId.slice(0, 8) + '...' : 'none'} highlight={!!selectedId} />
              <StateRow label="Connection" value={selectedConnectionId ? selectedConnectionId.slice(0, 8) + '...' : 'none'} highlight={!!selectedConnectionId} />
              <StateRow label="Connecting" value={connectingFrom ? connectingFrom.slice(0, 8) + '...' : 'off'} highlight={!!connectingFrom} />
            </StateSection>

            <StateSection title="View">
              <StateRow label="Zoom" value={`${Math.round(view.zoom * 100)}%`} />
              <StateRow label="Pan X" value={String(Math.round(view.panX))} />
              <StateRow label="Pan Y" value={String(Math.round(view.panY))} />
            </StateSection>

            <StateSection title="History">
              <StateRow label="Can Undo" value={canUndo ? 'Yes' : 'No'} highlight={canUndo} />
              <StateRow label="Can Redo" value={canRedo ? 'Yes' : 'No'} highlight={canRedo} />
            </StateSection>

            <StateSection title="Clipboard">
              <StateRow label="Has Data" value={clipboard ? 'Yes' : 'No'} highlight={!!clipboard} />
              {clipboard && <StateRow label="Text" value={clipboard.text} />}
            </StateSection>

            <StateSection title="Search">
              <StateRow label="Query" value={searchQuery || '(empty)'} highlight={!!searchQuery} />
              {searchQuery && <StateRow label="Matches" value={String(map.nodes.filter(n => n.text.toLowerCase().includes(searchQuery.toLowerCase())).length)} />}
            </StateSection>

            {selectedId && (() => {
              const node = map.nodes.find(n => n.id === selectedId);
              if (!node) return null;
              return (
                <StateSection title="Selected Node">
                  <StateRow label="Text" value={node.text} />
                  <StateRow label="Color" value={node.color} />
                  <StateRow label="Size" value={`${node.width}x${node.height}`} />
                  <StateRow label="Position" value={`(${Math.round(node.position.x)}, ${Math.round(node.position.y)})`} />
                  <StateRow label="Font" value={`${node.fontSize}px`} />
                  <StateRow label="Type" value={node.parentId ? 'Child' : 'Root'} />
                </StateSection>
              );
            })()}
          </div>
        )}

        {tab === 'log' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {logs.length === 0 ? (
              <div style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: 20 }}>
                Interact with the app to see events here
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} style={logRowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, flexShrink: 0 }}>{typeEmoji(log.type)}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#1E293B' }}>{log.action}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                      {log.detail}
                    </span>
                    <span style={{ fontSize: 10, color: '#CBD5E1', flexShrink: 0 }}>
                      {formatTime(log.time)}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Helpers ── */

function StateSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', background: '#F1F5F9', borderBottom: '1px solid #E2E8F0' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{title}</span>
      </div>
      <div style={{ padding: '4px 0' }}>
        {children}
      </div>
    </div>
  );
}

function StateRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 10px' }}>
      <span style={{ fontSize: 11, color: '#94A3B8' }}>{label}</span>
      <span style={{
        fontSize: 11,
        fontWeight: 600,
        color: highlight ? '#4F46E5' : '#475569',
        fontFamily: 'monospace',
        maxWidth: 140,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {value}
      </span>
    </div>
  );
}

function typeEmoji(type: LogEntry['type']) {
  switch (type) {
    case 'node': return '🔵';
    case 'connection': return '🔗';
    case 'view': return '🔍';
    case 'map': return '🗺️';
    case 'clipboard': return '📋';
    case 'test': return '🧪';
  }
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const defaultTests: TestResult[] = [
  { name: 'Nodes exist', status: 'pending' },
  { name: 'Child nodes exist', status: 'pending' },
  { name: 'Multiple roots', status: 'pending' },
  { name: 'Connections exist', status: 'pending' },
  { name: 'Node selected', status: 'pending' },
  { name: 'Connection selected', status: 'pending' },
  { name: 'Node text edited', status: 'pending' },
  { name: 'Node colors varied', status: 'pending' },
  { name: 'Node resized', status: 'pending' },
  { name: 'Zoom changed', status: 'pending' },
  { name: 'Pan changed', status: 'pending' },
  { name: 'Undo available', status: 'pending' },
  { name: 'Redo available', status: 'pending' },
  { name: 'Clipboard has data', status: 'pending' },
  { name: 'Search active', status: 'pending' },
  { name: 'Connect mode', status: 'pending' },
  { name: 'Auto-layout used', status: 'pending' },
  { name: 'Context menu opened', status: 'pending' },
  { name: 'Export triggered', status: 'pending' },
];

/* ── Styles ── */

const panelStyle: React.CSSProperties = {
  width: 300,
  height: '100%',
  background: '#FFFFFF',
  borderLeft: '1px solid #E2E8F0',
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid #E2E8F0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: '#F8FAFC',
  flexShrink: 0,
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: 20,
  color: '#94A3B8',
  cursor: 'pointer',
  padding: '2px 6px',
  borderRadius: 4,
  lineHeight: 1,
};

const tabBarStyle: React.CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid #E2E8F0',
  flexShrink: 0,
};

const tabStyle: React.CSSProperties = {
  flex: 1,
  background: 'none',
  border: 'none',
  padding: '8px 4px',
  fontSize: 11,
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'all 0.15s',
  textAlign: 'center',
};

const bodyStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '10px 12px',
};

const runAllBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: '#4F46E5',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  marginBottom: 8,
  transition: 'background 0.15s',
};

const testRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 8px',
  borderRadius: 6,
  background: '#FAFBFC',
  border: '1px solid #F1F5F9',
  gap: 4,
};

const runBtnStyle: React.CSSProperties = {
  background: '#F1F5F9',
  border: '1px solid #E2E8F0',
  borderRadius: 5,
  padding: '4px 6px',
  cursor: 'pointer',
  color: '#64748B',
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const logRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '5px 8px',
  borderRadius: 4,
  borderBottom: '1px solid #F8FAFC',
  gap: 4,
};
