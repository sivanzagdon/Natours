const path = require('path');
const express = require('express');
const cors = require('cors');
const AppError = require('./utils/appError');
const fs = require('fs');
const morgan = require('morgan');

//השימוש בתוכנת הביניים `hpp` הוא שיטת אבטחה חשובה כדי להגן על אפליקציית ה-Express שלך מפני התקפות זיהום פרמטרי HTTP, והיא בעלת ערך במיוחד בעת התמודדות עם קלט משתמש ומחרוזות שאילתות.
const hpp = require('hpp');

//תרגול אבטחה חיוני להגנה על יישום האינטרנט שלך מפני התקפות XSS על ידי חיטוי אוטומטי של נתוני קלט המשתמש ומניעת ביצוע סקריפטים זדוניים.
const xss = require('xss-clean');

//המסייעת בהגנה מפני התקפות MongoDB Injection על ידי חיטוי נתונים שסופקו על ידי המשתמש.
const mongoSanitize = require('express-mongo-sanitize');

//אבטחת האפליקציה שלך על ידי הפחתת פגיעויות אינטרנט ידועות מסוימות.
//כותרות אלו מסייעות להגן על האפליקציה שלך מפני התקפות כגון סקריפטים חוצי אתרים (XSS), חטיפת קליקים, הפרות של מדיניות אבטחת תוכן (CSP) ועוד.
const helmet = require('helmet');

//שימושית להגבלת מספר הבקשות שלקוח יכול לשלוח לשרת שלך בתוך מסגרת זמן מסוימת.
//כדי להגן על השרת שלך מפני שימוש לרעה, דואר זבל או תעבורה לא רצויה אחרת על ידי הגבלת קצב הבקשות הנכנסות.
const rateLimit = require('express-rate-limit');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const globalErrorHandler = require('./controllers/errorController');

const cookieParser = require('cookie-parser');

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); // This is where your Pug templates are located.

// 1) GLOBAL MIDDLEWARES
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());



if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);


app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.cookies);


// if (req.cookies['username-localhost-8888']) {
//   console.log('user connected');
// } else if (!req.cookies['username-localhost-8888']) {
//   console.log('user not connected');
// }

  next();
});


app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);



module.exports = app;
