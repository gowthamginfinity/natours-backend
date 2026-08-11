/* eslint-disable no-undef */
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/apiError');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const { xss } = require('express-xss-sanitizer');
const viewRouter = require('./routes/viewRoutes');
const bookingsRouter = require('./routes/bookingRoutes');
const cookieParser = require('cookie-parser');

const app = express();

// 1. Tell Express we are using Pug as the Template Engine
app.set('view engine', 'pug');

// 2. Set the absolute path to the views folder
app.set('views', path.join(__dirname, 'views'));

// 3. Serve static files (CSS, JS, Images) from the public folder
app.use(express.static(path.join(__dirname, 'public')));

app.set('query parser', 'extended');
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          'https://api.mapbox.com',
          'https://events.mapbox.com',
          'https://cdnjs.cloudflare.com',
        ],
        styleSrc: [
          "'self'",
          'https://api.mapbox.com',
          'https://fonts.googleapis.com',
          "'unsafe-inline'",
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://*.mapbox.com'],
        workerSrc: ["'self'", 'blob:'],
        connectSrc: [
          "'self'",
          'https://api.mapbox.com',
          'https://events.mapbox.com',
          'https://*.tiles.mapbox.com',
          ...(process.env.NODE_ENV === 'development'
            ? ['ws://localhost:1234']
            : []),
        ],
      },
    },
  }),
);

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const globalErrorHandler = require('./controllers/errorController');
const reviewRouter = require('./routes/reviewRoutes');

// app.use(express.static(`${__dirname}/public`));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '10kb' })); // this is middleware mainly for post because we are sending the data in json to server
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Idi req.body, req.query, req.params lo ekkada '$' leda '.' kanipinchina,
// vaatini ventane tholagistundi (removes them).
// Appudu {"$gt": ""} kastha {"gt": ""} laaga maripoyi, Mongoose attack ni fail chestundi.
// app.use(mongoSanitize());
// Express 5 compatible Sanitizer
app.use((req, res, next) => {
  // express-mongo-sanitize lopal unna sanitize function ni direct ga pilustunnam
  // Idi data ni clean chestundi kani 'req.query' ni direct ga overwrite cheyadu
  req.body = mongoSanitize.sanitize(req.body);
  req.params = mongoSanitize.sanitize(req.params);

  // req.query is read-only in Express 5, so we clean its content
  if (req.query) {
    const sanitizedQuery = mongoSanitize.sanitize(req.query);
    // Object.assign vadithe 'req.query' property maradu, lopal unna contents matrame clean avthayi
    Object.assign(req.query, sanitizedQuery);
  }

  next();
});

// Manual loops emi lekunda, direct global middleware!
// Idi body, query, params annitini deep ga vethiki <script> tags ni lepesthundi.
app.use(xss());

app.use((req, res, next) => {
  next();
});

const limiter = rateLimit({
  max: 100, // Max number of requests from same IP in same time window
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour!',
});

app.use('/api', limiter);

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingsRouter);

// 2. UNHANDLED ROUTES (Idi next(error) dwara error ni throw chestundi)
app.all(/.*/, (req, res, next) => {
  // Kotha Error object srustinchi, next() lopaliki pampistunnam.
  // Express idhi chusi, normal middlewares ni skip chesi, direct ga Global Error Handler ki veltundi.
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 3. GLOBAL ERROR HANDLER (App lo eppudu idhe Last Middleware ga undali)
app.use(globalErrorHandler);

module.exports = app;
