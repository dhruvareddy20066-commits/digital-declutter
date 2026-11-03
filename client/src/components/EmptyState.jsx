import { Link } from 'react-router-dom';

const EmptyState = ({ icon: Icon, title, message, actionLabel, to, onAction }) => (
  <div className="flex flex-col items-center rounded-xl border border-dashed border-ink/20 bg-white/60 px-6 py-14 text-center">
    {Icon && (
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-pine-50 text-pine-600">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
    )}
    <h3 className="font-display text-xl font-semibold">{title}</h3>
    {message && <p className="mt-1 max-w-sm break-words text-sm text-ink-soft">{message}</p>}
    {actionLabel && to && (
      <Link to={to} className="btn btn-primary mt-5">
        {actionLabel}
      </Link>
    )}
    {actionLabel && onAction && !to && (
      <button type="button" onClick={onAction} className="btn btn-primary mt-5">
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
