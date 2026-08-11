const Tour = require('../models/tourModel');
const AppError = require('../utils/apiError');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const getOverview = async (req, res) => {
  // 1.) get tour data from collection
  const tours = await Tour.find();

  // 2.) build template

  // Render that template using tour data from 1
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
};

const getTour = async (req, res) => {
  // 1.) Get the data, for the requested tour (including reviews and guides)
  const tour = await Tour.find({ slug: req.params.tourName }).populate(
    'reviews',
  );
  console.log(tour, 'kkk');
  if (!tour.length) {
    throw new AppError('There is no tour with that name.', 404);
  }
  // 2.) Build template
  res.status(200).render('tour', {
    tour,
  });
};

const getLoginForm = async (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

const getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

const getMyTours = async (req, res) => {
  // 1.) find all bookings

  const bookings = await Booking.find({ user: req.user.id });
  const tourIDs = bookings.map((el) => el.tour);

  // 2.) find tours with retured id's
  const tours = await Tour.find({ _id: { $in: tourIDs } });
  console.log(tours, 'tttttttttttt');
  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
};

const updateUserData = async (req, res) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    },
  );
  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
};

module.exports = {
  getOverview,
  getTour,
  getLoginForm,
  getAccount,
  updateUserData,
  getMyTours,
};
