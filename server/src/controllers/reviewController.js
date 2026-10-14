import mongoose from 'mongoose';
import { Review } from '../models/Review.js';

// GET /api/reviews
export async function getAllReviews(req, res, next) {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    return res.status(200).json({ reviews });
  } catch (err) { next(err); }
}

// GET /api/reviews/:id
export async function getReview(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid review id' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    return res.status(200).json({ review });
  } catch (err) { next(err); }
}

// POST /api/reviews
export async function createReview(req, res, next) {
  try {
    const { mealCode, rating, comment, reviewedBy } = req.body;

    if (!mealCode || typeof mealCode !== 'string' || !mealCode.trim()) {
      return res.status(400).json({ message: 'mealCode is required' });
    }
    if (rating === undefined || rating === null || rating === '') {
      return res.status(400).json({ message: 'rating is required' });
    }
    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'rating must be a number between 1 and 5' });
    }
    if (reviewedBy !== undefined && reviewedBy !== null && !mongoose.isValidObjectId(reviewedBy)) {
      return res.status(400).json({ message: 'reviewedBy must be a valid user id' });
    }

    const review = await Review.create({
      mealCode: mealCode.trim(),
      rating: numericRating,
      comment,
      reviewedBy: reviewedBy || undefined,
    });

    return res.status(201).json({ review });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    if (err.code === 11000) {
      return res.status(409).json({ message: 'This user has already reviewed this meal' });
    }
    next(err);
  }
}

// GET /api/reviews/top?limit=3
export async function getTopMeals(req, res, next) {
  try {
    let limit = 5;

    if (req.query.limit !== undefined) {
      const raw = String(req.query.limit).trim();
      if (!/^\d+$/.test(raw) || Number(raw) < 1) {
        return res.status(400).json({ message: 'limit must be a positive integer' });
      }
      limit = Number(raw);
    }

    const top = await Review.aggregate([
      {
        $group: {
          _id: '$mealCode',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
      { $sort: { averageRating: -1, reviewCount: -1, _id: 1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          mealCode: '$_id',
          averageRating: 1,
          reviewCount: 1,
        },
      },
    ]);

    return res.status(200).json({ top });
  } catch (err) { next(err); }
}

// GET /api/reviews/summary?mealCode=ML101
export async function getReviewSummary(req, res, next) {
  try {
    const { mealCode } = req.query;

    if (!mealCode || typeof mealCode !== 'string' || !mealCode.trim()) {
      return res.status(400).json({ message: 'mealCode is required' });
    }

    const [summary] = await Review.aggregate([
      { $match: { mealCode: mealCode.trim() } },
      {
        $group: {
          _id: '$mealCode',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
      { $project: { _id: 0, mealCode: '$_id', averageRating: 1, reviewCount: 1 } },
    ]);

    return res.status(200).json({
      summary: summary ?? { mealCode: mealCode.trim(), averageRating: null, reviewCount: 0 },
    });
  } catch (err) { next(err); }
}