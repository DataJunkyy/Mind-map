import type { MindMapNode } from '../types';

interface Props {
  from: MindMapNode;
  to: MindMapNode;
}

export function ConnectionLine({ from, to }: Props) {
  const x1 = from.position.x + from.width / 2;
  const y1 = from.position.y + from.height / 2;
  const x2 = to.position.x + to.width / 2;
  const y2 = to.position.y + to.height / 2;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const tension = Math.min(dist * 0.4, 120);

  // Smart control points based on relative position
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

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={from.color} stopOpacity={0.5} />
          <stop offset="100%" stopColor={to.color} stopOpacity={0.5} />
        </linearGradient>
      </defs>
      {/* Shadow line */}
      <path
        d={path}
        fill="none"
        stroke="rgba(0,0,0,0.04)"
        strokeWidth={5}
        strokeLinecap="round"
      />
      {/* Main line */}
      <path
        d={path}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={2.5}
        strokeLinecap="round"
        className="connection-line"
      />
    </>
  );
}
