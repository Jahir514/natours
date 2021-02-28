const path = require('path');
// Using express module
const express = require('express');
//using Rate limit package
const rateLimit = require('express-rate-limit');
//using helmet package
const helmet = require('helmet');

const expressMongo = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');


// Importing Routers
const tourRouter = require('./routes/tourRoute');
const userRouter = require('./routes/userRoute');
const reviewRouter = require('./routes/reviewRoute');
const viewRouter = require('./routes/viewRoute');

// Importing ErrorHandlers

const appError = require('./utils/appError');
const globalErrorController = require('./controllers/errController');

// using morgan module
const morgan = require('morgan');

const app = express(); // Create Express application

// views engine and directory setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));


/*********
 * ALL Middlewares
 */

// Serving static file
app.use(express.static(path.join(__dirname, 'public')));

// set HTTP header security
app.use(helmet());

app.use(morgan('dev'));


// middleware to limit request number

const limiter = rateLimit({ // this method work as a middleware
    max: 200,
    windowMs: 60 * 60 * 1000, // hour in milisecond
    message: 'You send too many request! please try again in one hour'
});

app.use('/api', limiter); // works for all route that starts with /api

// middleware to reading data from body as req.body
app.use(express.json({ limit: '30kb' })); // body limit 30kb
// middleware to parse data from cookie
app.use(cookieParser());

// protect from Nosql query injection
app.use(expressMongo());

// protect from XSS(cross site scripting)
app.use(xss());

// prevent parameter pollution
app.use(hpp({ // for duplicate field value like 'sort' take only last one except these whitelist fields
    whitelist: [
        'duration',
        'ratingAverage',
        'ratingQuantity',
        'maxGroupSize',
        'difficulty',
        'price'
    ]
}));


app.use(compression());

// Create Own middleware
app.use((req, res, next) => {
    //console.log('New Middleware used');
    //console.log(req.cookies);
    //console.log(req.headers.authorization);
    next();
});


// Router Mounting
app.use('/', viewRouter);
app.use('/api/v1/tours',tourRouter); // using tour Router on this route
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);


// if the route is wrong then send custom message and it must place at last of all middleware
app.all('*', (req, res, next) => {
    // res.status(404).json({
    //     status: 'Fail',
    //     message: `Route ${req.originalUrl} not found`
    // });
    const err = new appError(`Route ${req.originalUrl} not found`, 404);
    
    next(err);

});

app.use(globalErrorController);

module.exports = app;


