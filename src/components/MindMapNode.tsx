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
        style={{
          width: node.width,
          minHeight: node.height,
          background: isRoot ? node.color : '#ffffff',
          color: isRoot ? '#ffffff' : '#1E293B',
          border: `2px solid ${isSelected ? node.color : isRoot ? 'transparent' : node.color + '60'}`,
          borderRadius: isRoot ? 16 : 10,
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
            ? `0 0 0 3px ${node.color}40, 0 4px 12px rgba(0,0,0,0.15)`
            : '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'box-shadow 0.15s, border-color 0.15s',
          position: 'relative',
          boxSizing: 'border-box',
          wordBreak: 'break-word',
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

        {/* Action buttons on hover/select */}
        {isSelected && !isEditing && (
          <div
            style={{
              position: 'absolute',
              top: -36,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 4,
              background: '#1E293B',
              borderRadius: 8,
              padding: '4px 6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }}
              title="Add child node"
              style={actionBtnStyle}
            >
              +
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onStartConnect(node.id); }}
              title="Connect to another node"
              style={actionBtnStyle}
            >
              &#8599;
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDoubleClick(e); }}
              title="Edit text"
              style={actionBtnStyle}
            >
              &#9998;
            </button>
            {!isRoot && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
                title="Delete node"
                style={{ ...actionBtnStyle, color: '#EF4444' }}
              >
                &#10005;
              </button>
            )}
          </div>
        )}
      </div>
    </foreignObject>
  );
}

const actionBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#E2E8F0',
  fontSize: 16,
  cursor: 'pointer',
  padding: '2px 6px',
  borderRadius: 4,
  lineHeight: 1,
};
