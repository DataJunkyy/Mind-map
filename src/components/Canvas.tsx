import { useCallback, useRef, useState, type MouseEvent } from 'react';
import type { MindMap, Position } from '../types';
import { useViewState } from '../hooks/useViewState';
import { MindMapNodeComponent } from './MindMapNode';
import { ConnectionLine } from './ConnectionLine';
import { Toolbar } from './Toolbar';
import { MapList } from './MapList';
import {
  addNode,
  updateNode,
  deleteNode,
  addConnection,
  saveMap,
  loadMap,
  loadMapsIndex,
  createNewMap,
  deleteMap,
  exportMapAsJSON,
  importMapFromJSON,
} from '../store/mindMapStore';

interface Props {
  initialMap: MindMap;
}

export function Canvas({ initialMap }: Props) {
  const [map, setMap] = useState<MindMap>(initialMap);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [showMapList, setShowMapList] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const { view, setView, handleWheel, startPan, movePan, endPan, screenToWorld, resetView } =
    useViewState();

  // Auto-save on every change
  const updateMap = useCallback((updater: (m: MindMap) => MindMap) => {
    setMap((prev) => {
      const next = updater(prev);
      saveMap(next);
      return next;
    });
  }, []);

  const handleCanvasClick = useCallback(
    (e: MouseEvent) => {
      if (e.target !== svgRef.current && !(e.target as HTMLElement).closest('.canvas-bg')) return;

      if (connectingFrom) {
        setConnectingFrom(null);
        return;
      }

      setSelectedId(null);
    },
    [connectingFrom]
  );

  const handleCanvasDoubleClick = useCallback(
    (e: MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      if (e.target !== svg && !(e.target as HTMLElement).closest('.canvas-bg')) return;

      const rect = svg.getBoundingClientRect();
      const pos = screenToWorld(e.clientX, e.clientY, rect);
      // Center the node at click position
      const nodePos: Position = { x: pos.x - 70, y: pos.y - 22 };
      updateMap((m) => addNode(m, null, nodePos));
    },
    [screenToWorld, updateMap]
  );

  const handleNodeSelect = useCallback(
    (id: string) => {
      if (connectingFrom && connectingFrom !== id) {
        updateMap((m) => addConnection(m, connectingFrom, id));
        setConnectingFrom(null);
        return;
      }
      setSelectedId(id);
    },
    [connectingFrom, updateMap]
  );

  const handleNodeMove = useCallback(
    (id: string, x: number, y: number) => {
      updateMap((m) => updateNode(m, id, { position: { x, y } }));
    },
    [updateMap]
  );

  const handleNodeEdit = useCallback(
    (id: string, text: string) => {
      updateMap((m) => updateNode(m, id, { text }));
    },
    [updateMap]
  );

  const handleAddChild = useCallback(
    (parentId: string) => {
      const parent = map.nodes.find((n) => n.id === parentId);
      if (!parent) return;
      const angle = Math.random() * Math.PI * 2;
      const dist = 180 + Math.random() * 60;
      const pos: Position = {
        x: parent.position.x + parent.width / 2 + Math.cos(angle) * dist - 70,
        y: parent.position.y + parent.height / 2 + Math.sin(angle) * dist - 22,
      };
      updateMap((m) => addNode(m, parentId, pos));
    },
    [map.nodes, updateMap]
  );

  const handleDeleteNode = useCallback(
    (id: string) => {
      updateMap((m) => deleteNode(m, id));
      if (selectedId === id) setSelectedId(null);
    },
    [selectedId, updateMap]
  );

  const handleStartConnect = useCallback((id: string) => {
    setConnectingFrom(id);
  }, []);

  const handleExport = useCallback(() => {
    const json = exportMapAsJSON(map);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${map.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [map]);

  const handleImport = useCallback(
    (json: string) => {
      const imported = importMapFromJSON(json);
      if (imported) {
        saveMap(imported);
        setMap(imported);
        setSelectedId(null);
        resetView();
      }
    },
    [resetView]
  );

  const handleRename = useCallback(
    (name: string) => {
      updateMap((m) => ({ ...m, name }));
    },
    [updateMap]
  );

  const handleNewMap = useCallback(() => {
    const newMap = createNewMap();
    setMap(newMap);
    setSelectedId(null);
    resetView();
  }, [resetView]);

  const handleSelectMap = useCallback(
    (id: string) => {
      const loaded = loadMap(id);
      if (loaded) {
        setMap(loaded);
        setSelectedId(null);
        resetView();
      }
    },
    [resetView]
  );

  const handleDeleteMap = useCallback(
    (id: string) => {
      deleteMap(id);
    },
    []
  );

  const handleZoomIn = useCallback(() => {
    setView((prev) => ({ ...prev, zoom: Math.min(3, prev.zoom * 1.2) }));
  }, [setView]);

  const handleZoomOut = useCallback(() => {
    setView((prev) => ({ ...prev, zoom: Math.max(0.2, prev.zoom / 1.2) }));
  }, [setView]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          const node = map.nodes.find((n) => n.id === selectedId);
          if (node && node.parentId !== null) {
            handleDeleteNode(selectedId);
          }
        }
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
        setConnectingFrom(null);
      }
      if (e.key === 'Tab' && selectedId) {
        e.preventDefault();
        handleAddChild(selectedId);
      }
    },
    [selectedId, map.nodes, handleDeleteNode, handleAddChild]
  );

  return (
    <div
      style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#F8FAFC', position: 'relative' }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <Toolbar
        mapName={map.name}
        zoom={view.zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={resetView}
        onExport={handleExport}
        onImport={handleImport}
        onRename={handleRename}
        onNewMap={handleNewMap}
        onOpenList={() => setShowMapList(true)}
      />

      {connectingFrom && (
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1E293B',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 13,
            zIndex: 50,
          }}
        >
          Click another node to connect, or press Escape to cancel
        </div>
      )}

      <svg
        ref={svgRef}
        className="canvas-container"
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 52, left: 0, bottom: 0, right: 0, cursor: connectingFrom ? 'crosshair' : 'default' }}
        onWheel={handleWheel}
        onMouseDown={(e) => { startPan(e); handleCanvasClick(e); }}
        onMouseMove={movePan}
        onMouseUp={endPan}
        onDoubleClick={handleCanvasDoubleClick}
      >
        {/* Background grid */}
        <defs>
          <pattern id="grid" width={40} height={40} patternUnits="userSpaceOnUse"
            patternTransform={`translate(${view.panX},${view.panY}) scale(${view.zoom})`}>
            <circle cx={20} cy={20} r={0.8} fill="#CBD5E1" />
          </pattern>
        </defs>
        <rect className="canvas-bg" width="100%" height="100%" fill="url(#grid)" />

        <g transform={`translate(${view.panX},${view.panY}) scale(${view.zoom})`}>
          {/* Connections */}
          {map.connections.map((conn) => {
            const from = map.nodes.find((n) => n.id === conn.fromId);
            const to = map.nodes.find((n) => n.id === conn.toId);
            if (!from || !to) return null;
            return <ConnectionLine key={conn.id} from={from} to={to} />;
          })}

          {/* Nodes */}
          {map.nodes.map((node) => (
            <MindMapNodeComponent
              key={node.id}
              node={node}
              isSelected={selectedId === node.id}
              onSelect={handleNodeSelect}
              onMove={handleNodeMove}
              onEdit={handleNodeEdit}
              onAddChild={handleAddChild}
              onDelete={handleDeleteNode}
              onStartConnect={handleStartConnect}
              zoom={view.zoom}
            />
          ))}
        </g>
      </svg>

      {/* Help hint */}
      <div style={{
        position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
        fontSize: 12, color: '#94A3B8', background: '#fff', padding: '6px 14px',
        borderRadius: 8, border: '1px solid #E2E8F0',
      }}>
        Double-click to add a node &middot; Select + Tab for child &middot; Alt+drag to pan &middot; Scroll to zoom
      </div>

      {showMapList && (
        <MapList
          maps={loadMapsIndex()}
          currentId={map.id}
          onSelect={handleSelectMap}
          onDelete={handleDeleteMap}
          onClose={() => setShowMapList(false)}
        />
      )}
    </div>
  );
}
