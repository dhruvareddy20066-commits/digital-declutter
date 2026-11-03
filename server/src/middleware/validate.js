import { body, param, query, validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';
import { TYPES, CATEGORIES, STATUSES } from '../models/CleanupItem.js';

const TITLE_MSG = 'Title is required and cannot exceed 100 characters.';
const INTERVAL_MSG = 'Review interval must be a whole number between 1 and 730.';

/** Rules shared by POST (create) and PUT (update). */
export const itemRules = [
  body('title')
    .isString()
    .withMessage(TITLE_MSG)
    .bail()
    .trim()
    .notEmpty()
    .withMessage(TITLE_MSG)
    .isLength({ max: 100 })
    .withMessage(TITLE_MSG),

  body('type')
    .isIn(TYPES)
    .withMessage(`Type must be one of: ${TYPES.join(', ')}.`),

  body('category')
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}.`),

  body('status')
    .optional()
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(', ')}.`),

  body('reviewIntervalDays')
    .isInt({ min: 1, max: 730 })
    .withMessage(INTERVAL_MSG)
    .toInt(),

  body('notes')
    .optional({ values: 'null' })
    .isString()
    .withMessage('Notes must be text.')
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters.'),

  body('link')
    .optional({ values: 'falsy' })
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Link must be a valid URL starting with http:// or https://.'),
];

export const idRules = [param('id').isMongoId().withMessage('Invalid item ID.')];

export const staleRules = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 3650 })
    .withMessage('days must be a whole number between 1 and 3650.')
    .toInt(),
];

/** Turns express-validator results into a 422 (or 400 for bad IDs/queries). */
export const validate = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const list = result.array();
  const errors = list.map((e) => ({ field: e.path, message: e.msg }));
  const onlyParamOrQuery = list.every((e) => e.location === 'params' || e.location === 'query');

  if (onlyParamOrQuery) return next(new ApiError(400, errors[0].message, errors));
  return next(new ApiError(422, 'Validation failed', errors));
};
