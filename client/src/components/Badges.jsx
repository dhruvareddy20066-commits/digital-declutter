import { AtSign, CreditCard, FileText } from 'lucide-react';
import { STATUSES, TYPES, labelFor } from '../constants.js';

const TYPE_ICONS = { account: AtSign, file: FileText, subscription: CreditCard };

export const TypeIcon = ({ type, className = 'h-5 w-5' }) => {
  const Icon = TYPE_ICONS[type] || FileText;
  return <Icon className={className} aria-hidden="true" />;
};

export const TypeBadge = ({ type }) => (
  <span className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
    <TypeIcon type={type} className="h-4 w-4" />
    {labelFor(TYPES, type)}
  </span>
);

const STATUS_STYLES = {
  active: 'bg-pine-50 text-pine-800 ring-pine-600/20',
  archived: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  deleted: 'bg-alarm-50 text-alarm-600 ring-alarm-600/20',
};

export const StatusBadge = ({ status }) => (
  <span className={`badge ring-1 ring-inset ${STATUS_STYLES[status] || STATUS_STYLES.archived}`}>
    {labelFor(STATUSES, status)}
  </span>
);

export const CategoryBadge = ({ category }) => (
  <span className="badge bg-white text-ink-soft ring-1 ring-inset ring-ink/15">{category}</span>
);
