import { useCallback, useRef, useState, useEffect, type MouseEvent } from 'react';
import type { MindMap, MindMapNode, Position } from '../types';
import { useViewState } from '../hooks/useViewState';
import { useHistory } from '../hooks/useHistory';
import { useToast, ToastContainer } from './Toast';
import { MindMapNodeComponent } from './MindMapNode';
import { ConnectionLine } from './ConnectionLine';
import { Toolbar } from './Toolbar';
import { MapList } from './MapList';
import { PropertiesPanel } from './PropertiesPanel';
import { Minimap } from './Minimap';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { ContextMenu, type ContextMenuState } from './ContextMenu';
import { autoLayout } from '../store/autoLayout';
import {
  addNode,
  updateNode,
  deleteNode,
  addConnection,
  deleteConnection,
  duplicateNode,
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
  const { map, setMap, undo, redo, replaceMap, canUndo, canRedo } = useHistory(initialMap);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [showMapList, setShowMapList] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [clipboard, setClipboard] = useState<MindMapNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editTrigger, setEditTrigger] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  const { view, setView, handleWheel, startPan, movePan, endPan, screenToWorld, resetView } =
    useViewState();

  const { toasts, addToast, removeToast } = useToast();

  // Auto-save
  useEffect(() => {
    saveMap(map);
  }, [map]);

  useEffect(() => {
    const onResize = () => setCanvasSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Track mouse position for connection preview
  const handleCanvasMouseMove = useCallback(
    (e: MouseEvent) => {
      movePan(e);
      if (connectingFrom && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const world = screenToWorld(e.clientX, e.clientY, rect);
        setMousePos(world);
      }
    },
    [movePan, connectingFrom, screenToWorld]
  );

  const updateMap = useCallback((updater: (m: MindMap) => MindMap) => {
    setMap((prev) => updater(prev));
  }, [setMap]);

  const handleCanvasClick = useCallback(
    (e: MouseEvent) => {
      if (e.target !== svgRef.current && !(e.target as HTMLElement).closest('.canvas-bg')) return;

      if (connectingFrom) {
        setConnectingFrom(null);
        setMousePos(null);
        return;
      }

      setSelectedId(null);
      setSelectedConnectionId(null);
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
      const nodePos: Position = { x: pos.x - 70, y: pos.y - 22 };
      updateMap((m) => addNode(m, null, nodePos));
      addToast('Node added', 'success');
    },
    [screenToWorld, updateMap, addToast]
  );

  const handleCanvasContextMenu = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;
      if (e.target !== svg && !(e.target as HTMLElement).closest('.canvas-bg')) return;

      const rect = svg.getBoundingClientRect();
      const world = screenToWorld(e.clientX, e.clientY, rect);
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        type: 'canvas',
        worldX: world.x - 70,
        worldY: world.y - 22,
      });
    },
    [screenToWorld]
  );

  const handleNodeSelect = useCallback(
    (id: string) => {
      if (connectingFrom && connectingFrom !== id) {
        updateMap((m) => addConnection(m, connectingFrom, id));
        setConnectingFrom(null);
        setMousePos(null);
        addToast('Connection created', 'success');
        return;
      }
      setSelectedId(id);
      setSelectedConnectionId(null);
    },
    [connectingFrom, updateMap, addToast]
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

  const handleNodeUpdate = useCallback(
    (id: string, updates: Partial<MindMapNode>) => {
      updateMap((m) => updateNode(m, id, updates));
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
      addToast('Child node added', 'success');
    },
    [map.nodes, updateMap, addToast]
  );

  const handleDeleteNode = useCallback(
    (id: string) => {
      updateMap((m) => deleteNode(m, id));
      if (selectedId === id) setSelectedId(null);
      addToast('Node deleted', 'info');
    },
    [selectedId, updateMap, addToast]
  );

  const handleDeleteConnection = useCallback(
    (id: string) => {
      updateMap((m) => deleteConnection(m, id));
      if (selectedConnectionId === id) setSelectedConnectionId(null);
      addToast('Connection deleted', 'info');
    },
    [selectedConnectionId, updateMap, addToast]
  );

  const handleSelectConnection = useCallback((id: string) => {
    setSelectedConnectionId(id);
    setSelectedId(null);
  }, []);

  const handleConnectionContextMenu = useCallback((e: React.MouseEvent, connectionId: string) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'connection',
      connectionId,
    });
  }, []);

  const handleNodeContextMenu = useCallback((e: React.MouseEvent, nodeId: string) => {
    setSelectedId(nodeId);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'node',
      nodeId,
    });
  }, []);

  const handleStartConnect = useCallback((id: string) => {
    setConnectingFrom(id);
  }, []);

  const handleAutoLayout = useCallback(() => {
    updateMap((m) => autoLayout(m));
    addToast('Layout applied', 'success');
  }, [updateMap, addToast]);

  const handleCopy = useCallback((id: string) => {
    const node = map.nodes.find((n) => n.id === id);
    if (node) {
      setClipboard(node);
      addToast('Node copied', 'info');
    }
  }, [map.nodes, addToast]);

  const handlePaste = useCallback((x: number, y: number) => {
    if (!clipboard) return;
    updateMap((m) => addNode(m, clipboard.parentId, { x, y }, clipboard.text));
    addToast('Node pasted', 'success');
  }, [clipboard, updateMap, addToast]);

  const handleDuplicate = useCallback((id: string) => {
    updateMap((m) => duplicateNode(m, id));
    addToast('Node duplicated', 'success');
  }, [updateMap, addToast]);

  const handleSelectAll = useCallback(() => {
    // Select first node as a visual indicator
    if (map.nodes.length > 0) {
      setSelectedId(map.nodes[0].id);
    }
  }, [map.nodes]);

  const handleExport = useCallback(() => {
    const json = exportMapAsJSON(map);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${map.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Map exported', 'success');
  }, [map, addToast]);

  const handleImport = useCallback(
    (json: string) => {
      const imported = importMapFromJSON(json);
      if (imported) {
        saveMap(imported);
        replaceMap(imported);
        setSelectedId(null);
        resetView();
        addToast('Map imported', 'success');
      } else {
        addToast('Invalid JSON file', 'error');
      }
    },
    [resetView, replaceMap, addToast]
  );

  const handleRename = useCallback(
    (name: string) => {
      updateMap((m) => ({ ...m, name }));
    },
    [updateMap]
  );

  const handleNewMap = useCallback(() => {
    const newMap = createNewMap();
    replaceMap(newMap);
    setSelectedId(null);
    resetView();
    addToast('New map created', 'success');
  }, [resetView, replaceMap, addToast]);

  const handleSelectMap = useCallback(
    (id: string) => {
      const loaded = loadMap(id);
      if (loaded) {
        replaceMap(loaded);
        setSelectedId(null);
        resetView();
      }
    },
    [resetView, replaceMap]
  );

  const handleDeleteMap = useCallback((id: string) => {
    deleteMap(id);
    addToast('Map deleted', 'info');
  }, [addToast]);

  const handleZoomIn = useCallback(() => {
    setView((prev) => ({ ...prev, zoom: Math.min(3, prev.zoom * 1.2) }));
  }, [setView]);

  const handleZoomOut = useCallback(() => {
    setView((prev) => ({ ...prev, zoom: Math.max(0.2, prev.zoom / 1.2) }));
  }, [setView]);

  const handleMinimapNavigate = useCallback((panX: number, panY: number) => {
    setView((prev) => ({ ...prev, panX, panY }));
  }, [setView]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA';

      // Ctrl combos work everywhere
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
          return;
        }
        if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          redo();
          return;
        }
        if (e.key === 'c' && selectedId) {
          e.preventDefault();
          handleCopy(selectedId);
          return;
        }
        if (e.key === 'v' && clipboard) {
          e.preventDefault();
          handlePaste(0, 0);
          return;
        }
        if (e.key === 'd' && selectedId) {
          e.preventDefault();
          handleDuplicate(selectedId);
          return;
        }
        if (e.key === 'f') {
          e.preventDefault();
          // Focus search is handled by toolbar
          setSearchQuery('');
          return;
        }
        if (e.key === 'a') {
          e.preventDefault();
          handleSelectAll();
          return;
        }
      }

      // Don't intercept when typing in inputs
      if (isInput) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedConnectionId) {
          handleDeleteConnection(selectedConnectionId);
          return;
        }
        if (selectedId) {
          const node = map.nodes.find((n) => n.id === selectedId);
          if (node && node.parentId !== null) {
            handleDeleteNode(selectedId);
          }
        }
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
        setSelectedConnectionId(null);
        setConnectingFrom(null);
        setMousePos(null);
        setSearchQuery('');
      }
      if (e.key === 'Tab' && selectedId) {
        e.preventDefault();
        handleAddChild(selectedId);
      }

      // Arrow keys for panning
      const PAN_STEP = 50;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setView((prev) => ({ ...prev, panY: prev.panY + PAN_STEP }));
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setView((prev) => ({ ...prev, panY: prev.panY - PAN_STEP }));
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setView((prev) => ({ ...prev, panX: prev.panX + PAN_STEP }));
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setView((prev) => ({ ...prev, panX: prev.panX - PAN_STEP }));
      }

      // +/- for zoom
      if (e.key === '=' || e.key === '+') {
        handleZoomIn();
      }
      if (e.key === '-') {
        handleZoomOut();
      }
    },
    [selectedId, selectedConnectionId, map.nodes, clipboard, handleDeleteNode, handleDeleteConnection, handleAddChild, handleCopy, handlePaste, handleDuplicate, handleSelectAll, handleZoomIn, handleZoomOut, undo, redo, setView]
  );

  const selectedNode = selectedId ? map.nodes.find((n) => n.id === selectedId) ?? null : null;

  // Search highlight
  const searchLower = searchQuery.toLowerCase();
  const matchedNodeIds = searchQuery
    ? new Set(map.nodes.filter((n) => n.text.toLowerCase().includes(searchLower)).map((n) => n.id))
    : null;

  // Connection preview line
  const connectFromNode = connectingFrom ? map.nodes.find((n) => n.id === connectingFrom) : null;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#F8FAFC',
        position: 'relative',
        display: 'flex',
      }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Main canvas area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Toolbar
          mapName={map.name}
          zoom={view.zoom}
          canUndo={canUndo}
          canRedo={canRedo}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={resetView}
          onExport={handleExport}
          onImport={handleImport}
          onRename={handleRename}
          onNewMap={handleNewMap}
          onOpenList={() => setShowMapList(true)}
          onAutoLayout={handleAutoLayout}
          onToggleShortcuts={() => setShowShortcuts(true)}
          onUndo={undo}
          onRedo={redo}
          nodeCount={map.nodes.length}
          connectionCount={map.connections.length}
        />

        {connectingFrom && (
          <div style={connectingBannerStyle}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#60A5FA', animation: 'pulse 1.5s infinite' }} />
            Click another node to connect, or press Escape to cancel
          </div>
        )}

        <svg
          ref={svgRef}
          className="canvas-container"
          width="100%"
          height="100%"
          style={{
            position: 'absolute',
            top: 52,
            left: 0,
            bottom: 0,
            right: 0,
            cursor: connectingFrom ? 'crosshair' : 'default',
          }}
          onWheel={handleWheel}
          onMouseDown={(e) => { startPan(e); handleCanvasClick(e); }}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={(e) => { endPan(); if (connectingFrom && e.target === svgRef.current) { /* noop */ } }}
          onDoubleClick={handleCanvasDoubleClick}
          onContextMenu={handleCanvasContextMenu}
        >
          <defs>
            <pattern
              id="grid"
              width={40}
              height={40}
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${view.panX},${view.panY}) scale(${view.zoom})`}
            >
              <circle cx={20} cy={20} r={0.6} fill="#CBD5E1" />
            </pattern>
            <pattern
              id="grid-major"
              width={200}
              height={200}
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${view.panX},${view.panY}) scale(${view.zoom})`}
            >
              <circle cx={100} cy={100} r={1.2} fill="#94A3B8" opacity={0.3} />
            </pattern>
          </defs>
          <rect className="canvas-bg" width="100%" height="100%" fill="url(#grid)" />
          <rect className="canvas-bg" width="100%" height="100%" fill="url(#grid-major)" />

          <g transform={`translate(${view.panX},${view.panY}) scale(${view.zoom})`}>
            {/* Connections */}
            {map.connections.map((conn) => {
              const from = map.nodes.find((n) => n.id === conn.fromId);
              const to = map.nodes.find((n) => n.id === conn.toId);
              if (!from || !to) return null;
              return (
                <ConnectionLine
                  key={conn.id}
                  connection={conn}
                  from={from}
                  to={to}
                  isSelected={selectedConnectionId === conn.id}
                  onSelect={handleSelectConnection}
                  onContextMenu={handleConnectionContextMenu}
                />
              );
            })}

            {/* Connection preview line */}
            {connectFromNode && mousePos && (
              <line
                x1={connectFromNode.position.x + connectFromNode.width / 2}
                y1={connectFromNode.position.y + connectFromNode.height / 2}
                x2={mousePos.x}
                y2={mousePos.y}
                stroke="#4F46E5"
                strokeWidth={2}
                strokeDasharray="6 4"
                opacity={0.6}
                pointerEvents="none"
              />
            )}

            {/* Nodes */}
            {map.nodes.map((node) => {
              const dimmed = matchedNodeIds && !matchedNodeIds.has(node.id);
              return (
                <g key={node.id} opacity={dimmed ? 0.25 : 1} style={{ transition: 'opacity 0.2s' }}>
                  <MindMapNodeComponent
                    node={node}
                    isSelected={selectedId === node.id}
                    isConnecting={!!connectingFrom}
                    connectingFrom={connectingFrom}
                    onSelect={handleNodeSelect}
                    onMove={handleNodeMove}
                    onEdit={handleNodeEdit}
                    onAddChild={handleAddChild}
                    onDelete={handleDeleteNode}
                    onStartConnect={handleStartConnect}
                    onContextMenu={handleNodeContextMenu}
                    zoom={view.zoom}
                    triggerEdit={editTrigger === node.id}
                    onEditTriggered={() => setEditTrigger(null)}
                  />
                </g>
              );
            })}
          </g>
        </svg>

        {/* Minimap */}
        <Minimap
          map={map}
          view={view}
          canvasWidth={canvasSize.w - 280}
          canvasHeight={canvasSize.h}
          onNavigate={handleMinimapNavigate}
        />

        {/* Help hint */}
        <div style={hintStyle}>
          Double-click to add &middot; Tab for child &middot; Ctrl+Z undo &middot; Right-click for menu
        </div>
      </div>

      {/* Right panel */}
      <PropertiesPanel
        map={map}
        selectedNode={selectedNode}
        onUpdate={handleNodeUpdate}
        onAddChild={handleAddChild}
        onDelete={handleDeleteNode}
        onStartConnect={handleStartConnect}
        onDeselect={() => setSelectedId(null)}
        onAutoLayout={handleAutoLayout}
      />

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          menu={contextMenu}
          node={contextMenu.type === 'node' ? map.nodes.find((n) => n.id === contextMenu.nodeId) : null}
          canUndo={canUndo}
          canRedo={canRedo}
          canPaste={!!clipboard}
          onClose={() => setContextMenu(null)}
          onAddNode={(x, y) => { updateMap((m) => addNode(m, null, { x, y })); addToast('Node added', 'success'); }}
          onPaste={(x, y) => handlePaste(x, y)}
          onSelectAll={handleSelectAll}
          onAutoLayout={handleAutoLayout}
          onUndo={undo}
          onRedo={redo}
          onEditNode={(id) => setEditTrigger(id)}
          onDuplicate={handleDuplicate}
          onCopy={handleCopy}
          onAddChild={handleAddChild}
          onConnect={handleStartConnect}
          onDeleteNode={handleDeleteNode}
          onDeleteConnection={handleDeleteConnection}
        />
      )}

      {/* Modals */}
      {showMapList && (
        <MapList
          maps={loadMapsIndex()}
          currentId={map.id}
          onSelect={handleSelectMap}
          onDelete={handleDeleteMap}
          onClose={() => setShowMapList(false)}
        />
      )}

      {showShortcuts && (
        <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

const connectingBannerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 60,
  left: '50%',
  transform: 'translateX(-50%)',
  background: '#1E293B',
  color: '#fff',
  padding: '8px 16px',
  borderRadius: 10,
  fontSize: 13,
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
};

const hintStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 12,
  left: '50%',
  transform: 'translateX(-50%)',
  fontSize: 12,
  color: '#94A3B8',
  background: 'rgba(255,255,255,0.9)',
  backdropFilter: 'blur(8px)',
  padding: '6px 16px',
  borderRadius: 10,
  border: '1px solid #E2E8F0',
  whiteSpace: 'nowrap',
};
