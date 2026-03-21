import { useState } from 'react';
import { Canvas } from './components/Canvas';
import { loadMapsIndex, loadMap, createNewMap } from './store/mindMapStore';
import type { MindMap } from './types';

function getInitialMap(): MindMap {
  const index = loadMapsIndex();
  if (index.length > 0) {
    const latest = index.sort((a, b) => b.updatedAt - a.updatedAt)[0];
    const loaded = loadMap(latest.id);
    if (loaded) return loaded;
  }
  return createNewMap();
}

function App() {
  const [map] = useState<MindMap>(getInitialMap);
  return <Canvas initialMap={map} />;
}

export default App;
