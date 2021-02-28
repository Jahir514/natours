const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const AppError = require('../utils/appError');
//const fs  = require('fs');
const Tour = require('./../models/tourModel');

// import catchAsync
const catchAsync = require('./../utils/catchAsync');

const factory = require('./handleFactory');


// Read and Parse data
//const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, 'utf-8'));

// get all data
exports.getAllTours = factory.getAll(Tour);
// Post data or create tour
exports.createTours = factory.createOne(Tour);
// get specific data
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
// Update  data 
exports.updateTours = factory.updateOne(Tour);
// Delete  data 
exports.deleteTours = factory.deleteOne(Tour);


// Tour Statistics Start
exports.getTourStats = catchAsync( async(req, res, next) => {
    
    const stats = await Tour.aggregate([  // aggregate method return a object
        {
            $match: {ratingAverage: {$gte: 4 }} // get all the tours ratingAverage is grater than 4; in match we have to use document key
        },
        {
            $group: {    // On the matching data perform the following operation 
                _id: '$difficulty', // its not for id but for specific field on which we can group documents ex: difficulty
                numTours : { $sum: 1}, // add 1 for each document
                numRatings : {$sum : '$ratingQuantity'},
                avgRating : { $avg: '$ratingAverage'},
                avgPrice : { $avg: '$price'},
                maxPrice : { $max: '$price'},
                minPrice : { $min: '$price'}
            }
            
        }
    ]);

    res.status(200).json({
        status: "success",
        message: "Successful Operation",
        data : {stats}
    });
    
})

//Tour Statistics End


//Busiest Month start
exports.getMonthlyPlan = catchAsync( async (req, res, next) => {
   
    const year = req.params.year * 1;
    
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates' //separate array item and add it with its main document
        },
        {
            $match: {
                startDates:{ //in match we have to use document key
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                } 
            }
        },
        {
            $group : {
                _id: { $month: '$startDates'}, // $month extract month from date as number
                numberOfTours: { $sum: 1},
                tourNames : { $push: '$name'}

            }
        },
        {
            $sort : {
                numberOfTours: -1 // 1 for assending and -1 for desending
            }
        },
        {
            $addFields: {
                month: '$_id' // add new field in group stage
            }
        },
        {
            $project : {
                _id : 0 // for show or not show a field in group; 0 for not show and 1 for show
            }
        },
        {
            // $limit : 10 //for limit the number of documents
        }
        ]);

        res.status(200).json({
        status: "success",
        message: "Successful Monthly Plan",
        result : plan.length,
        data : {plan}
    });

    
     
})

//Busiest Month End


//getting tour in a certain range
exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlan, unit } = req.params;
    const [ lat, lan ] = latlan.split(',');

    const radius = (unit === 'mi') ? distance / 3963.2 : distance / 6378.1; // convert unit mile or kilometer to radians by dividing earth radius 

    if (!lat || !lan) {
        next(new AppError('Please provide laditute and langitude in the form lat,lan', 400));
    }

    const tours = await Tour.find({
        startLocation: { $geoWithin: { $centerSphere: [[lan, lat], radius] } }
        
    });


    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours
        }
    });
});

//get the distance of tours from a certain point
exports.getDistance = catchAsync(async (req, res, next) => {
    const { latlan, unit } = req.params;
    const [ lat, lan ] = latlan.split(',');
    
    const multiplier = (unit === 'mi') ? 0.000621371 : 0.001; // to convert meter into miles or kilometers

    if (!lat || !lan) {
        next(new AppError('Please provide laditute and langitude in the form lat,lan', 400));
    }

    const distance = await Tour.aggregate([
        {
            $geoNear: { // this must be the first stage and it require a geo index
                near: {
                    type: 'Point',
                    coordinates: [lan * 1, lat * 1],                   
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);


    res.status(200).json({
        status: 'success',
        data: {
            distance
        }
    });
});



/*********************************
*** upload tour cover image and other images
*********************/
// multer storage in memory
const multerStorage = multer.memoryStorage();

// multer filter to check it is an image
const multerFilter = (req, file, cb) => {
    if(file.mimetype.startsWith('image')){
        cb(null, true);
    } else{
        cb(new AppError('Its not an image! Please upload only image', 400), false);
    }
};

//multer config
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

// upload.single('photo') ; for single file upload and it creates req.file
// upload.array('photo', 5) ; for multiple file upload and it creates req.files
// upload.fields([objects]) ; for single and multiple file upload and it creates req.files


//multer middleware
exports.uploadTourPhoto = upload.fields([
    {name: 'imageCover', maxCount: 1},
    {name: 'images', maxCount: 3}
]);

exports.resizeTourPhoto = catchAsync(async(req, res, next) => {
    if(!req.files.imageCover || !req.files.images){
        return next();
    }
    
    // 1) image cover
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

    await sharp(req.files.imageCover[0].buffer) // to access the file from memory
        .resize(2000, 1333) 
        .toFormat('jpeg')
        .jpeg({quality: 90})
        .toFile(`public/img/tours/${req.body.imageCover}`);


    // 2) other images
    req.body.images = [];
  await Promise.all(
       req.files.images.map(async(file, i) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

         await sharp(req.files.images[i].buffer) // to access the file from memory
            .resize(2000, 1333) 
            .toFormat('jpeg')
            .jpeg({quality: 90})
            .toFile(`public/img/tours/${filename}`);

        req.body.images.push(filename);
    }));
    next();
});