import { useRef } from 'react';

interface Props {
  mapName: string;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onExport: () => void;
  onImport: (json: string) => void;
  onRename: (name: string) => void;
  onNewMap: () => void;
  onOpenList: () => void;
}

export function Toolbar({
  mapName,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
  onExport,
  onImport,
  onRename,
  onNewMap,
  onOpenList,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => fileRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImport(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div style={toolbarStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onOpenList} style={btnStyle} title="My mind maps">
          &#9776;
        </button>
        <button onClick={onNewMap} style={btnStyle} title="New mind map">
          &#43;
        </button>
        <input
          value={mapName}
          onChange={(e) => onRename(e.target.value)}
          style={nameInputStyle}
          placeholder="Mind Map Name"
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={onZoomOut} style={btnStyle} title="Zoom out">&#8722;</button>
        <span style={{ fontSize: 13, color: '#64748B', minWidth: 48, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button onClick={onZoomIn} style={btnStyle} title="Zoom in">&#43;</button>
        <button onClick={onResetView} style={btnStyle} title="Reset view">&#8634;</button>
        <div style={{ width: 1, height: 24, background: '#E2E8F0', margin: '0 6px' }} />
        <button onClick={onExport} style={btnStyle} title="Export JSON">&#8681;</button>
        <button onClick={handleImportClick} style={btnStyle} title="Import JSON">&#8679;</button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}

const toolbarStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 52,
  background: '#ffffff',
  borderBottom: '1px solid #E2E8F0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 16px',
  zIndex: 100,
};

const btnStyle: React.CSSProperties = {
  background: '#F1F5F9',
  border: '1px solid #E2E8F0',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 16,
  cursor: 'pointer',
  color: '#475569',
  lineHeight: 1,
};

const nameInputStyle: React.CSSProperties = {
  border: 'none',
  outline: 'none',
  fontSize: 15,
  fontWeight: 600,
  color: '#1E293B',
  background: 'transparent',
  width: 200,
  padding: '4px 8px',
  borderRadius: 6,
};
