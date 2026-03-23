import { useState, useRef, useEffect, useCallback, type MouseEvent } from 'react';
import type { MindMapNode as NodeType } from '../types';

interface Props {
  node: NodeType;
  isSelected: boolean;
  isConnecting: boolean;
  connectingFrom: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onEdit: (id: string, text: string) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
  onStartConnect: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, nodeId: string) => void;
  zoom: number;
  triggerEdit?: boolean;
  onEditTriggered?: () => void;
}

export function MindMapNodeComponent({
  node,
  isSelected,
  isConnecting,
  connectingFrom,
  onSelect,
  onMove,
  onEdit,
  onAddChild,
  onDelete,
  onStartConnect,
  onContextMenu,
  zoom,
  triggerEdit,
  onEditTriggered,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(node.text);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, nodeX: 0, nodeY: 0 });
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // External edit trigger (from context menu)
  useEffect(() => {
    if (triggerEdit) {
      setIsEditing(true);
      setEditText(node.text);
      onEditTriggered?.();
    }
  }, [triggerEdit, node.text, onEditTriggered]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      if (e.button !== 0 || e.altKey) return;

      onSelect(node.id);
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        nodeX: node.position.x,
        nodeY: node.position.y,
      };

      const handleMouseMove = (me: globalThis.MouseEvent) => {
        const dx = (me.clientX - dragStart.current.x) / zoom;
        const dy = (me.clientY - dragStart.current.y) / zoom;
        onMove(node.id, dragStart.current.nodeX + dx, dragStart.current.nodeY + dy);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [node.id, node.position.x, node.position.y, zoom, onSelect, onMove]
  );

  const handleDoubleClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditText(node.text);
  }, [node.text]);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, node.id);
  }, [node.id, onContextMenu]);

  const commitEdit = useCallback(() => {
    setIsEditing(false);
    if (editText.trim() && editText !== node.text) {
      onEdit(node.id, editText.trim());
    } else {
      setEditText(node.text);
    }
  }, [editText, node.id, node.text, onEdit]);

  const isRoot = node.parentId === null;
  const isConnectTarget = isConnecting && connectingFrom !== node.id;

  const lightBg = node.color + '0A';
  const borderColor = isSelected ? node.color
    : isConnectTarget ? '#4F46E5'
    : isRoot ? node.color + 'CC'
    : node.color + '30';

  return (
    <foreignObject
      x={node.position.x}
      y={node.position.y}
      width={node.width}
      height={node.height}
      style={{ overflow: 'visible' }}
    >
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="mind-map-node"
        style={{
          width: node.width,
          minHeight: node.height,
          background: isRoot
            ? `linear-gradient(135deg, ${node.color}, ${node.color}DD)`
            : lightBg,
          color: isRoot ? '#ffffff' : '#1E293B',
          border: `2px solid ${borderColor}`,
          borderRadius: isRoot ? 16 : 12,
          padding: '8px 14px',
          fontSize: node.fontSize,
          fontWeight: isRoot ? 700 : 500,
          cursor: isConnecting
            ? (isConnectTarget ? 'cell' : 'default')
            : isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          boxShadow: isSelected
            ? `0 0 0 3px ${node.color}30, 0 8px 24px rgba(0,0,0,0.12)`
            : isConnectTarget && isHovered
            ? `0 0 0 3px #4F46E540, 0 4px 16px rgba(0,0,0,0.1)`
            : isHovered
            ? `0 4px 16px rgba(0,0,0,0.1)`
            : '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.2s, border-color 0.2s, transform 0.15s',
          position: 'relative',
          boxSizing: 'border-box',
          wordBreak: 'break-word',
          transform: isSelected && !isDragging ? 'scale(1.02)' : isConnectTarget && isHovered ? 'scale(1.04)' : 'scale(1)',
        }}
      >
        {isEditing ? (
          <textarea
            ref={inputRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                commitEdit();
              }
              if (e.key === 'Escape') {
                setIsEditing(false);
                setEditText(node.text);
              }
            }}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'inherit',
              fontSize: 'inherit',
              fontWeight: 'inherit',
              textAlign: 'center',
              resize: 'none',
              fontFamily: 'inherit',
            }}
            rows={2}
          />
        ) : (
          node.text
        )}

        {/* Floating action bar */}
        {(isSelected || isHovered) && !isEditing && !isConnecting && (
          <div
            style={{
              position: 'absolute',
              top: -40,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 2,
              background: '#1E293B',
              borderRadius: 10,
              padding: '4px 6px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              opacity: isSelected ? 1 : 0.85,
              transition: 'opacity 0.15s',
            }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }}
              title="Add child node (Tab)"
              style={actionBtnStyle}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onStartConnect(node.id); }}
              title="Connect to another node"
              style={actionBtnStyle}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M7 17L17 7"/><path d="M17 7v10"/></svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDoubleClick(e); }}
              title="Edit text"
              style={actionBtnStyle}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            {!isRoot && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
                title="Delete node (Del)"
                style={{ ...actionBtnStyle, color: '#F87171' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        )}

        {/* Connection port dots */}
        {(isSelected || isHovered) && !isEditing && !isConnecting && (
          <>
            {/* Right port */}
            <div
              onMouseDown={(e) => { e.stopPropagation(); onStartConnect(node.id); }}
              style={portStyle('right')}
              title="Drag to connect"
            />
            {/* Bottom port */}
            <div
              onMouseDown={(e) => { e.stopPropagation(); onStartConnect(node.id); }}
              style={portStyle('bottom')}
              title="Drag to connect"
            />
            {/* Left port */}
            <div
              onMouseDown={(e) => { e.stopPropagation(); onStartConnect(node.id); }}
              style={portStyle('left')}
              title="Drag to connect"
            />
            {/* Top port (if not root — root has action bar there) */}
            {!isSelected && (
              <div
                onMouseDown={(e) => { e.stopPropagation(); onStartConnect(node.id); }}
                style={portStyle('top')}
                title="Drag to connect"
              />
            )}
          </>
        )}

        {/* Connect target glow */}
        {isConnectTarget && isHovered && (
          <div style={{
            position: 'absolute',
            inset: -6,
            borderRadius: isRoot ? 20 : 16,
            border: '2px dashed #4F46E5',
            pointerEvents: 'none',
            animation: 'pulse 1.5s infinite',
          }} />
        )}
      </div>
    </foreignObject>
  );
}

function portStyle(position: 'top' | 'bottom' | 'left' | 'right'): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: '#4F46E5',
    border: '2px solid #fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
    cursor: 'crosshair',
    zIndex: 5,
    transition: 'transform 0.15s',
  };

  switch (position) {
    case 'top':
      return { ...base, top: -5, left: '50%', transform: 'translateX(-50%)' };
    case 'bottom':
      return { ...base, bottom: -5, left: '50%', transform: 'translateX(-50%)' };
    case 'left':
      return { ...base, left: -5, top: '50%', transform: 'translateY(-50%)' };
    case 'right':
      return { ...base, right: -5, top: '50%', transform: 'translateY(-50%)' };
  }
}

const actionBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#E2E8F0',
  fontSize: 14,
  cursor: 'pointer',
  padding: '4px 6px',
  borderRadius: 6,
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 0.1s, background 0.1s',
};
