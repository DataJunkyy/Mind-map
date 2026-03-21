import { useState, useCallback, useRef, type WheelEvent, type MouseEvent } from 'react';
import type { ViewState } from '../types';

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;

export function useViewState() {
  const [view, setView] = useState<ViewState>({ panX: 0, panY: 0, zoom: 1 });
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setView((prev) => {
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.zoom * delta));
      // Zoom towards cursor
      const rect = (e.target as HTMLElement).closest('.canvas-container')?.getBoundingClientRect();
      if (!rect) return { ...prev, zoom: newZoom };
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const scale = newZoom / prev.zoom;
      return {
        zoom: newZoom,
        panX: cx - (cx - prev.panX) * scale,
        panY: cy - (cy - prev.panY) * scale,
      };
    });
  }, []);

  const startPan = useCallback((e: MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanning.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const movePan = useCallback((e: MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setView((prev) => ({ ...prev, panX: prev.panX + dx, panY: prev.panY + dy }));
  }, []);

  const endPan = useCallback(() => {
    isPanning.current = false;
  }, []);

  const screenToWorld = useCallback(
    (screenX: number, screenY: number, rect: DOMRect) => {
      return {
        x: (screenX - rect.left - view.panX) / view.zoom,
        y: (screenY - rect.top - view.panY) / view.zoom,
      };
    },
    [view]
  );

  const resetView = useCallback(() => {
    setView({ panX: 0, panY: 0, zoom: 1 });
  }, []);

  return { view, setView, handleWheel, startPan, movePan, endPan, screenToWorld, resetView, isPanning };
}
