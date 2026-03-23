import type { MindMapNode } from '../types';

export interface ContextMenuState {
  x: number;
  y: number;
  type: 'canvas' | 'node' | 'connection';
  nodeId?: string;
  connectionId?: string;
  worldX?: number;
  worldY?: number;
}

interface Props {
  menu: ContextMenuState;
  node?: MindMapNode | null;
  canUndo: boolean;
  canRedo: boolean;
  canPaste: boolean;
  onClose: () => void;
  // Canvas actions
  onAddNode: (x: number, y: number) => void;
  onPaste: (x: number, y: number) => void;
  onSelectAll: () => void;
  onAutoLayout: () => void;
  onUndo: () => void;
  onRedo: () => void;
  // Node actions
  onEditNode: (id: string) => void;
  onDuplicate: (id: string) => void;
  onCopy: (id: string) => void;
  onAddChild: (id: string) => void;
  onConnect: (id: string) => void;
  onDeleteNode: (id: string) => void;
  // Connection actions
  onDeleteConnection: (id: string) => void;
}

export function ContextMenu({
  menu,
  node,
  canUndo,
  canRedo,
  canPaste,
  onClose,
  onAddNode,
  onPaste,
  onSelectAll,
  onAutoLayout,
  onUndo,
  onRedo,
  onEditNode,
  onDuplicate,
  onCopy,
  onAddChild,
  onConnect,
  onDeleteNode,
  onDeleteConnection,
}: Props) {
  const isRoot = node?.parentId === null;

  return (
    <>
      <div style={backdropStyle} onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div style={{ ...menuStyle, left: menu.x, top: menu.y }}>
        {menu.type === 'canvas' && (
          <>
            <MenuItem label="Add Node Here" shortcut="" onClick={() => { onAddNode(menu.worldX ?? 0, menu.worldY ?? 0); onClose(); }} />
            <MenuItem label="Paste" shortcut="Ctrl+V" onClick={() => { onPaste(menu.worldX ?? 0, menu.worldY ?? 0); onClose(); }} disabled={!canPaste} />
            <Divider />
            <MenuItem label="Select All" shortcut="Ctrl+A" onClick={() => { onSelectAll(); onClose(); }} />
            <MenuItem label="Auto Layout" shortcut="" onClick={() => { onAutoLayout(); onClose(); }} />
            <Divider />
            <MenuItem label="Undo" shortcut="Ctrl+Z" onClick={() => { onUndo(); onClose(); }} disabled={!canUndo} />
            <MenuItem label="Redo" shortcut="Ctrl+Shift+Z" onClick={() => { onRedo(); onClose(); }} disabled={!canRedo} />
          </>
        )}

        {menu.type === 'node' && menu.nodeId && (
          <>
            <MenuItem label="Edit Text" shortcut="Dbl-click" onClick={() => { onEditNode(menu.nodeId!); onClose(); }} />
            <MenuItem label="Add Child" shortcut="Tab" onClick={() => { onAddChild(menu.nodeId!); onClose(); }} />
            <MenuItem label="Connect" shortcut="" onClick={() => { onConnect(menu.nodeId!); onClose(); }} />
            <Divider />
            <MenuItem label="Copy" shortcut="Ctrl+C" onClick={() => { onCopy(menu.nodeId!); onClose(); }} />
            <MenuItem label="Duplicate" shortcut="Ctrl+D" onClick={() => { onDuplicate(menu.nodeId!); onClose(); }} />
            {!isRoot && (
              <>
                <Divider />
                <MenuItem label="Delete" shortcut="Del" onClick={() => { onDeleteNode(menu.nodeId!); onClose(); }} danger />
              </>
            )}
          </>
        )}

        {menu.type === 'connection' && menu.connectionId && (
          <>
            <MenuItem label="Delete Connection" shortcut="" onClick={() => { onDeleteConnection(menu.connectionId!); onClose(); }} danger />
          </>
        )}
      </div>
    </>
  );
}

function MenuItem({ label, shortcut, onClick, disabled, danger }: {
  label: string;
  shortcut: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        ...itemStyle,
        color: disabled ? '#94A3B8' : danger ? '#EF4444' : '#1E293B',
        cursor: disabled ? 'default' : 'pointer',
      }}
      disabled={disabled}
    >
      <span>{label}</span>
      {shortcut && <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 16 }}>{shortcut}</span>}
    </button>
  );
}

function Divider() {
  return <div style={{ height: 1, background: '#E2E8F0', margin: '4px 0' }} />;
}

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 299,
};

const menuStyle: React.CSSProperties = {
  position: 'fixed',
  zIndex: 300,
  background: '#fff',
  border: '1px solid #E2E8F0',
  borderRadius: 10,
  padding: '4px 0',
  boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
  minWidth: 200,
  overflow: 'hidden',
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: '7px 14px',
  border: 'none',
  background: 'transparent',
  fontSize: 13,
  fontFamily: 'inherit',
  textAlign: 'left',
  transition: 'background 0.1s',
};
