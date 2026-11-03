import { Router } from 'express';
import {
  createItem,
  deleteItem,
  getItem,
  getItems,
  getStaleItems,
  getStats,
  reviewItem,
  updateItem,
} from '../controllers/itemController.js';
import { idRules, itemRules, staleRules, validate } from '../middleware/validate.js';

const router = Router();

router.route('/').get(getItems).post(itemRules, validate, createItem);

// NOTE: must be declared before '/:id' or "stale" would be read as an ID.
router.get('/stale', staleRules, validate, getStaleItems);

router.patch('/:id/review', idRules, validate, reviewItem);

router
  .route('/:id')
  .get(idRules, validate, getItem)
  .put(idRules, itemRules, validate, updateItem)
  .delete(idRules, validate, deleteItem);

export const statsRouter = Router().get('/', getStats);

export default router;
