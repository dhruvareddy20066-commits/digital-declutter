import { useEffect, useRef } from 'react';
import { Loader2, Trash2 } from 'lucide-react';

const ConfirmDialog = ({ open, title, message, confirmLabel = 'Delete', loading = false, onConfirm, onCancel }) => {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    cancelRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && !loading && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center" onClick={() => !loading && onCancel()}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-lift animate-pop"
      >
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-alarm-50 text-alarm-600">
          <Trash2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 id="confirm-title" className="font-display text-xl font-semibold">
          {title}
        </h2>
        <p id="confirm-message" className="mt-1 break-words text-sm text-ink-soft">
          {message}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button ref={cancelRef} type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            Keep item
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
