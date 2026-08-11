const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// reviewSchema.pre(/^find/, function () {
//   // 1. Double Populate: Rendu collections ni okate sari link chestunnam
//   this.populate({
//     path: 'tour',
//     select: 'name', // Tour motham akkarledu, just Name unte chalu (Optimization)
//   }).populate({
//     path: 'user',
//     select: 'name photo', // User lo password, email leak avvakunda 'name photo' matrame!
//   });
// });

reviewSchema.pre(/^find/, function () {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  console.log(tourId, 'tttt');
  const stats = await this.aggregate([
    { $match: { tour: tourId } }, // 1. Ee tour ki unna reviews anni filter chey
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 }, // 2. Enni reviews unnayi? (Count)
        avgRating: { $avg: '$rating' }, // 3. Average rating entha?
      },
    },
  ]);
  console.log(stats, ';;;;;');

  // DB update
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    // Okavela reviews anni delete ayithe reset to default
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  console.log(this, 'kkkkk');
  this.constructor.calcAverageRatings(this.tour);
});

// Middleware for Update and Delete
// /^findOneAnd/ matches both findByIdAndUpdate and findByIdAndDelete
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    // doc ante database lo ippude update/delete ayina review document
    // doc.constructor ante 'Review' model
    await doc.constructor.calcAverageRatings(doc.tour);
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
