
//Handle Cast Error
const appError = require('./../utils/appError');

// change the mongoose castError message into user readale message
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new appError(message, 400);
}

// change the mongoose duplicate name error message into user readable message
const handleDuplicateNameDB = (err) => {
    const message = `Duplicate Field value name = '${err.keyValue.name}'. Please change it!!`;
    return new appError(message, 400);
}

// change the Jwt invalid token error message into user readable message
const handleJwtError = (err) => {
    const message = `Invalid Token!!  Please give correct token!!`;
    return new appError(message, 401);
}

// change the Jwt token Expiration error message into user readable message
const handleTokenExpirationError = (err) => {
    const message = `${err.message}!! Your Token has been expired!! Please again log in...`;
    return new appError(message, 401);
}


// Error Handle at Development Phase
const devErrorProcess = (err, req, res) => {
    // in API error
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
    
        });
    }
    // In rendered site
    return res.status(err.statusCode).render('error', {
        title: 'Something goes wrong!',
        message: err.message
    });
};


// Error handle at production phase
const prodErrorProcess = (err, req, res) => {
    // handle error that is caused by user or database fail error
    
    if (req.originalUrl.startsWith('/api')) {
        //API
        if (err.isOperational) {

            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
    
            // handle error that is caused at program
        }
        // console show unkonwn Error
        console.error(`Error`, err);
        //console.log(err.name);
        // send error message
        return res.status(500).json({
            status: 'Error',
            message: 'There is a critical Error'
        
        });
        

    } else {
        //Render website
        if (err.isOperational) {

            return res.status(err.statusCode).render('error', {
                title: 'Something goes wrong!',
                message: err.message
            });
        }
        // console show unkonwn Error
        console.error(`Error`, err);
        //console.log(err.name);
        // send error message
        res.status(500).render('error', {
            title: 'Something goes wrong!',
            message: 'There is a critical Error! Please try again later!'
        
        });
        
    }
    


   
};


// global error controller method
module.exports = (err, req, res, next) => {
    
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'Error';

    if (process.env.NODE_ENV === 'development') {

        devErrorProcess(err, req, res);

    } else if (process.env.NODE_ENV === 'production') {
       
        let error = { ...err };
        error.message = err.message;
        
        if (error.kind === 'ObjectId') error = handleCastErrorDB(error);

        if (error.code === 11000) error = handleDuplicateNameDB(error);

        if (error.name === 'JsonWebTokenError') error = handleJwtError(error);

        if (error.name === 'TokenExpiredError') error = handleTokenExpirationError(error);

        prodErrorProcess(error, req, res);
        
    }
}