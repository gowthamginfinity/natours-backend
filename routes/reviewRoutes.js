const {
  createReview,
  getAllReviews,
  getReviewById,
  deleteReview,
  updateReview,
  setTourUserIds,
} = require('../controllers/reviewController');
const { protect, restrictTo } = require('../controllers/authController');
const express = require('express');
const reviewRouter = express.Router({ mergeParams: true });

reviewRouter.use(protect);
reviewRouter
  .route('/')
  .get(getAllReviews)
  .post(restrictTo('user'), setTourUserIds, createReview);
reviewRouter
  .route('/:id')
  .get(getReviewById)
  .delete(restrictTo('user', 'admin'), deleteReview)
  .patch(restrictTo('user', 'admin'), updateReview);

module.exports = reviewRouter;
