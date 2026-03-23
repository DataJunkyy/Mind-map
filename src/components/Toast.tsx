import { useState, useEffect, useCallback, useRef } from 'react';

export interface ToastMessage {
  id: number;
  text: string;
  type: 'info' | 'success' | 'error';
}

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((text: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

interface Props {
  toasts: ToastMessage[];
  onRemove: (id: number) => void;
}

export function ToastContainer({ toasts, onRemove }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div style={containerStyle}>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: number) => void }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    timerRef.current = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => onRemove(toast.id), 300);
      return () => clearTimeout(t);
    }
  }, [visible, toast.id, onRemove]);

  const colors = {
    info: { bg: '#1E293B', text: '#fff' },
    success: { bg: '#059669', text: '#fff' },
    error: { bg: '#DC2626', text: '#fff' },
  };

  const c = colors[toast.type];

  return (
    <div
      style={{
        ...toastStyle,
        background: c.bg,
        color: c.text,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
      }}
      onClick={() => { setVisible(false); }}
    >
      {toast.text}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 48,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  zIndex: 400,
  pointerEvents: 'none',
};

const toastStyle: React.CSSProperties = {
  padding: '8px 18px',
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 500,
  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  transition: 'opacity 0.3s, transform 0.3s',
  pointerEvents: 'auto',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};
