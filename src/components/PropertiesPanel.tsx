import { useState, useEffect } from 'react';
import type { MindMapNode } from '../types';

const NODE_COLORS = [
  '#4F46E5', '#7C3AED', '#DB2777', '#DC2626',
  '#EA580C', '#CA8A04', '#16A34A', '#0891B2',
  '#2563EB', '#9333EA', '#0D9488', '#F59E0B',
  '#64748B', '#1E293B',
];

interface Props {
  node: MindMapNode;
  onUpdate: (id: string, updates: Partial<MindMapNode>) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
  onStartConnect: (id: string) => void;
  onClose: () => void;
}

export function PropertiesPanel({ node, onUpdate, onAddChild, onDelete, onStartConnect, onClose }: Props) {
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
    <div style={panelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Properties
        </span>
        <button onClick={onClose} style={closeBtnStyle} title="Close panel">&times;</button>
      </div>

      <div style={bodyStyle}>
        {/* Node label */}
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
    </div>
  );
}

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
