import { useRef, useState } from 'react';

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
  onAutoLayout: () => void;
  onToggleShortcuts: () => void;
  nodeCount: number;
  connectionCount: number;
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
  onAutoLayout,
  onToggleShortcuts,
  nodeCount,
  connectionCount,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [nameHover, setNameHover] = useState(false);

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
      {/* Left section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={onOpenList} style={iconBtnStyle} title="My mind maps">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <button onClick={onNewMap} style={iconBtnStyle} title="New mind map">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        <div style={dividerStyle} />
        <div
          style={{ position: 'relative' }}
          onMouseEnter={() => setNameHover(true)}
          onMouseLeave={() => setNameHover(false)}
        >
          <input
            value={mapName}
            onChange={(e) => onRename(e.target.value)}
            style={{
              ...nameInputStyle,
              background: nameHover ? '#F1F5F9' : 'transparent',
            }}
            placeholder="Mind Map Name"
          />
        </div>
        <div style={{ display: 'flex', gap: 6, marginLeft: 4 }}>
          <span style={statBadgeStyle}>{nodeCount} nodes</span>
          <span style={statBadgeStyle}>{connectionCount} links</span>
        </div>
      </div>

      {/* Right section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={onAutoLayout} style={toolBtnStyle} title="Auto-arrange nodes">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
          <span>Layout</span>
        </button>
        <div style={dividerStyle} />
        <button onClick={onZoomOut} style={iconBtnStyle} title="Zoom out">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <button
          onClick={onResetView}
          style={{ ...zoomLabelStyle, cursor: 'pointer' }}
          title="Reset zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button onClick={onZoomIn} style={iconBtnStyle} title="Zoom in">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <div style={dividerStyle} />
        <button onClick={onExport} style={toolBtnStyle} title="Export as JSON">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>Export</span>
        </button>
        <button onClick={handleImportClick} style={toolBtnStyle} title="Import JSON file">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span>Import</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <div style={dividerStyle} />
        <button onClick={onToggleShortcuts} style={iconBtnStyle} title="Keyboard shortcuts">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="8" x2="6" y2="8"/><line x1="10" y1="8" x2="10" y2="8"/><line x1="14" y1="8" x2="14" y2="8"/><line x1="18" y1="8" x2="18" y2="8"/><line x1="6" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="18" y2="12"/><line x1="8" y1="16" x2="16" y2="16"/>
          </svg>
        </button>
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
  background: 'rgba(255,255,255,0.85)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderBottom: '1px solid rgba(226,232,240,0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 12px',
  zIndex: 100,
};

const iconBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: 8,
  padding: '6px 8px',
  fontSize: 16,
  cursor: 'pointer',
  color: '#475569',
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s',
};

const toolBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: 8,
  padding: '5px 10px',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  color: '#475569',
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  fontFamily: 'inherit',
  transition: 'all 0.15s',
};

const nameInputStyle: React.CSSProperties = {
  border: 'none',
  outline: 'none',
  fontSize: 15,
  fontWeight: 600,
  color: '#1E293B',
  background: 'transparent',
  width: 200,
  padding: '6px 10px',
  borderRadius: 8,
  transition: 'background 0.15s',
};

const zoomLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#64748B',
  fontWeight: 600,
  minWidth: 44,
  textAlign: 'center',
  background: '#F1F5F9',
  border: '1px solid #E2E8F0',
  borderRadius: 6,
  padding: '4px 8px',
  fontFamily: 'inherit',
};

const dividerStyle: React.CSSProperties = {
  width: 1,
  height: 24,
  background: '#E2E8F0',
  margin: '0 4px',
};

const statBadgeStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#94A3B8',
  background: '#F1F5F9',
  padding: '3px 8px',
  borderRadius: 10,
  fontWeight: 500,
};
