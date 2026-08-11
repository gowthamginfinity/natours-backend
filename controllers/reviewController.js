const Review = require('../models/reviewModal');
const {
  deleteOne,
  updateOne,
  createOne,
  getone,
  getAll,
} = require('./handlerFactory');

const setTourUserIds = (req, res, next) => {
  // 1. URL nunchi Tour ID ni grab chey (If not in body)
  if (!req.body.tour) req.body.tour = req.params.tourId;

  // 2. Token nunchi User ID ni grab chey
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

const createReview = createOne(Review);
const deleteReview = deleteOne(Review);
const updateReview = updateOne(Review);
const getReviewById = getone(Review);
const getAllReviews = getAll(Review);

module.exports = {
  createReview,
  getAllReviews,
  getReviewById,
  deleteReview,
  updateReview,
  setTourUserIds,
};
