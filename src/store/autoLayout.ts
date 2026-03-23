import type { MindMap, MindMapNode } from '../types';

/**
 * Radial tree layout algorithm.
 * Places the root at center and children in expanding rings.
 */
export function autoLayout(map: MindMap): MindMap {
  if (map.nodes.length === 0) return map;

  // Build adjacency from connections
  const children = new Map<string, string[]>();
  const hasParent = new Set<string>();

  for (const conn of map.connections) {
    const list = children.get(conn.fromId) || [];
    list.push(conn.toId);
    children.set(conn.fromId, list);
    hasParent.add(conn.toId);
  }

  // Find root nodes (no parent connection pointing to them)
  const roots = map.nodes.filter((n) => !hasParent.has(n.id));
  if (roots.length === 0) return map;

  const positions = new Map<string, { x: number; y: number }>();
  const visited = new Set<string>();

  // Layout each connected tree
  let treeOffsetX = 0;
  for (const root of roots) {
    const treeSize = layoutTree(root.id, 0, 0, 0, Math.PI * 2, children, map.nodes, positions, visited);
    // Shift tree based on accumulated offset
    for (const [id, pos] of positions) {
      if (!visited.has(id)) continue;
      const node = map.nodes.find((n) => n.id === id);
      if (node && roots.indexOf(node) === -1 || node?.id === root.id) {
        positions.set(id, { x: pos.x + treeOffsetX, y: pos.y });
      }
    }
    treeOffsetX += treeSize + 300;
  }

  // Apply positions centered around origin
  let cx = 0, cy = 0, count = 0;
  for (const pos of positions.values()) {
    cx += pos.x;
    cy += pos.y;
    count++;
  }
  cx /= count || 1;
  cy /= count || 1;

  const updatedNodes = map.nodes.map((node) => {
    const pos = positions.get(node.id);
    if (pos) {
      return {
        ...node,
        position: {
          x: pos.x - cx - node.width / 2,
          y: pos.y - cy - node.height / 2,
        },
      };
    }
    return node;
  });

  return { ...map, nodes: updatedNodes };
}

function layoutTree(
  nodeId: string,
  x: number,
  y: number,
  startAngle: number,
  endAngle: number,
  childrenMap: Map<string, string[]>,
  allNodes: MindMapNode[],
  positions: Map<string, { x: number; y: number }>,
  visited: Set<string>,
): number {
  if (visited.has(nodeId)) return 0;
  visited.add(nodeId);
  positions.set(nodeId, { x, y });

  const kids = (childrenMap.get(nodeId) || []).filter((id) => !visited.has(id));
  if (kids.length === 0) return 200;

  const ringRadius = 200;
  const anglePerChild = (endAngle - startAngle) / kids.length;
  let maxExtent = 0;

  kids.forEach((childId, i) => {
    const angle = startAngle + anglePerChild * (i + 0.5);
    const childX = x + Math.cos(angle) * ringRadius;
    const childY = y + Math.sin(angle) * ringRadius;

    const childAngleSpan = Math.min(anglePerChild, Math.PI * 0.8);
    const childStart = angle - childAngleSpan / 2;
    const childEnd = angle + childAngleSpan / 2;

    const extent = layoutTree(childId, childX, childY, childStart, childEnd, childrenMap, allNodes, positions, visited);
    maxExtent = Math.max(maxExtent, extent);
  });

  return ringRadius + maxExtent;
}
