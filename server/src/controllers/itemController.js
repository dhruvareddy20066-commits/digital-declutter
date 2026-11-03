import CleanupItem from '../models/CleanupItem.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_STALE_DAYS = 30;
const FIELDS = ['title', 'type', 'category', 'status', 'reviewIntervalDays', 'notes', 'link'];

// Only these keys may be sorted on; a leading "-" means descending.
const SORTABLE = ['title', 'lastReviewedAt', 'reviewIntervalDays', 'createdAt'];

const pick = (source) =>
  FIELDS.reduce((acc, key) => (source[key] !== undefined ? { ...acc, [key]: source[key] } : acc), {});

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildSort = (sort) => {
  if (!sort) return { createdAt: -1 };
  const desc = sort.startsWith('-');
  const key = desc ? sort.slice(1) : sort;
  if (!SORTABLE.includes(key)) return { createdAt: -1 };
  return { [key]: desc ? -1 : 1 };
};

// Date math: anything reviewed before (now - N days) is stale.
const staleThreshold = (days) => new Date(Date.now() - days * DAY_MS);

export const createItem = asyncHandler(async (req, res) => {
  const item = await CleanupItem.create(pick(req.body));
  res.status(201).json({ success: true, data: item });
});

export const getItems = asyncHandler(async (req, res) => {
  const { type, category, status, q, sort } = req.query;
  const filter = {};

  if (type) filter.type = type;
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (q && q.trim()) {
    const regex = new RegExp(escapeRegex(q.trim()), 'i');
    filter.$or = [{ title: regex }, { notes: regex }];
  }

  const items = await CleanupItem.find(filter).sort(buildSort(sort));
  res.json({ success: true, count: items.length, data: items });
});

export const getItem = asyncHandler(async (req, res) => {
  const item = await CleanupItem.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Item not found');
  res.json({ success: true, data: item });
});

export const updateItem = asyncHandler(async (req, res) => {
  const item = await CleanupItem.findByIdAndUpdate(req.params.id, pick(req.body), {
    new: true,
    runValidators: true,
  });
  if (!item) throw new ApiError(404, 'Item not found');
  res.json({ success: true, data: item });
});

export const reviewItem = asyncHandler(async (req, res) => {
  const item = await CleanupItem.findByIdAndUpdate(
    req.params.id,
    { lastReviewedAt: Date.now() },
    { new: true }
  );
  if (!item) throw new ApiError(404, 'Item not found');
  res.json({ success: true, data: item });
});

export const deleteItem = asyncHandler(async (req, res) => {
  const item = await CleanupItem.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, 'Item not found');
  res.json({ success: true, message: 'Deleted successfully' });
});

// Differentiating feature: active items not reviewed in the last N days.
export const getStaleItems = asyncHandler(async (req, res) => {
  const days = req.query.days ?? DEFAULT_STALE_DAYS;
  const items = await CleanupItem.find({
    status: 'active',
    lastReviewedAt: { $lt: staleThreshold(days) },
  }).sort({ lastReviewedAt: 1 }); // longest-neglected first

  res.json({ success: true, count: items.length, thresholdDays: days, data: items });
});

const toBreakdown = (rows) => rows.reduce((acc, row) => ({ ...acc, [row._id]: row.count }), {});

export const getStats = asyncHandler(async (req, res) => {
  const days = Number.parseInt(req.query.days, 10) || DEFAULT_STALE_DAYS;
  const now = Date.now();

  const [totalItems, activeItems, archivedItems, staleCount, overdueCount, categories, types] =
    await Promise.all([
      CleanupItem.countDocuments(),
      CleanupItem.countDocuments({ status: 'active' }),
      CleanupItem.countDocuments({ status: 'archived' }),
      CleanupItem.countDocuments({ status: 'active', lastReviewedAt: { $lt: staleThreshold(days) } }),
      // Items whose own reviewIntervalDays has run out.
      CleanupItem.countDocuments({
        status: 'active',
        $expr: {
          $lt: [{ $add: ['$lastReviewedAt', { $multiply: ['$reviewIntervalDays', DAY_MS] }] }, new Date(now)],
        },
      }),
      CleanupItem.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      CleanupItem.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
    ]);

  res.json({
    success: true,
    data: {
      totalItems,
      activeItems,
      archivedItems,
      staleCount,
      thresholdDays: days,
      overdueCount,
      categoryBreakdown: toBreakdown(categories),
      typeBreakdown: toBreakdown(types),
    },
  });
});
