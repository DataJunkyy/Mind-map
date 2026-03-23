import { useState } from 'react';
import type { MindMapNode, Connection } from '../types';

interface Props {
  connection: Connection;
  from: MindMapNode;
  to: MindMapNode;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, connectionId: string) => void;
}

export function ConnectionLine({ connection, from, to, isSelected, onSelect, onContextMenu }: Props) {
  const [isHovered, setIsHovered] = useState(false);

  const x1 = from.position.x + from.width / 2;
  const y1 = from.position.y + from.height / 2;
  const x2 = to.position.x + to.width / 2;
  const y2 = to.position.y + to.height / 2;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const tension = Math.min(dist * 0.4, 120);

  let cx1: number, cy1: number, cx2: number, cy2: number;
  if (Math.abs(dx) > Math.abs(dy)) {
    cx1 = x1 + Math.sign(dx) * tension;
    cy1 = y1;
    cx2 = x2 - Math.sign(dx) * tension;
    cy2 = y2;
  } else {
    cx1 = x1;
    cy1 = y1 + Math.sign(dy) * tension;
    cx2 = x2;
    cy2 = y2 - Math.sign(dy) * tension;
  }

  const path = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  const gradientId = `grad-${from.id}-${to.id}`;

  const active = isSelected || isHovered;

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => { e.stopPropagation(); onSelect(connection.id); }}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(e, connection.id); }}
      style={{ cursor: 'pointer' }}
    >
      <defs>
        <linearGradient id={gradientId} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={from.color} stopOpacity={active ? 0.8 : 0.5} />
          <stop offset="100%" stopColor={to.color} stopOpacity={active ? 0.8 : 0.5} />
        </linearGradient>
      </defs>
      {/* Wide invisible hit area */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
      />
      {/* Shadow */}
      <path
        d={path}
        fill="none"
        stroke={active ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.04)'}
        strokeWidth={active ? 7 : 5}
        strokeLinecap="round"
      />
      {/* Main line */}
      <path
        d={path}
        fill="none"
        stroke={isSelected ? '#4F46E5' : `url(#${gradientId})`}
        strokeWidth={active ? 3.5 : 2.5}
        strokeLinecap="round"
        className="connection-line"
      />
      {/* Selected indicator - midpoint dot */}
      {isSelected && (
        <circle
          cx={(x1 + x2) / 2}
          cy={(y1 + y2) / 2}
          r={5}
          fill="#4F46E5"
          stroke="#fff"
          strokeWidth={2}
        />
      )}
    </g>
  );
}
