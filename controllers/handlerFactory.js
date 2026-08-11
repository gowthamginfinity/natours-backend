const AppError = require('../utils/apiError');
const APIFeatures = require('../utils/apiFeatures');

const deleteOne = (Model) => {
  // Ee logic lo Model anedi dynamic (User/Tour/Review)
  return async (req, res) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) throw new AppError('No document found with that ID', 404);

    // 204 No Content: Industry standard for successful deletion
    res.status(204).json({
      status: 'success',
      data: null,
    });
  };
};

const updateOne = (Model) => {
  return async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) throw new AppError('No document found with that ID', 404);
    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  };
};

const createOne = (Model) => {
  return async (req, res) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        tour: doc,
      },
    });
  };
};

const getone = (Model, popOptions) => {
  return async (req, res) => {
    const query = Model.findById(req.params.id);
    if (popOptions) query.populate(popOptions);
    const doc = await query;

    // const doc = await Model.findById(req.params.id).populate(popOptions);

    if (!doc) throw new AppError('No document found with that ID', 404``);
    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  };
};

const getAll = (Model) => {
  return async (req, res) => {
    let filter = {};

    // 1. Check if it's a Nested Route
    // URL params lo tourId unte, filter object lo 'tour' ID ni add chestham.
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination();
    const docs = await features.query.explain();
    console.log(docs, 'docs');

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        docs,
      },
    });
  };
};

module.exports = { deleteOne, updateOne, createOne, getone, getAll };
