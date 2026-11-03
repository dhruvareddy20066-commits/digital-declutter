import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCheck, ExternalLink, Loader2, Pencil, Trash2 } from 'lucide-react';
import { deleteItem, getItem, reviewItem } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { CategoryBadge, StatusBadge, TypeBadge } from '../components/Badges.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ReviewMeter from '../components/ReviewMeter.jsx';
import { formatDate, plural } from '../utils/format.js';

const Row = ({ label, children }) => (
  <div className="grid gap-1 py-3 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
    <dt className="text-sm text-ink-soft">{label}</dt>
    <dd className="break-words">{children}</dd>
  </div>
);

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getItem(id);
      setItem(res.data);
    } catch (err) {
      setError(err.userMessage);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const markReviewed = async () => {
    setReviewing(true);
    try {
      await reviewItem(id);
      toast.success('Marked as reviewed');
      await load();
    } catch (err) {
      toast.error(err.userMessage);
    } finally {
      setReviewing(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteItem(id);
      toast.success('Item deleted');
      navigate('/items');
    } catch (err) {
      toast.error(err.userMessage);
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (error) {
    return <EmptyState title="Item not found" message={error} actionLabel="Back to all items" to="/items" />;
  }
  if (!item) return <LoadingSpinner label="Loading item" />;

  const overdue = item.isOverdue;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/items" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All items
      </Link>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={item.status} />
          <CategoryBadge category={item.category} />
          <TypeBadge type={item.type} />
        </div>
        <h1 className="break-words font-display text-3xl font-bold tracking-tight sm:text-4xl">{item.title}</h1>
      </div>

      <section
        className={`rounded-2xl p-5 ring-1 sm:p-6 ${overdue ? 'bg-dust-50 ring-dust-400/50' : 'bg-white ring-ink/10'}`}
        aria-label="Review status"
      >
        <p className="font-semibold">
          {overdue
            ? `Review overdue: ${plural(item.daysSinceReview, 'day')} since the last look`
            : `Next review due ${formatDate(item.nextReviewAt)}`}
        </p>
        <div className="mt-3 max-w-sm">
          <ReviewMeter days={item.daysSinceReview} interval={item.reviewIntervalDays} />
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button type="button" className="btn btn-primary" onClick={markReviewed} disabled={reviewing}>
            {reviewing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCheck className="h-4 w-4" aria-hidden="true" />}
            Mark reviewed
          </button>
          <Link to={`/items/${item._id}/edit`} className="btn btn-secondary">
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </Link>
          <button type="button" className="btn btn-ghost-danger" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </button>
        </div>
      </section>

      <dl className="divide-y divide-ink/10 rounded-2xl bg-white px-5 ring-1 ring-ink/10 sm:px-6">
        <Row label="Review interval">Every {plural(item.reviewIntervalDays, 'day')}</Row>
        <Row label="Last reviewed">{formatDate(item.lastReviewedAt)}</Row>
        <Row label="Added on">{formatDate(item.createdAt)}</Row>
        <Row label="Last updated">{formatDate(item.updatedAt)}</Row>
        <Row label="Link">
          {item.link ? (
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Open link
            </a>
          ) : (
            <span className="text-ink-soft">No link added</span>
          )}
        </Row>
        <Row label="Notes">{item.notes ? <p className="whitespace-pre-wrap">{item.notes}</p> : <span className="text-ink-soft">No notes</span>}</Row>
      </dl>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this item?"
        message={`"${item.title}" will be permanently removed from your list. This cannot be undone.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default ItemDetail;
