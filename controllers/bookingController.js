const Tour = require('../models/tourModel');
const AppError = require('../utils/apiError');
const stripe = require('stripe')(process.env.STRIPE_SECRETKEY);
const {
  deleteOne,
  updateOne,
  createOne,
  getone,
  getAll,
} = require('./handlerFactory');
const Booking = require('../models/bookingModel');

const getCheckoutSession = async (req, res, next) => {
  // 1) Get the currently booked tour

  const tour = await Tour.findById(req.params.tourID);

  if (!tour) {
    return next(new AppError('There is no tour found with that ID', 404));
  }

  // 2) Create checkout sessions

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/?tour=${tour.params.tourId}&user=${req.user.id}&price=${tour.price}`, // 🚨 FIX: req.get('host') is safer
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,
    line_items: [
      {
        quantity: 1,
        // 🚨 FIX: Modern Stripe expects price details inside 'price_data'
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100, // 🚨 FIX: Stripe always needs amount in cents! ($1 = 100 cents)
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [
              `https://www.natours.dev/img/tours/${tour.imageCover}.jpg`,
            ],
          },
        },
      },
    ],
  });

  res.status(200).json({
    status: 'success',
    session,
  });
  // 3) Create session as response
};

const createBookingCheckout = async (req, res, next) => {
  // this is only temporary, because it's unsecure: everyone can make bookings without paying.
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);
};

const createBooking = createOne(Booking);
const getBooking = getone(Booking);
const getAllBookings = getAll(Booking);
const updateBooking = updateOne(Booking);
const deleteBooking = deleteOne(Booking);

module.exports = {
  getCheckoutSession,
  createBookingCheckout,
  createBooking,
  getBooking,
  getAllBookings,
  updateBooking,
  deleteBooking,
};
