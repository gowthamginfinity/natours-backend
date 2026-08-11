const { protect, restrictTo } = require('../controllers/authController');
const express = require('express');
const {
  getCheckoutSession,
  getAllBookings,
  createBooking,
  getBooking,
  updateBooking,
  deleteBooking,
} = require('../controllers/bookingController');
const bookingRouter = express.Router();

bookingRouter.use(protect);
bookingRouter.get('/checkout-session/:tourID', getCheckoutSession);
bookingRouter.use(restrictTo('admin', 'lead-guide'));
bookingRouter.route('/').get(getAllBookings).post(createBooking);
bookingRouter
  .route('/:id')
  .get(getBooking)
  .patch(updateBooking)
  .delete(deleteBooking);

module.exports = bookingRouter;
