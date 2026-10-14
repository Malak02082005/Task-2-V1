import { Router } from 'express';
import {
  getAllReviews,
  getReview,
  createReview,
  getTopMeals,
  getReviewSummary
} from '../controllers/reviewController.js';

const router = Router();

// Static paths first so they are not captured by /:id
router.get('/top', getTopMeals);
router.get('/summary', getReviewSummary);

router.get('/', getAllReviews);
router.post('/', createReview);
router.get('/:id', getReview);

export default router;