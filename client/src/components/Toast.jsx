import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

const Toast = ({ type, message, onClose }) => {
  const isError = type === 'error';
  const Icon = isError ? AlertTriangle : CheckCircle2;

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-lift animate-toast ${
        isError ? 'border-alarm-600/30 bg-alarm-50 text-alarm-600' : 'border-pine-600/30 bg-pine-50 text-pine-800'
      }`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <p className="flex-1 break-words text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md hover:bg-black/5"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Toast;
