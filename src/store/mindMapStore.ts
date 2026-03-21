import { v4 as uuidv4 } from 'uuid';
import type { MindMap, MindMapNode, Position } from '../types';

const NODE_COLORS = [
  '#4F46E5', '#7C3AED', '#DB2777', '#DC2626',
  '#EA580C', '#CA8A04', '#16A34A', '#0891B2',
  '#2563EB', '#9333EA',
];

function getRandomColor(): string {
  return NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)];
}

function createDefaultMap(): MindMap {
  const rootId = uuidv4();
  return {
    id: uuidv4(),
    name: 'Untitled Mind Map',
    nodes: [
      {
        id: rootId,
        text: 'Central Idea',
        position: { x: 0, y: 0 },
        color: '#4F46E5',
        width: 180,
        height: 60,
        fontSize: 18,
        parentId: null,
      },
    ],
    connections: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

const STORAGE_KEY = 'mindmap-data';
const MAPS_INDEX_KEY = 'mindmap-index';

export function loadMapsIndex(): { id: string; name: string; updatedAt: number }[] {
  try {
    const raw = localStorage.getItem(MAPS_INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMapsIndex(maps: { id: string; name: string; updatedAt: number }[]) {
  localStorage.setItem(MAPS_INDEX_KEY, JSON.stringify(maps));
}

export function loadMap(id: string): MindMap | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}-${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveMap(map: MindMap) {
  map.updatedAt = Date.now();
  localStorage.setItem(`${STORAGE_KEY}-${map.id}`, JSON.stringify(map));

  const index = loadMapsIndex();
  const existing = index.findIndex((m) => m.id === map.id);
  const entry = { id: map.id, name: map.name, updatedAt: map.updatedAt };
  if (existing >= 0) {
    index[existing] = entry;
  } else {
    index.push(entry);
  }
  saveMapsIndex(index);
}

export function deleteMap(id: string) {
  localStorage.removeItem(`${STORAGE_KEY}-${id}`);
  const index = loadMapsIndex().filter((m) => m.id !== id);
  saveMapsIndex(index);
}

export function createNewMap(): MindMap {
  const map = createDefaultMap();
  saveMap(map);
  return map;
}

export function addNode(
  map: MindMap,
  parentId: string | null,
  position: Position,
  text = 'New Idea'
): MindMap {
  const newNode: MindMapNode = {
    id: uuidv4(),
    text,
    position,
    color: getRandomColor(),
    width: 140,
    height: 44,
    fontSize: 14,
    parentId,
  };

  const connections = [...map.connections];
  if (parentId) {
    connections.push({
      id: uuidv4(),
      fromId: parentId,
      toId: newNode.id,
    });
  }

  return {
    ...map,
    nodes: [...map.nodes, newNode],
    connections,
  };
}

export function updateNode(map: MindMap, nodeId: string, updates: Partial<MindMapNode>): MindMap {
  return {
    ...map,
    nodes: map.nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n)),
  };
}

export function deleteNode(map: MindMap, nodeId: string): MindMap {
  // Collect all descendant IDs
  const toRemove = new Set<string>();
  const queue = [nodeId];
  while (queue.length > 0) {
    const current = queue.pop()!;
    toRemove.add(current);
    map.nodes
      .filter((n) => n.parentId === current)
      .forEach((n) => queue.push(n.id));
  }

  return {
    ...map,
    nodes: map.nodes.filter((n) => !toRemove.has(n.id)),
    connections: map.connections.filter(
      (c) => !toRemove.has(c.fromId) && !toRemove.has(c.toId)
    ),
  };
}

export function addConnection(map: MindMap, fromId: string, toId: string): MindMap {
  const exists = map.connections.some(
    (c) => (c.fromId === fromId && c.toId === toId) || (c.fromId === toId && c.toId === fromId)
  );
  if (exists || fromId === toId) return map;

  return {
    ...map,
    connections: [
      ...map.connections,
      { id: uuidv4(), fromId, toId },
    ],
  };
}

export function exportMapAsJSON(map: MindMap): string {
  return JSON.stringify(map, null, 2);
}

export function importMapFromJSON(json: string): MindMap | null {
  try {
    const data = JSON.parse(json);
    if (data.nodes && data.connections) {
      return { ...data, id: uuidv4(), updatedAt: Date.now() };
    }
    return null;
  } catch {
    return null;
  }
}
