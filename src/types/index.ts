export interface Position {
  x: number;
  y: number;
}

export interface MindMapNode {
  id: string;
  text: string;
  position: Position;
  color: string;
  width: number;
  height: number;
  fontSize: number;
  parentId: string | null;
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
}

export interface MindMap {
  id: string;
  name: string;
  nodes: MindMapNode[];
  connections: Connection[];
  createdAt: number;
  updatedAt: number;
}

export interface ViewState {
  panX: number;
  panY: number;
  zoom: number;
}
