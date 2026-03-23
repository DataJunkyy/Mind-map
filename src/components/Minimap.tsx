import { useCallback, useRef } from 'react';
import type { MindMap, ViewState } from '../types';

interface Props {
  map: MindMap;
  view: ViewState;
  canvasWidth: number;
  canvasHeight: number;
  onNavigate: (panX: number, panY: number) => void;
}

export function Minimap({ map, view, canvasWidth, canvasHeight, onNavigate }: Props) {
  if (map.nodes.length === 0) return null;

  const MINIMAP_W = 160;
  const MINIMAP_H = 100;
  const PADDING = 40;
  const dragging = useRef(false);

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const node of map.nodes) {
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + node.width);
    maxY = Math.max(maxY, node.position.y + node.height);
  }

  minX -= PADDING;
  minY -= PADDING;
  maxX += PADDING;
  maxY += PADDING;

  const worldW = maxX - minX || 1;
  const worldH = maxY - minY || 1;
  const scale = Math.min(MINIMAP_W / worldW, MINIMAP_H / worldH);

  const vpLeft = (-view.panX / view.zoom);
  const vpTop = (-view.panY / view.zoom);
  const vpW = canvasWidth / view.zoom;
  const vpH = (canvasHeight - 52) / view.zoom;

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Convert minimap coords to world coords
      const worldX = mx / scale + minX;
      const worldY = my / scale + minY;

      // Center viewport on that point
      const newPanX = -(worldX - vpW / 2) * view.zoom;
      const newPanY = -(worldY - vpH / 2) * view.zoom;
      onNavigate(newPanX, newPanY);
    },
    [scale, minX, minY, vpW, vpH, view.zoom, onNavigate]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    handleClick(e as React.MouseEvent<SVGSVGElement>);
  }, [handleClick]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    handleClick(e);
  }, [handleClick]);

  const handleMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div style={containerStyle}>
      <svg
        width={MINIMAP_W}
        height={MINIMAP_H}
        style={{ display: 'block', cursor: 'pointer' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {map.connections.map((conn) => {
          const from = map.nodes.find((n) => n.id === conn.fromId);
          const to = map.nodes.find((n) => n.id === conn.toId);
          if (!from || !to) return null;
          const x1 = (from.position.x + from.width / 2 - minX) * scale;
          const y1 = (from.position.y + from.height / 2 - minY) * scale;
          const x2 = (to.position.x + to.width / 2 - minX) * scale;
          const y2 = (to.position.y + to.height / 2 - minY) * scale;
          return (
            <line key={conn.id} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#CBD5E1" strokeWidth={0.5} />
          );
        })}

        {map.nodes.map((node) => (
          <rect
            key={node.id}
            x={(node.position.x - minX) * scale}
            y={(node.position.y - minY) * scale}
            width={Math.max(node.width * scale, 3)}
            height={Math.max(node.height * scale, 2)}
            rx={1.5}
            fill={node.color}
            opacity={0.8}
          />
        ))}

        <rect
          x={(vpLeft - minX) * scale}
          y={(vpTop - minY) * scale}
          width={vpW * scale}
          height={vpH * scale}
          fill="rgba(79,70,229,0.08)"
          stroke="#4F46E5"
          strokeWidth={1.5}
          rx={1}
          opacity={0.6}
        />
      </svg>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 48,
  right: 12,
  background: 'rgba(255,255,255,0.9)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid #E2E8F0',
  borderRadius: 10,
  padding: 6,
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  zIndex: 50,
  transition: 'opacity 0.2s',
};
