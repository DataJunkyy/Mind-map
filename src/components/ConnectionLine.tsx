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

  // Cubic bezier curve
  const dx = x2 - x1;
  const dy = y2 - y1;
  const cx = Math.abs(dx) * 0.5;
  const cy = Math.abs(dy) * 0.2;

  const path = `M ${x1} ${y1} C ${x1 + cx} ${y1 + cy}, ${x2 - cx} ${y2 - cy}, ${x2} ${y2}`;

  return (
    <path
      d={path}
      fill="none"
      stroke="#94A3B8"
      strokeWidth={2}
      strokeLinecap="round"
      opacity={0.6}
    />
  );
}
