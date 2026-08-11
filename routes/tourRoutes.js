const express = require('express');
const tourRouter = express.Router();
const {
  getAllTours,
  getTourById,
  createTour,
  updateTour,
  deleteTour,
  aliasingTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages,
} = require('../controllers/tourController');
const { protect, restrictTo } = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

// tourRouter.param('id', checkID);
tourRouter.route('/top-5-cheap').get(aliasingTopTours, getAllTours);
tourRouter.route('/tour-stats').get(getTourStats);
tourRouter
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

tourRouter
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);
// tours-distance?distance=233&center=-40,45&unit=mi
// tours-distance/233/center/-40,45/unit/mi

tourRouter.route('/distances/:latlng/unit/:unit').get(getDistances);

tourRouter
  .route('/')
  .get(getAllTours) // for every one
  .post(protect, restrictTo('admin', 'lead-guide'), createTour);

tourRouter
  .route('/:id')
  .get(getTourById)
  .patch(
    protect,
    restrictTo('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    updateTour,
  )
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

// POST /tour/234fad4/reviews
// GET /tour/234fad4/reviews
// GET /tour/234fad4/reviews/9083u4h

// tourRouter
//   .route('/:tourId/reviews')
//   .post(protect, restrictTo('user'), createReview);

tourRouter.use('/:tourId/reviews', reviewRouter);

module.exports = tourRouter;
