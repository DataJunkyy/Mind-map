import { useState, useRef, useEffect, useCallback, type MouseEvent } from 'react';
import type { MindMapNode as NodeType } from '../types';

interface Props {
  node: NodeType;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onEdit: (id: string, text: string) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
  onStartConnect: (id: string) => void;
  zoom: number;
}

export function MindMapNodeComponent({
  node,
  isSelected,
  onSelect,
  onMove,
  onEdit,
  onAddChild,
  onDelete,
  onStartConnect,
  zoom,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(node.text);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, nodeX: 0, nodeY: 0 });
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  const commitEdit = useCallback(() => {
    setIsEditing(false);
    if (editText.trim() && editText !== node.text) {
      onEdit(node.id, editText.trim());
    } else {
      setEditText(node.text);
    }
  }, [editText, node.id, node.text, onEdit]);

  const isRoot = node.parentId === null;

  // Lighten color for child node background
  const lightBg = node.color + '0A';
  const borderColor = isSelected ? node.color : isRoot ? node.color + 'CC' : node.color + '30';

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
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          boxShadow: isSelected
            ? `0 0 0 3px ${node.color}30, 0 8px 24px rgba(0,0,0,0.12)`
            : isHovered
            ? `0 4px 16px rgba(0,0,0,0.1)`
            : '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.2s, border-color 0.2s, transform 0.15s',
          position: 'relative',
          boxSizing: 'border-box',
          wordBreak: 'break-word',
          transform: isSelected && !isDragging ? 'scale(1.02)' : 'scale(1)',
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
        {(isSelected || isHovered) && !isEditing && (
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

        {/* Connection dot indicator */}
        {isRoot && (
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: node.color,
              border: '2px solid #fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          />
        )}
      </div>
    </foreignObject>
  );
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
