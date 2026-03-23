import { useState, useEffect } from 'react';
import type { MindMap, MindMapNode } from '../types';

const NODE_COLORS = [
  '#4F46E5', '#7C3AED', '#DB2777', '#DC2626',
  '#EA580C', '#CA8A04', '#16A34A', '#0891B2',
  '#2563EB', '#9333EA', '#0D9488', '#F59E0B',
  '#64748B', '#1E293B',
];

interface Props {
  map: MindMap;
  selectedNode: MindMapNode | null;
  onUpdate: (id: string, updates: Partial<MindMapNode>) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
  onStartConnect: (id: string) => void;
  onDeselect: () => void;
  onAutoLayout: () => void;
}

export function PropertiesPanel({ map, selectedNode, onUpdate, onAddChild, onDelete, onStartConnect, onDeselect, onAutoLayout }: Props) {
  return (
    <div style={panelStyle}>
      {selectedNode ? (
        <NodeEditor
          node={selectedNode}
          onUpdate={onUpdate}
          onAddChild={onAddChild}
          onDelete={onDelete}
          onStartConnect={onStartConnect}
          onDeselect={onDeselect}
        />
      ) : (
        <MapOverview map={map} onAutoLayout={onAutoLayout} />
      )}
    </div>
  );
}

/* ── Map Overview (no node selected) ── */

function MapOverview({ map, onAutoLayout }: { map: MindMap; onAutoLayout: () => void }) {
  const rootNodes = map.nodes.filter((n) => n.parentId === null);
  const childNodes = map.nodes.filter((n) => n.parentId !== null);
  const colors = [...new Set(map.nodes.map((n) => n.color))];

  return (
    <>
      <div style={headerStyle}>
        <span style={headerTitleStyle}>Map Overview</span>
      </div>
      <div style={bodyStyle}>
        {/* Map name */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Name</label>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1E293B', padding: '4px 0' }}>
            {map.name}
          </div>
        </div>

        {/* Stats */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Statistics</label>
          <div style={statsGridStyle}>
            <div style={statCardStyle}>
              <span style={statValueStyle}>{map.nodes.length}</span>
              <span style={statLabelStyle}>Nodes</span>
            </div>
            <div style={statCardStyle}>
              <span style={statValueStyle}>{map.connections.length}</span>
              <span style={statLabelStyle}>Links</span>
            </div>
            <div style={statCardStyle}>
              <span style={statValueStyle}>{rootNodes.length}</span>
              <span style={statLabelStyle}>Roots</span>
            </div>
            <div style={statCardStyle}>
              <span style={statValueStyle}>{childNodes.length}</span>
              <span style={statLabelStyle}>Children</span>
            </div>
          </div>
        </div>

        {/* Colors used */}
        {colors.length > 0 && (
          <div style={sectionStyle}>
            <label style={labelStyle}>Colors Used</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {colors.map((c) => (
                <div key={c} style={{ width: 20, height: 20, borderRadius: 6, background: c, border: '1px solid rgba(0,0,0,0.08)' }} />
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ height: 1, background: '#E2E8F0', margin: '4px 0' }} />
        <div style={sectionStyle}>
          <label style={labelStyle}>Quick Actions</label>
          <button onClick={onAutoLayout} style={overviewActionStyle}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
            Auto-arrange nodes
          </button>
        </div>

        {/* Tips */}
        <div style={{ height: 1, background: '#E2E8F0', margin: '4px 0' }} />
        <div style={sectionStyle}>
          <label style={labelStyle}>Tips</label>
          <div style={tipStyle}>Click a node to edit its properties here</div>
          <div style={tipStyle}>Double-click the canvas to add a new node</div>
          <div style={tipStyle}>Press Tab to add a child to the selected node</div>
          <div style={tipStyle}>Alt + drag to pan around the canvas</div>
        </div>

        {/* Last edited */}
        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 8, textAlign: 'center' }}>
          Last edited: {new Date(map.updatedAt).toLocaleString()}
        </div>
      </div>
    </>
  );
}

/* ── Node Editor (node selected) ── */

function NodeEditor({
  node,
  onUpdate,
  onAddChild,
  onDelete,
  onStartConnect,
  onDeselect,
}: {
  node: MindMapNode;
  onUpdate: (id: string, updates: Partial<MindMapNode>) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
  onStartConnect: (id: string) => void;
  onDeselect: () => void;
}) {
  const [text, setText] = useState(node.text);
  const isRoot = node.parentId === null;

  useEffect(() => {
    setText(node.text);
  }, [node.id, node.text]);

  const commitText = () => {
    if (text.trim() && text !== node.text) {
      onUpdate(node.id, { text: text.trim() });
    } else {
      setText(node.text);
    }
  };

  return (
    <>
      <div style={headerStyle}>
        <span style={headerTitleStyle}>Properties</span>
        <button onClick={onDeselect} style={closeBtnStyle} title="Deselect node">&times;</button>
      </div>
      <div style={bodyStyle}>
        {/* Node type chip */}
        <div style={chipStyle}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: node.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
            {isRoot ? 'ROOT NODE' : 'CHILD NODE'}
          </span>
        </div>

        {/* Text */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commitText}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                commitText();
              }
            }}
            style={textareaStyle}
            rows={3}
            placeholder="Enter node text..."
          />
        </div>

        {/* Color */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Color</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {NODE_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onUpdate(node.id, { color: c })}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: c,
                  border: node.color === c ? '2.5px solid #1E293B' : '2px solid transparent',
                  cursor: 'pointer',
                  outline: node.color === c ? '2px solid #fff' : 'none',
                  outlineOffset: -3,
                  transition: 'transform 0.1s',
                }}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Font Size</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="range"
              min={10}
              max={28}
              step={1}
              value={node.fontSize}
              onChange={(e) => onUpdate(node.id, { fontSize: Number(e.target.value) })}
              style={{ flex: 1, accentColor: node.color }}
            />
            <span style={{ fontSize: 13, color: '#475569', fontWeight: 600, minWidth: 32, textAlign: 'right' }}>
              {node.fontSize}px
            </span>
          </div>
        </div>

        {/* Size */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Size</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <span style={subLabelStyle}>Width</span>
              <input
                type="number"
                min={80}
                max={400}
                value={node.width}
                onChange={(e) => onUpdate(node.id, { width: Math.max(80, Math.min(400, Number(e.target.value))) })}
                style={numberInputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <span style={subLabelStyle}>Height</span>
              <input
                type="number"
                min={30}
                max={200}
                value={node.height}
                onChange={(e) => onUpdate(node.id, { height: Math.max(30, Math.min(200, Number(e.target.value))) })}
                style={numberInputStyle}
              />
            </div>
          </div>
        </div>

        {/* Position */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Position</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <span style={subLabelStyle}>X</span>
              <input
                type="number"
                value={Math.round(node.position.x)}
                onChange={(e) => onUpdate(node.id, { position: { ...node.position, x: Number(e.target.value) } })}
                style={numberInputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <span style={subLabelStyle}>Y</span>
              <input
                type="number"
                value={Math.round(node.position.y)}
                onChange={(e) => onUpdate(node.id, { position: { ...node.position, y: Number(e.target.value) } })}
                style={numberInputStyle}
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#E2E8F0', margin: '4px 0' }} />

        {/* Actions */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Actions</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={() => onAddChild(node.id)} style={actionButtonStyle(node.color)}>
              <span style={{ fontSize: 15 }}>+</span> Add Child Node
            </button>
            <button onClick={() => onStartConnect(node.id)} style={actionButtonStyle('#475569')}>
              <span style={{ fontSize: 14 }}>&#8599;</span> Connect to Node
            </button>
            {!isRoot && (
              <button onClick={() => onDelete(node.id)} style={actionButtonStyle('#EF4444')}>
                <span style={{ fontSize: 13 }}>&#10005;</span> Delete Node
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Styles ── */

const panelStyle: React.CSSProperties = {
  width: 280,
  height: '100%',
  background: '#FFFFFF',
  borderLeft: '1px solid #E2E8F0',
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderBottom: '1px solid #E2E8F0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: '#F8FAFC',
  flexShrink: 0,
};

const headerTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#1E293B',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
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

const bodyStyle: React.CSSProperties = {
  padding: '12px 16px',
  overflowY: 'auto',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const chipStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  background: '#F1F5F9',
  padding: '6px 10px',
  borderRadius: 6,
  width: 'fit-content',
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#64748B',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
};

const subLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#94A3B8',
  fontWeight: 500,
  marginBottom: 4,
  display: 'block',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  border: '1.5px solid #E2E8F0',
  borderRadius: 8,
  padding: '8px 10px',
  fontSize: 14,
  fontFamily: 'inherit',
  resize: 'vertical',
  outline: 'none',
  color: '#1E293B',
  background: '#F8FAFC',
  boxSizing: 'border-box',
};

const numberInputStyle: React.CSSProperties = {
  width: '100%',
  border: '1.5px solid #E2E8F0',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
  color: '#1E293B',
  background: '#F8FAFC',
  boxSizing: 'border-box',
};

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
};

const statCardStyle: React.CSSProperties = {
  background: '#F8FAFC',
  border: '1px solid #E2E8F0',
  borderRadius: 10,
  padding: '10px 12px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
};

const statValueStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: '#1E293B',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#94A3B8',
  fontWeight: 500,
};

const overviewActionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '9px 12px',
  border: '1px solid #E2E8F0',
  borderRadius: 8,
  background: '#F8FAFC',
  color: '#475569',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'background 0.15s',
  width: '100%',
};

const tipStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#64748B',
  padding: '6px 10px',
  background: '#F8FAFC',
  borderRadius: 6,
  border: '1px solid #F1F5F9',
  lineHeight: 1.4,
};

function actionButtonStyle(color: string): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    border: 'none',
    borderRadius: 8,
    background: color + '12',
    color,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.15s',
  };
}
