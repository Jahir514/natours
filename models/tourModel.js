const mongoose = require('mongoose');

// Schema for Documents



const tourSchema  = new mongoose.Schema({
    name : {
        type : String,
        required : [true, 'A tour must have a name'],
        unique : true,
        trim : true
    },
    duration : {
        type : Number,
        required : [true, 'A Tour Must have a Duration']
    },
    maxGroupSize : {
        type : Number,
        required : [true, 'A Tour Must have a Group Size']
    },
    difficulty : {
        type : String,
        required: [true, 'A Tour Must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'hard'],
            message:'Difficulty is either: easy, medium, hard'
        }
    },
    slug: String,
    price : {
        type : Number,
        required : [true, 'A tour must have a price']
    },
    ratingsAverage : {
        type : Number,
        default: 4.5,
        set: val => Math.round(val * 10)/ 10  // val = 4.66667 * 10 = 46.6667 = 47/10 = 4.7
        
    },
    ratingsQuantity : {
        type : Number,
        default : 0
    },
    priceDiscount : Number,
    summary : {
        type : String,
        trim : true,
        required : [true, 'A tour must have a summary']
    },
    description : {
        type : String,
        trim : true
    },
    imageCover : {
        type : String,
        trim : true,
        required : [true, 'A tour must have a imageCover']
    },
    images : [String],
    createdAt : {
        type : Date,
        default : Date.now()
    },
    startDates: [Date],
    startLocation: {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']  // possible polygons, lines
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [ // embedded location to tour
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point'] // only Point no other possibility
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number // starting day of tour
        }
    ],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref:'User'
        }
    ]
},//Schema main definition end
{ // option for schema start
    toJSON: {virtuals: true}, //when we output data as JSON then add virtual property that define below
    toObject: {virtuals: true} //when we output data as Object then add virtual property that define below
});



// indexing the fields for better reading
tourSchema.index({ startLocation: '2dsphere' }); // geoSpecial index
tourSchema.index({ price: 1, ratingAverage: -1 });
tourSchema.index({ slug: 1 });




// virtual property declaration; we cant use virtual property for query cause its doesnt exist on database
tourSchema.virtual('durationWeek').get(function () { // we cant use arrow function here because we need to use this keyword
    return this.duration / 7;
});

// create virtual field reviews 
tourSchema.virtual('reviews', { 
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v -changedPasswordAt'
    }) 
    
    next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;