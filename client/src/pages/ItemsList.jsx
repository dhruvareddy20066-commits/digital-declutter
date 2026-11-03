import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCheck, Inbox, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { deleteItem, getStaleItems, listItems, reviewItem } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { CategoryBadge, StatusBadge, TypeBadge, TypeIcon } from '../components/Badges.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ReviewMeter from '../components/ReviewMeter.jsx';
import { CATEGORIES, SORT_OPTIONS, STALE_OPTIONS, STATUSES, TYPES } from '../constants.js';
import { plural } from '../utils/format.js';

const compareBy = (a, b, key) => {
  if (key === 'title') return a.title.localeCompare(b.title);
  if (key === 'reviewIntervalDays') return a.reviewIntervalDays - b.reviewIntervalDays;
  return new Date(a[key]) - new Date(b[key]);
};

// The stale endpoint only returns active items, so other filters and sorting run here.
const filterLocally = (items, { q, type, category, status, sort }) => {
  const needle = q.trim().toLowerCase();
  const result = items.filter(
    (i) =>
      (!type || i.type === type) &&
      (!category || i.category === category) &&
      (!status || i.status === status) &&
      (!needle || i.title.toLowerCase().includes(needle) || (i.notes || '').toLowerCase().includes(needle))
  );
  const desc = sort.startsWith('-');
  const key = desc ? sort.slice(1) : sort;
  return result.sort((a, b) => (desc ? -1 : 1) * compareBy(a, b, key));
};

const RowActions = ({ item, busy, onReview, onDelete }) => (
  <div className="flex flex-wrap items-center gap-2">
    <button type="button" className="btn btn-secondary" onClick={() => onReview(item)} disabled={busy}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCheck className="h-4 w-4" aria-hidden="true" />}
      Mark Reviewed
    </button>
    <Link to={`/items/${item._id}/edit`} className="btn btn-secondary" aria-label={`Edit ${item.title}`}>
      <Pencil className="h-4 w-4" aria-hidden="true" />
      Edit
    </Link>
    <button type="button" className="btn btn-ghost-danger" onClick={() => onDelete(item)} aria-label={`Delete ${item.title}`}>
      <Trash2 className="h-4 w-4" aria-hidden="true" />
      Delete
    </button>
  </div>
);

const ItemsList = () => {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const type = params.get('type') || '';
  const category = params.get('category') || '';
  const status = params.get('status') || '';
  const sort = params.get('sort') || '-createdAt';
  const stale = params.get('stale') || '';

  const [search, setSearch] = useState(q);
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const update = useCallback(
    (key, value) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true }
      ),
    [setParams]
  );

  // Debounce typing in the search box.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== q) update('q', search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, q, update]);

  const load = useCallback(async () => {
    setError('');
    try {
      if (stale) {
        const res = await getStaleItems(Number(stale));
        setItems(filterLocally(res.data, { q, type, category, status, sort }));
      } else {
        const res = await listItems({ q: q || undefined, type, category, status, sort });
        setItems(res.data);
      }
    } catch (err) {
      setError(err.userMessage);
      setItems((current) => current ?? []);
    }
  }, [q, type, category, status, sort, stale]);

  useEffect(() => {
    load();
  }, [load]);

  const markReviewed = async (item) => {
    setBusyId(item._id);
    try {
      await reviewItem(item._id);
      toast.success(`"${item.title}" marked as reviewed`);
      await load();
    } catch (err) {
      toast.error(err.userMessage);
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteItem(toDelete._id);
      toast.success(`"${toDelete.title}" deleted`);
      setToDelete(null);
      await load();
    } catch (err) {
      toast.error(err.userMessage);
    } finally {
      setDeleting(false);
    }
  };

  const hasFilters = Boolean(q || type || category || status || stale);
  const clearFilters = () => {
    setSearch('');
    setParams({}, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">All items</h1>
          <p className="mt-1 text-ink-soft">Search, filter and review everything you are tracking.</p>
        </div>
        <Link to="/items/new" className="btn btn-primary">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add item
        </Link>
      </div>

      <div className="grid gap-3 rounded-xl bg-white p-4 ring-1 ring-ink/10 sm:grid-cols-2 lg:grid-cols-6">
        <label className="relative sm:col-span-2 lg:col-span-2">
          <span className="sr-only">Search by title or notes</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or notes"
            className="input pl-9"
          />
        </label>
        <label>
          <span className="sr-only">Type</span>
          <select className="input" value={type} onChange={(e) => update('type', e.target.value)}>
            <option value="">All types</option>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Category</span>
          <select className="input" value={category} onChange={(e) => update('category', e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Status</span>
          <select className="input" value={status} onChange={(e) => update('status', e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Sort by</span>
          <select className="input" value={sort} onChange={(e) => update('sort', e.target.value)}>
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2 lg:col-span-3">
          <span className="sr-only">Stale threshold</span>
          <select className="input" value={stale} onChange={(e) => update('stale', e.target.value)}>
            <option value="">Any review date</option>
            {STALE_OPTIONS.map((n) => (
              <option key={n} value={n}>Stale: not reviewed in {n}+ days</option>
            ))}
          </select>
        </label>
        {hasFilters && (
          <button type="button" onClick={clearFilters} className="btn btn-secondary sm:col-span-2 lg:col-span-3">
            <X className="h-4 w-4" aria-hidden="true" />
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-alarm-50 px-4 py-3 text-sm text-alarm-600">
          {error}
        </p>
      )}

      {items === null ? (
        <LoadingSpinner label="Loading items" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={hasFilters ? 'No items match these filters' : 'Nothing tracked yet'}
          message={hasFilters ? 'Try a different search or clear the filters.' : 'Add your first account, file or subscription to start decluttering.'}
          actionLabel={hasFilters ? 'Clear filters' : 'Add item'}
          to={hasFilters ? undefined : '/items/new'}
          onAction={hasFilters ? clearFilters : undefined}
        />
      ) : (
        <>
          <p className="text-sm text-ink-soft" aria-live="polite">
            Showing {plural(items.length, 'item')}
          </p>

          <div className="hidden overflow-x-auto rounded-xl bg-white ring-1 ring-ink/10 md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/10 bg-paper/60 text-ink-soft">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Item</th>
                  <th scope="col" className="px-4 py-3 font-medium">Category</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium">Review</th>
                  <th scope="col" className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {items.map((item) => (
                  <tr key={item._id} className="align-top">
                    <td className="max-w-xs px-4 py-4">
                      <Link to={`/items/${item._id}`} className="break-words font-semibold hover:underline">
                        {item.title}
                      </Link>
                      <div className="mt-1"><TypeBadge type={item.type} /></div>
                    </td>
                    <td className="px-4 py-4"><CategoryBadge category={item.category} /></td>
                    <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                    <td className="w-44 px-4 py-4">
                      <ReviewMeter days={item.daysSinceReview} interval={item.reviewIntervalDays} />
                    </td>
                    <td className="px-4 py-4">
                      <RowActions item={item} busy={busyId === item._id} onReview={markReviewed} onDelete={setToDelete} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
            {items.map((item) => (
              <li key={item._id} className="space-y-3 rounded-xl bg-white p-4 ring-1 ring-ink/10">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pine-50 text-pine-600">
                    <TypeIcon type={item.type} />
                  </span>
                  <div className="min-w-0">
                    <Link to={`/items/${item._id}`} className="break-words font-semibold hover:underline">
                      {item.title}
                    </Link>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      <CategoryBadge category={item.category} />
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                </div>
                <ReviewMeter days={item.daysSinceReview} interval={item.reviewIntervalDays} />
                <RowActions item={item} busy={busyId === item._id} onReview={markReviewed} onDelete={setToDelete} />
              </li>
            ))}
          </ul>
        </>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this item?"
        message={toDelete ? `"${toDelete.title}" will be permanently removed from your list. This cannot be undone.` : ''}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};

export default ItemsList;
