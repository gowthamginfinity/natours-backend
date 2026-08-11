const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('node:dns');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModal');

dns.setServers(['8.8.8.8', '1.1.1.1']);

// ✅ FIXED PATH
dotenv.config({ path: `${__dirname}/../../config.env` });

mongoose
  .connect(process.env.DATABASE)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

const tours = fs.readFileSync(`${__dirname}/tours.json`);
const users = fs.readFileSync(`${__dirname}/users.json`);
const reviews = fs.readFileSync(`${__dirname}/reviews.json`);

const importData = async () => {
  try {
    await Tour.create(JSON.parse(tours));
    await User.create(JSON.parse(users), { validateBeforeSave: false });
    await Review.create(JSON.parse(reviews));
    console.log('Data successfully loaded');
    process.exit();
  } catch (error) {
    console.error('Error importing data:', error);
  }
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    process.exit();
    console.log('Data successfully deleted');
  } catch (error) {
    console.error('Error deleting data:', error);
  }
};

console.log(process.argv);

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
