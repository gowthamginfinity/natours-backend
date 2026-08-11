// const Tour = require('../models/tourModel');
// const APIFeatures = require('../utils/apiFeatures');

// const aliasingTopTours = (req, res, next) => {
//   req.query.limit = '5';
//   req.query.sort = '-ratingsAverage,price';
//   req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
//   next();
// };

// const createTour = async (req, res) => {
//   try {
//     const newTour = await Tour.create(req.body);
//     res.status(201).json({
//       status: 'success',
//       data: {
//         tour: newTour,
//       },
//     });
//   } catch (error) {
//     res.status(400).json({
//       status: 'fail',
//       message: error.message,
//     });
//   }
// };

// const getAllTours = async (req, res) => {
//   try {
//     // EXECUTE QUERY
//     const features = new APIFeatures(Tour.find(), req.query)
//       .filter()
//       .sort()
//       .limitFields()
//       .pagination();
//     const tours = await features.query;

//     // SEND RESPONSE
//     res.status(200).json({
//       status: 'success',
//       results: tours.length,
//       data: {
//         tours,
//       },
//     });
//   } catch (error) {
//     res.status(404).json({
//       status: 'fail',
//       message: error.message,
//     });
//   }
// };

// // const getAllTours = async (req, res) => {
// //     try {
// //         // 1) Filtering
// //         const queryObj = { ...req.query };
// //         const excludedFields = ['page', 'sort', 'limit', 'fields'];
// //         excludedFields.forEach((item) => delete queryObj[item]);

// //         // 2) Advanced Filtering
// //         let queryStr = JSON.stringify(queryObj);
// //         queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
// //         let query = Tour.find(JSON.parse(queryStr));

// //         // 3.) Sorting
// //         if (req.query.sort) {
// //             const sortBy = req.query.sort.split(',').join(' ');
// //             query = query.sort(sortBy)
// //         } else query = query.sort('-createdAt');

// //         // 4.) Field Limiting
// //         if (req.query.fields) {
// //             const fields = req.query.fields.split(',').join(' ');
// //             query = query.select(fields);
// //         } else query = query.select('-__v');

// //         // 5.) Pagination
// //         if (req.query.page || req.query.limit) {
// //             const page = req.query.page * 1 || 1;
// //             const limit = req.query.limit * 1 || 100;
// //             const skip = (page - 1) * limit;
// //             const numTours = await Tour.countDocuments();
// //             if (skip >= numTours) throw new Error('This page does not exist');
// //             query = query.skip(skip).limit(limit);
// //         }

// //         // EXECUTE QUERY
// //         const tours = await query;

// //         // SEND RESPONSE
// //         res.status(200).json({
// //             status: 'success',
// //             results: tours.length,
// //             data: {
// //                 tours
// //             }
// //         });
// //     } catch (error) {
// //         res.status(404).json({
// //             status: 'fail',
// //             message: error.message
// //         });
// //     }
// // }

// const getTourById = async (req, res) => {
//   try {
//     const tour = await Tour.findById(req.params.id);
//     // Tour.findOne({ _id: req.params.id });
//     res.status(200).json({
//       status: 'success',
//       data: {
//         tour,
//       },
//     });
//   } catch (error) {
//     res.status(404).json({
//       status: 'fails',
//       message: error.message,
//     });
//   }
// };

// const updateTour = async (req, res) => {
//   try {
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true,
//     });
//     res.status(200).json({
//       status: 'success',
//       data: {
//         tour,
//       },
//     });
//   } catch (error) {
//     res.status(400).json({
//       status: 'fail',
//       data: error.message,
//     });
//   }
// };

// const deleteTour = async (req, res) => {
//   try {
//     const deletedTour = await Tour.findByIdAndDelete(req.params.id);
//     res.status(204).json({
//       status: 'success',
//       data: {
//         deletedTour,
//       },
//     });
//   } catch (error) {
//     res.status(400).json({
//       status: 'fail',
//       data: error.message,
//     });
//   }
// };

// const getTourStats = async (req, res) => {
//   try {
//     const stats = await Tour.aggregate([
//       {
//         $match: { ratingsAverage: { $gte: 4.5 } },
//       },
//       {
//         $group: {
//           _id: { $toUpper: '$difficulty' },
//           numTours: {
//             $sum: 1,
//           },
//           numRating: {
//             $sum: '$ratingsQuantity',
//           },
//           avgRating: {
//             $avg: '$ratingsAverage',
//           },
//           avgPrice: {
//             $avg: '$price',
//           },
//           minPrice: {
//             $min: '$price',
//           },
//           maxPrice: {
//             $max: '$price',
//           },
//         },
//       },
//       {
//         $sort: { avgPrice: 1 }, // we have to use the field name which we have created in group stage to sort the data. and 1 is for ascending and -1 is for descending
//       },
//       {
//         $match: { _id: { $ne: 'EASY' } }, // here _id is difficulty because we have grouped the data by difficulty and we are excluding the easy difficulty tours from the result
//       },
//     ]);
//     res.status(200).json({
//       status: 'success',
//       data: {
//         stats,
//       },
//     });
//   } catch (error) {
//     res.status(404).json({
//       status: 'fails',
//       message: error.message,
//     });
//   }
// };

// const getMonthlyPlan = async (req, res) => {
//   try {
//     const year = req.params.year * 1; // 2021
//     const plan = await Tour.aggregate([
//       { $unwind: '$startDates' },
//       {
//         $match: {
//           startDates: {
//             $gte: new Date(`${year}-01-01`),
//             $lte: new Date(`${year}-12-31`),
//           },
//         },
//       },
//       {
//         $group: {
//           _id: { $month: '$startDates' },
//           numTourStarts: { $sum: 1 },
//           tours: { $push: '$name' },
//         },
//       },
//       {
//         $addFields: { month: '$_id' },
//       },
//       {
//         $project: { _id: 0 },
//       },
//       {
//         $sort: { numTourStarts: -1 },
//       },
//       {
//         $limit: 6,
//       },
//     ]);
//     res.status(200).json({
//       status: 'success',
//       data: {
//         plan,
//       },
//     });
//   } catch (error) {
//     res.status(404).json({
//       status: 'fails',
//       message: error.message,
//     });
//   }
// };

// module.exports = {
//   getAllTours,
//   getTourById,
//   createTour,
//   updateTour,
//   deleteTour,
//   aliasingTopTours,
//   getTourStats,
//   getMonthlyPlan,
// };
const Tour = require('../models/tourModel');
const AppError = require('../utils/apiError');
const multer = require('multer');
const sharp = require('sharp');
const {
  deleteOne,
  updateOne,
  createOne,
  getone,
  getAll,
} = require('./handlerFactory');

const multerStorage = multer.memoryStorage(); // 🚨 2026 Pro Add-on: Using memory storage for image processing

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// 3. Orchestrating core configurations rules together
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 🚨 2026 Pro Add-on: Limiting single file sizes max 5MB safely
});

// const uploadTourImages = upload.single('image');  => req.file
// const uploadTourImages = upload.array('images', 5); => req.files

const uploadTourImages = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 3,
  },
]);

const resizeTourImages = async (req, res, next) => {
  console.log(req.files, 'req.files');
  if (!req.files.imageCover || !req.files.images) return next();

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  req.body.images = [];
  Promise.all(
    req.files.images.forEach(async (files, index) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;
      await sharp(files.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    }),
  );
  next();
};

const aliasingTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

const createTour = createOne(Tour);
const updateTour = updateOne(Tour);
const deleteTour = deleteOne(Tour);
const getTourById = getone(Tour, { path: 'reviews' });
const getAllTours = getAll(Tour);

// tours-within/233/center/34.053587,-118.242925/unit/mi
const getToursWithin = async (req, res) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    throw new AppError(
      'Please provide latitute and longitude in the format lat,lng.',
      400,
    );
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
      distance,
      latlng,
      unit,
    },
  });
};

const getDistances = async (req, res) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    throw new AppError(
      'Please provide latitute and longitude in the format lat,lng.',
      400,
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
        spherical: true,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    // results: tours.length,
    data: {
      distances,
    },
  });
};

// const getAllTours = async (req, res) => {
//     try {
//         // 1) Filtering
//         const queryObj = { ...req.query };
//         const excludedFields = ['page', 'sort', 'limit', 'fields'];
//         excludedFields.forEach((item) => delete queryObj[item]);

//         // 2) Advanced Filtering
//         let queryStr = JSON.stringify(queryObj);
//         queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
//         let query = Tour.find(JSON.parse(queryStr));

//         // 3.) Sorting
//         if (req.query.sort) {
//             const sortBy = req.query.sort.split(',').join(' ');
//             query = query.sort(sortBy)
//         } else query = query.sort('-createdAt');

//         // 4.) Field Limiting
//         if (req.query.fields) {
//             const fields = req.query.fields.split(',').join(' ');
//             query = query.select(fields);
//         } else query = query.select('-__v');

//         // 5.) Pagination
//         if (req.query.page || req.query.limit) {
//             const page = req.query.page * 1 || 1;
//             const limit = req.query.limit * 1 || 100;
//             const skip = (page - 1) * limit;
//             const numTours = await Tour.countDocuments();
//             if (skip >= numTours) throw new Error('This page does not exist');
//             query = query.skip(skip).limit(limit);
//         }

//         // EXECUTE QUERY
//         const tours = await query;

//         // SEND RESPONSE
//         res.status(200).json({
//             status: 'success',
//             results: tours.length,
//             data: {
//                 tours
//             }
//         });
//     } catch (error) {
//         res.status(404).json({
//             status: 'fail',
//             message: error.message
//         });
//     }
// }

const getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: { $toUpper: '$difficulty' },
          numTours: {
            $sum: 1,
          },
          numRating: {
            $sum: '$ratingsQuantity',
          },
          avgRating: {
            $avg: '$ratingsAverage',
          },
          avgPrice: {
            $avg: '$price',
          },
          minPrice: {
            $min: '$price',
          },
          maxPrice: {
            $max: '$price',
          },
        },
      },
      {
        $sort: { avgPrice: 1 }, // we have to use the field name which we have created in group stage to sort the data. and 1 is for ascending and -1 is for descending
      },
      {
        $match: { _id: { $ne: 'EASY' } }, // here _id is difficulty because we have grouped the data by difficulty and we are excluding the easy difficulty tours from the result
      },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fails',
      message: error.message,
    });
  }
};

const getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1; // 2021
    const plan = await Tour.aggregate([
      { $unwind: '$startDates' },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: { _id: 0 },
      },
      {
        $sort: { numTourStarts: -1 },
      },
      {
        $limit: 6,
      },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fails',
      message: error.message,
    });
  }
};

module.exports = {
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
  resizeTourImages,
  uploadTourImages,
};
