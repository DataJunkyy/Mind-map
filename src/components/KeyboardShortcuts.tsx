interface Props {
  onClose: () => void;
}

const shortcuts = [
  { keys: ['Double-click'], desc: 'Add a new root node' },
  { keys: ['Tab'], desc: 'Add child to selected node' },
  { keys: ['Delete', 'Backspace'], desc: 'Delete selected node or connection' },
  { keys: ['Escape'], desc: 'Deselect / cancel / close search' },
  { keys: ['Ctrl', 'Z'], desc: 'Undo' },
  { keys: ['Ctrl', 'Shift', 'Z'], desc: 'Redo' },
  { keys: ['Ctrl', 'C'], desc: 'Copy selected node' },
  { keys: ['Ctrl', 'V'], desc: 'Paste node' },
  { keys: ['Ctrl', 'D'], desc: 'Duplicate selected node' },
  { keys: ['Ctrl', 'F'], desc: 'Search nodes' },
  { keys: ['Ctrl', 'A'], desc: 'Select all' },
  { keys: ['Alt', 'Drag'], desc: 'Pan the canvas' },
  { keys: ['Arrow keys'], desc: 'Pan the canvas' },
  { keys: ['Scroll'], desc: 'Zoom in/out' },
  { keys: ['+', '-'], desc: 'Zoom in/out' },
  { keys: ['Right-click'], desc: 'Context menu' },
  { keys: ['Double-click node'], desc: 'Edit node text' },
  { keys: ['Enter'], desc: 'Confirm edit' },
  { keys: ['Shift', 'Enter'], desc: 'New line in edit' },
];

export function KeyboardShortcuts({ onClose }: Props) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1E293B' }}>Keyboard Shortcuts</span>
          <button onClick={onClose} style={closeBtnStyle}>&times;</button>
        </div>
        <div style={bodyStyle}>
          {shortcuts.map((s, i) => (
            <div key={i} style={rowStyle}>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {s.keys.map((k) => (
                  <kbd key={k} style={kbdStyle}>{k}</kbd>
                ))}
              </div>
              <span style={{ fontSize: 13, color: '#475569' }}>{s.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15,23,42,0.4)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 200,
};

const modalStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  width: 440,
  maxWidth: '90vw',
  maxHeight: '80vh',
  boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle: React.CSSProperties = {
  padding: '16px 20px',
  borderBottom: '1px solid #E2E8F0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: 22,
  color: '#94A3B8',
  cursor: 'pointer',
  padding: '2px 6px',
  lineHeight: 1,
};

const bodyStyle: React.CSSProperties = {
  padding: '12px 20px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  overflowY: 'auto',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 0',
  borderBottom: '1px solid #F1F5F9',
};

const kbdStyle: React.CSSProperties = {
  background: '#F1F5F9',
  border: '1px solid #E2E8F0',
  borderRadius: 6,
  padding: '2px 8px',
  fontSize: 12,
  fontWeight: 600,
  color: '#334155',
  fontFamily: 'inherit',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
};
