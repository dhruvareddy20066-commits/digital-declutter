const DATE_OPTIONS = { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' };

export const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-IN', DATE_OPTIONS) : 'Never');

export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export const daysLabel = (days) => (days === 0 ? 'today' : `${plural(days, 'day')} ago`);

export const unreviewedFor = (days) => (days === 0 ? 'Reviewed today' : `Unreviewed for ${plural(days, 'day')}`);
