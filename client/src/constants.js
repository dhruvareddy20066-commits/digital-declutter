export const TYPES = [
  { value: 'account', label: 'Account' },
  { value: 'file', label: 'File or folder' },
  { value: 'subscription', label: 'Subscription' },
];

export const CATEGORIES = ['Work', 'Personal', 'Finance', 'Entertainment', 'Cloud Storage', 'Other'];

export const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
  { value: 'deleted', label: 'Deleted' },
];

export const STALE_OPTIONS = [7, 30, 90, 180, 365];
export const DEFAULT_STALE_DAYS = 30;

export const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'lastReviewedAt', label: 'Longest unreviewed' },
  { value: '-lastReviewedAt', label: 'Recently reviewed' },
  { value: 'title', label: 'Title A to Z' },
  { value: 'reviewIntervalDays', label: 'Shortest interval' },
];

export const labelFor = (list, value) => list.find((o) => o.value === value)?.label ?? value;
