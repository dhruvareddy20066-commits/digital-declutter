import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, CheckCheck, CheckCircle2, ListChecks, Loader2, Plus, RefreshCw } from 'lucide-react';
import { getStaleItems, getStats, reviewItem } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { CategoryBadge, TypeIcon } from '../components/Badges.jsx';
import EmptyState from '../components/EmptyState.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ReviewMeter from '../components/ReviewMeter.jsx';
import { DEFAULT_STALE_DAYS, STALE_OPTIONS, TYPES } from '../constants.js';
import { plural, unreviewedFor } from '../utils/format.js';

const readSavedDays = () => {
  try {
    const saved = Number(localStorage.getItem('staleDays'));
    return STALE_OPTIONS.includes(saved) ? saved : DEFAULT_STALE_DAYS;
  } catch {
    return DEFAULT_STALE_DAYS;
  }
};

const StatCard = ({ icon: Icon, label, value, tone = 'plain' }) => (
  <div
    className={`rounded-xl p-4 sm:p-5 ${
      tone === 'warn' ? 'bg-dust-50 ring-1 ring-dust-400/50' : 'bg-white ring-1 ring-ink/10'
    }`}
  >
    <div className="flex items-center gap-2 text-sm text-ink-soft">
      <Icon className={`h-4 w-4 ${tone === 'warn' ? 'text-dust-700' : 'text-pine-600'}`} aria-hidden="true" />
      {label}
    </div>
    <p className="mt-2 font-display text-3xl font-bold tabular-nums">{value}</p>
  </div>
);

const Dashboard = () => {
  const toast = useToast();
  const [days, setDays] = useState(readSavedDays);
  const [stats, setStats] = useState(null);
  const [stale, setStale] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setError('');
    setRefreshing(true);
    try {
      const [statsRes, staleRes] = await Promise.all([getStats(days), getStaleItems(days)]);
      setStats(statsRes.data);
      setStale(staleRes.data);
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const changeDays = (value) => {
    const next = Number(value);
    setDays(next);
    try {
      localStorage.setItem('staleDays', String(next));
    } catch {
      /* storage unavailable, the choice just won't persist */
    }
  };

  // Optimistic: remove the row immediately, restore it if the request fails.
  const markReviewed = async (item) => {
    const previous = stale;
    setBusyId(item._id);
    setStale((list) => list.filter((i) => i._id !== item._id));
    setStats((s) => (s ? { ...s, staleCount: Math.max(0, s.staleCount - 1) } : s));
    try {
      await reviewItem(item._id);
      toast.success(`"${item.title}" marked as reviewed`);
      getStats(days).then((res) => setStats(res.data)).catch(() => {});
    } catch (err) {
      setStale(previous);
      toast.error(err.userMessage);
      load();
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <LoadingSpinner label="Loading your dashboard" />;

  if (error && !stats) {
    return (
      <EmptyState
        icon={RefreshCw}
        title="Could not load the dashboard"
        message={error}
        actionLabel="Try again"
        onAction={load}
      />
    );
  }

  const categories = Object.entries(stats?.categoryBreakdown || {});

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Dashboard</h1>
          <p className="mt-1 text-ink-soft">What to clean up, and when to take another look.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link to="/items/new" className="btn btn-primary">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add item
          </Link>
          <Link to="/items" className="btn btn-secondary">
            View all items
          </Link>
        </div>
      </section>

      <section aria-label="Summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={ListChecks} label="Total items" value={stats?.totalItems ?? 0} />
        <StatCard icon={CheckCircle2} label="Active items" value={stats?.activeItems ?? 0} />
        <StatCard icon={Archive} label="Archived" value={stats?.archivedItems ?? 0} />
        <StatCard icon={RefreshCw} label={`Stale (${days}+ days)`} value={stats?.staleCount ?? 0} tone="warn" />
      </section>

      <section aria-labelledby="needs-review" className="rounded-2xl bg-white p-4 ring-1 ring-ink/10 sm:p-7">
        <div className="flex flex-col gap-4 border-b border-ink/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="needs-review" className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Needs review
            </h2>
            <p className="mt-1 max-w-xl text-ink-soft">
              {stale.length === 0
                ? `Every active item was reviewed in the last ${plural(days, 'day')}.`
                : `${plural(stale.length, 'active item')} not reviewed in the last ${plural(days, 'day')}, longest-waiting first.`}
            </p>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Flag items unreviewed for
            <select value={days} onChange={(e) => changeDays(e.target.value)} className="input sm:w-48">
              {STALE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} days or more
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={`transition-opacity ${refreshing ? 'opacity-60' : 'opacity-100'}`}>
          {stale.length === 0 ? (
            <div className="pt-5">
              <EmptyState
                icon={CheckCheck}
                title="Nothing is overdue"
                message="Pick a shorter period to see items that will need a look soon, or add something new to track."
                actionLabel="Add item"
                to="/items/new"
              />
            </div>
          ) : (
            <ul className="divide-y divide-ink/10">
              {stale.map((item) => (
                <li key={item._id} className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_14rem_auto] md:items-center md:gap-6">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pine-50 text-pine-600">
                      <TypeIcon type={item.type} />
                    </span>
                    <div className="min-w-0">
                      <Link to={`/items/${item._id}`} className="break-words font-semibold hover:underline">
                        {item.title}
                      </Link>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="badge bg-dust-100 text-dust-700 ring-1 ring-inset ring-dust-400/40">
                          {unreviewedFor(item.daysSinceReview)}
                        </span>
                        <CategoryBadge category={item.category} />
                      </div>
                    </div>
                  </div>
                  <ReviewMeter days={item.daysSinceReview} interval={item.reviewIntervalDays} />
                  <button
                    type="button"
                    className="btn btn-primary w-full md:w-auto"
                    onClick={() => markReviewed(item)}
                    disabled={busyId === item._id}
                  >
                    {busyId === item._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <CheckCheck className="h-4 w-4" aria-hidden="true" />
                    )}
                    Mark reviewed
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="quick-filters" className="space-y-4">
        <h2 id="quick-filters" className="font-display text-xl font-bold">
          Quick filters
        </h2>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <Link key={t.value} to={`/items?type=${t.value}`} className="chip">
              <TypeIcon type={t.value} className="h-4 w-4" />
              {t.label}
              <span className="font-semibold tabular-nums">{stats?.typeBreakdown?.[t.value] ?? 0}</span>
            </Link>
          ))}
          <Link to="/items?status=archived" className="chip">
            <Archive className="h-4 w-4" aria-hidden="true" />
            Archived
          </Link>
          <Link to={`/items?stale=${days}`} className="chip">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Stale {days}+ days
          </Link>
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map(([name, count]) => (
              <Link key={name} to={`/items?category=${encodeURIComponent(name)}`} className="chip">
                {name}
                <span className="font-semibold tabular-nums">{count}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
