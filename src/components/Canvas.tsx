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
import { TestingPanel, type LogEntry } from './TestingPanel';
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

let logId = 0;

export function Canvas({ initialMap }: Props) {
  const { map, setMap, undo, redo, replaceMap, canUndo, canRedo } = useHistory(initialMap);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [showMapList, setShowMapList] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTesting, setShowTesting] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [clipboard, setClipboard] = useState<MindMapNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editTrigger, setEditTrigger] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  const { view, setView, handleWheel, startPan, movePan, endPan, screenToWorld, resetView } =
    useViewState();

  const { toasts, addToast, removeToast } = useToast();

  // Event logger
  const addLog = useCallback((action: string, detail: string, type: LogEntry['type']) => {
    setLogs(prev => [...prev.slice(-199), { id: ++logId, time: Date.now(), action, detail, type }]);
  }, []);

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
      addLog('add-node', `Root node at (${Math.round(nodePos.x)}, ${Math.round(nodePos.y)})`, 'node');
    },
    [screenToWorld, updateMap, addToast, addLog]
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
      addLog('context-menu', 'Canvas context menu opened', 'map');
    },
    [screenToWorld, addLog]
  );

  const handleNodeSelect = useCallback(
    (id: string) => {
      if (connectingFrom && connectingFrom !== id) {
        updateMap((m) => addConnection(m, connectingFrom, id));
        setConnectingFrom(null);
        setMousePos(null);
        addToast('Connection created', 'success');
        addLog('connect', `${connectingFrom.slice(0, 8)} -> ${id.slice(0, 8)}`, 'connection');
        return;
      }
      setSelectedId(id);
      setSelectedConnectionId(null);
      addLog('select-node', `Node ${id.slice(0, 8)}...`, 'node');
    },
    [connectingFrom, updateMap, addToast, addLog]
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
      addLog('edit-text', `"${text}"`, 'node');
    },
    [updateMap, addLog]
  );

  const handleNodeUpdate = useCallback(
    (id: string, updates: Partial<MindMapNode>) => {
      updateMap((m) => updateNode(m, id, updates));
      const keys = Object.keys(updates).join(', ');
      addLog('update-node', keys, 'node');
    },
    [updateMap, addLog]
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
      addLog('add-child', `Parent: ${parentId.slice(0, 8)}...`, 'node');
    },
    [map.nodes, updateMap, addToast, addLog]
  );

  const handleDeleteNode = useCallback(
    (id: string) => {
      updateMap((m) => deleteNode(m, id));
      if (selectedId === id) setSelectedId(null);
      addToast('Node deleted', 'info');
      addLog('delete-node', `Node ${id.slice(0, 8)}...`, 'node');
    },
    [selectedId, updateMap, addToast, addLog]
  );

  const handleDeleteConnection = useCallback(
    (id: string) => {
      updateMap((m) => deleteConnection(m, id));
      if (selectedConnectionId === id) setSelectedConnectionId(null);
      addToast('Connection deleted', 'info');
      addLog('delete-connection', `Connection ${id.slice(0, 8)}...`, 'connection');
    },
    [selectedConnectionId, updateMap, addToast, addLog]
  );

  const handleSelectConnection = useCallback((id: string) => {
    setSelectedConnectionId(id);
    setSelectedId(null);
    addLog('select-connection', `Connection ${id.slice(0, 8)}...`, 'connection');
  }, [addLog]);

  const handleConnectionContextMenu = useCallback((e: React.MouseEvent, connectionId: string) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'connection',
      connectionId,
    });
    addLog('context-menu', 'Connection context menu', 'connection');
  }, [addLog]);

  const handleNodeContextMenu = useCallback((e: React.MouseEvent, nodeId: string) => {
    setSelectedId(nodeId);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'node',
      nodeId,
    });
    addLog('context-menu', 'Node context menu', 'node');
  }, [addLog]);

  const handleStartConnect = useCallback((id: string) => {
    setConnectingFrom(id);
    addLog('start-connect', `From ${id.slice(0, 8)}...`, 'connection');
  }, [addLog]);

  const handleAutoLayout = useCallback(() => {
    updateMap((m) => autoLayout(m));
    addToast('Layout applied', 'success');
    addLog('auto-layout', 'Applied auto-layout', 'map');
  }, [updateMap, addToast, addLog]);

  const handleCopy = useCallback((id: string) => {
    const node = map.nodes.find((n) => n.id === id);
    if (node) {
      setClipboard(node);
      addToast('Node copied', 'info');
      addLog('copy', `"${node.text}"`, 'clipboard');
    }
  }, [map.nodes, addToast, addLog]);

  const handlePaste = useCallback((x: number, y: number) => {
    if (!clipboard) return;
    updateMap((m) => addNode(m, clipboard.parentId, { x, y }, clipboard.text));
    addToast('Node pasted', 'success');
    addLog('paste', `"${clipboard.text}" at (${Math.round(x)}, ${Math.round(y)})`, 'clipboard');
  }, [clipboard, updateMap, addToast, addLog]);

  const handleDuplicate = useCallback((id: string) => {
    updateMap((m) => duplicateNode(m, id));
    addToast('Node duplicated', 'success');
    addLog('duplicate', `Node ${id.slice(0, 8)}...`, 'node');
  }, [updateMap, addToast, addLog]);

  const handleSelectAll = useCallback(() => {
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
    addLog('export', `"${map.name}"`, 'map');
  }, [map, addToast, addLog]);

  const handleImport = useCallback(
    (json: string) => {
      const imported = importMapFromJSON(json);
      if (imported) {
        saveMap(imported);
        replaceMap(imported);
        setSelectedId(null);
        resetView();
        addToast('Map imported', 'success');
        addLog('import', `"${imported.name}"`, 'map');
      } else {
        addToast('Invalid JSON file', 'error');
        addLog('import-fail', 'Invalid JSON', 'map');
      }
    },
    [resetView, replaceMap, addToast, addLog]
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
    addLog('new-map', `"${newMap.name}"`, 'map');
  }, [resetView, replaceMap, addToast, addLog]);

  const handleSelectMap = useCallback(
    (id: string) => {
      const loaded = loadMap(id);
      if (loaded) {
        replaceMap(loaded);
        setSelectedId(null);
        resetView();
        addLog('load-map', `"${loaded.name}"`, 'map');
      }
    },
    [resetView, replaceMap, addLog]
  );

  const handleDeleteMap = useCallback((id: string) => {
    deleteMap(id);
    addToast('Map deleted', 'info');
    addLog('delete-map', `Map ${id.slice(0, 8)}...`, 'map');
  }, [addToast, addLog]);

  const handleZoomIn = useCallback(() => {
    setView((prev) => ({ ...prev, zoom: Math.min(3, prev.zoom * 1.2) }));
    addLog('zoom-in', 'Zoom in', 'view');
  }, [setView, addLog]);

  const handleZoomOut = useCallback(() => {
    setView((prev) => ({ ...prev, zoom: Math.max(0.2, prev.zoom / 1.2) }));
    addLog('zoom-out', 'Zoom out', 'view');
  }, [setView, addLog]);

  const handleMinimapNavigate = useCallback((panX: number, panY: number) => {
    setView((prev) => ({ ...prev, panX, panY }));
    addLog('minimap-nav', `Pan to (${Math.round(panX)}, ${Math.round(panY)})`, 'view');
  }, [setView, addLog]);

  // Run test = toast + log the attempt
  const handleRunTest = useCallback((testName: string) => {
    addLog('run-test', testName, 'test');
    addToast(`Testing: ${testName}`, 'info');
  }, [addLog, addToast]);

  const handleRunAllTests = useCallback(() => {
    addLog('run-all-tests', `${map.nodes.length} nodes, ${map.connections.length} connections`, 'test');
    addToast('Running all tests...', 'info');
  }, [addLog, addToast, map.nodes.length, map.connections.length]);

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
          addLog('undo', 'Undo', 'map');
          return;
        }
        if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          redo();
          addLog('redo', 'Redo', 'map');
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
          setSearchQuery('');
          return;
        }
        if (e.key === 'a') {
          e.preventDefault();
          handleSelectAll();
          return;
        }
      }

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

      if (e.key === '=' || e.key === '+') {
        handleZoomIn();
      }
      if (e.key === '-') {
        handleZoomOut();
      }
    },
    [selectedId, selectedConnectionId, map.nodes, clipboard, handleDeleteNode, handleDeleteConnection, handleAddChild, handleCopy, handlePaste, handleDuplicate, handleSelectAll, handleZoomIn, handleZoomOut, undo, redo, setView, addLog]
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
          canvasWidth={canvasSize.w - 280 - (showTesting ? 300 : 0)}
          canvasHeight={canvasSize.h}
          onNavigate={handleMinimapNavigate}
        />

        {/* Testing panel toggle button */}
        <button
          onClick={() => setShowTesting(!showTesting)}
          style={testToggleStyle}
          title="Toggle UI Testing Panel"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
          </svg>
          <span style={{ fontSize: 11, fontWeight: 600 }}>Test</span>
        </button>

        {/* Help hint */}
        <div style={hintStyle}>
          Double-click to add &middot; Tab for child &middot; Ctrl+Z undo &middot; Right-click for menu
        </div>
      </div>

      {/* Right panel — Properties */}
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

      {/* Testing Panel — far right */}
      {showTesting && (
        <TestingPanel
          map={map}
          view={view}
          selectedId={selectedId}
          selectedConnectionId={selectedConnectionId}
          connectingFrom={connectingFrom}
          clipboard={clipboard}
          canUndo={canUndo}
          canRedo={canRedo}
          searchQuery={searchQuery}
          logs={logs}
          onRunTest={handleRunTest}
          onRunAllTests={handleRunAllTests}
          onClose={() => setShowTesting(false)}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          menu={contextMenu}
          node={contextMenu.type === 'node' ? map.nodes.find((n) => n.id === contextMenu.nodeId) : null}
          canUndo={canUndo}
          canRedo={canRedo}
          canPaste={!!clipboard}
          onClose={() => setContextMenu(null)}
          onAddNode={(x, y) => { updateMap((m) => addNode(m, null, { x, y })); addToast('Node added', 'success'); addLog('add-node', 'From context menu', 'node'); }}
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

const testToggleStyle: React.CSSProperties = {
  position: 'absolute',
  top: 62,
  right: 12,
  background: 'rgba(255,255,255,0.9)',
  backdropFilter: 'blur(8px)',
  border: '1px solid #E2E8F0',
  borderRadius: 10,
  padding: '6px 12px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  color: '#475569',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  zIndex: 50,
  fontFamily: 'inherit',
  transition: 'all 0.15s',
};
