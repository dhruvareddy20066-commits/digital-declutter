import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { createItem, getItem, updateItem } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import EmptyState from '../components/EmptyState.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { CATEGORIES, STATUSES, TYPES } from '../constants.js';

const EMPTY = {
  title: '',
  type: 'account',
  category: 'Personal',
  status: 'active',
  reviewIntervalDays: '30',
  link: '',
  notes: '',
};

const isValidUrl = (value) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

// Mirrors the server rules so mistakes are caught before a request is sent.
const validate = (form) => {
  const errors = {};
  const title = form.title.trim();
  const interval = Number(form.reviewIntervalDays);

  if (!title || title.length > 100) errors.title = 'Title is required and cannot exceed 100 characters.';
  if (!Number.isInteger(interval) || interval < 1 || interval > 730) {
    errors.reviewIntervalDays = 'Review interval must be a whole number between 1 and 730.';
  }
  if (form.link.trim() && !isValidUrl(form.link.trim())) {
    errors.link = 'Link must be a valid URL starting with http:// or https://.';
  }
  if (form.notes.length > 500) errors.notes = 'Notes cannot exceed 500 characters.';
  return errors;
};

const Field = ({ id, label, error, hint, children }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
      {label}
    </label>
    {children}
    {error ? (
      <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-alarm-600">
        {error}
      </p>
    ) : (
      hint && <p className="mt-1.5 text-sm text-ink-soft">{hint}</p>
    )}
  </div>
);

const ItemForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(EMPTY);
  const [initial, setInitial] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    getItem(id)
      .then((res) => {
        if (!active) return;
        const item = res.data;
        const values = {
          title: item.title,
          type: item.type,
          category: item.category,
          status: item.status,
          reviewIntervalDays: String(item.reviewIntervalDays),
          link: item.link || '',
          notes: item.notes || '',
        };
        setForm(values);
        setInitial(values);
      })
      .catch((err) => active && setLoadError(err.userMessage))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, isEdit]);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty || saving) return undefined;
    const warn = (e) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, saving]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }

    const payload = {
      ...form,
      title: form.title.trim(),
      link: form.link.trim(),
      reviewIntervalDays: Number(form.reviewIntervalDays),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateItem(id, payload);
        toast.success('Changes saved');
        navigate(`/items/${id}`);
      } else {
        await createItem(payload);
        toast.success('Item added');
        navigate('/items');
      }
    } catch (err) {
      setErrors(err.fieldErrors || {});
      toast.error(err.userMessage);
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading item" />;
  if (loadError) {
    return <EmptyState title="Item not found" message={loadError} actionLabel="Back to all items" to="/items" />;
  }

  const fieldClass = (key) => `input ${errors[key] ? 'border-alarm-600 focus:ring-alarm-600' : ''}`;
  const aria = (key) => ({ 'aria-invalid': Boolean(errors[key]), 'aria-describedby': errors[key] ? `${key}-error` : undefined });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to={isEdit ? `/items/${id}` : '/items'} className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </Link>
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{isEdit ? 'Edit item' : 'Add item'}</h1>
        <p className="mt-1 text-ink-soft">
          {isEdit ? 'Update the details or change how often it needs a review.' : 'Track an account, file or subscription you want to clean up.'}
        </p>
      </div>

      <form onSubmit={submit} noValidate className="space-y-5 rounded-2xl bg-white p-5 ring-1 ring-ink/10 sm:p-7">
        <Field id="title" label="Title" error={errors.title} hint={`${form.title.length}/100 characters`}>
          <input id="title" className={fieldClass('title')} value={form.title} onChange={set('title')} placeholder="e.g. Old Gmail account" {...aria('title')} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="type" label="Type" error={errors.type}>
            <select id="type" className={fieldClass('type')} value={form.type} onChange={set('type')} {...aria('type')}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
          <Field id="category" label="Category" error={errors.category}>
            <select id="category" className={fieldClass('category')} value={form.category} onChange={set('category')} {...aria('category')}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field id="status" label="Status" error={errors.status}>
            <select id="status" className={fieldClass('status')} value={form.status} onChange={set('status')} {...aria('status')}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>
          <Field id="reviewIntervalDays" label="Review every (days)" error={errors.reviewIntervalDays} hint="Between 1 and 730 days">
            <input
              id="reviewIntervalDays"
              type="number"
              inputMode="numeric"
              min="1"
              max="730"
              className={fieldClass('reviewIntervalDays')}
              value={form.reviewIntervalDays}
              onChange={set('reviewIntervalDays')}
              {...aria('reviewIntervalDays')}
            />
          </Field>
        </div>

        <Field id="link" label="Link (optional)" error={errors.link}>
          <input id="link" type="url" className={fieldClass('link')} value={form.link} onChange={set('link')} placeholder="https://" {...aria('link')} />
        </Field>

        <Field id="notes" label="Notes (optional)" error={errors.notes} hint={`${form.notes.length}/500 characters`}>
          <textarea id="notes" rows={4} className={fieldClass('notes')} value={form.notes} onChange={set('notes')} placeholder="What needs to happen before this can be cleaned up?" {...aria('notes')} />
        </Field>

        <div className="flex flex-col-reverse gap-2 border-t border-ink/10 pt-5 sm:flex-row sm:justify-end">
          <Link to={isEdit ? `/items/${id}` : '/items'} className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving || (isEdit && !dirty)} title={isEdit && !dirty ? 'No changes to save' : undefined}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isEdit ? 'Save changes' : 'Add item'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ItemForm;
