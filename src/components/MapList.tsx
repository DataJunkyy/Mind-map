interface MapEntry {
  id: string;
  name: string;
  updatedAt: number;
}

interface Props {
  maps: MapEntry[];
  currentId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function MapList({ maps, currentId, onSelect, onDelete, onClose }: Props) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#1E293B' }}>My Mind Maps</h2>
          <button onClick={onClose} style={closeBtnStyle}>&times;</button>
        </div>

        {maps.length === 0 ? (
          <p style={{ color: '#94A3B8', textAlign: 'center', padding: 24 }}>No saved mind maps yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {maps
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: m.id === currentId ? '#EEF2FF' : '#F8FAFC',
                    border: m.id === currentId ? '1px solid #C7D2FE' : '1px solid transparent',
                    cursor: 'pointer',
                  }}
                  onClick={() => { onSelect(m.id); onClose(); }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 14 }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>
                      {new Date(m.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  {m.id !== currentId && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(m.id); }}
                      style={{ ...closeBtnStyle, fontSize: 14, color: '#EF4444' }}
                      title="Delete"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 200,
};

const panelStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: 24,
  width: 380,
  maxHeight: '70vh',
  overflow: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: 22,
  cursor: 'pointer',
  color: '#94A3B8',
  lineHeight: 1,
};
