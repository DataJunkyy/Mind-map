import { useState, useCallback, useRef } from 'react';
import type { MindMap } from '../types';

const MAX_HISTORY = 50;

export function useHistory(initial: MindMap) {
  const [map, setMapInternal] = useState<MindMap>(initial);
  const pastRef = useRef<MindMap[]>([]);
  const futureRef = useRef<MindMap[]>([]);

  const setMap = useCallback((updaterOrMap: MindMap | ((prev: MindMap) => MindMap)) => {
    setMapInternal((prev) => {
      const next = typeof updaterOrMap === 'function' ? updaterOrMap(prev) : updaterOrMap;
      if (next === prev) return prev;
      pastRef.current = [...pastRef.current.slice(-(MAX_HISTORY - 1)), prev];
      futureRef.current = [];
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setMapInternal((current) => {
      if (pastRef.current.length === 0) return current;
      const prev = pastRef.current[pastRef.current.length - 1];
      pastRef.current = pastRef.current.slice(0, -1);
      futureRef.current = [...futureRef.current, current];
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setMapInternal((current) => {
      if (futureRef.current.length === 0) return current;
      const next = futureRef.current[futureRef.current.length - 1];
      futureRef.current = futureRef.current.slice(0, -1);
      pastRef.current = [...pastRef.current, current];
      return next;
    });
  }, []);

  // Replace map without adding to history (for loading/importing)
  const replaceMap = useCallback((newMap: MindMap) => {
    pastRef.current = [];
    futureRef.current = [];
    setMapInternal(newMap);
  }, []);

  const canUndo = pastRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  return { map, setMap, undo, redo, replaceMap, canUndo, canRedo };
}
