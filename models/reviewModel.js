const mongoose = require('mongoose');
const Tour = require('./tourModel');


const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review must have a content']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour: [ // tour references
        {
            type: mongoose.Schema.ObjectId,
            ref:'Tour',
            required: [true, 'Review must belong to a Tour']
        }
    ],
    user: [ //  user references
        {
            type: mongoose.Schema.ObjectId,
            ref:'User',
            required: [true, 'Review must belong to a User']
        }
    ]
},
{ // option for schema start
    toJSON: {virtuals: true}, 
    toObject: {virtuals: true}
}
);

// static method to calculate averge of review of a specific tour
reviewSchema.statics.calcAverage = async function (tourId) { //static methods belongs to a model. so it has to call using model
    
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id:  '$tour',
                ratingsNo: { $sum: 1 },
                avgRatings: { $avg: '$ratings' }
            }
        }
    ]);
    //console.log(stats);
    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingQuantity: stats[0].ratingsNo,
            ratingAverage: stats[0].avgRatings
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingQuantity: 0,
            ratingAverage: 4.5
        });
   }
   
};


// reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

//use a document middleware to  call calcAverage method after each review save
reviewSchema.post('save', function () {
    this.constructor.calcAverage(this.tour); // this.constructor indicates the review model

});


// update tour when a review is updated

//1) catch the review document because findbyIdAndUpdate and findByIdAndDelete doesnt have access to document middleware
reviewSchema.pre(/^findOneAnd/, async function (next) {
    
    this.review = await this.findOne(); // here this indicates current query because its a query middleare
    //console.log(this.review);
    next();
});


reviewSchema.post(/^findOneAnd/, async function () {
    this.review.constructor.calcAverage(this.review.tour);
});



// use a query middleware to use populate method
reviewSchema.pre(/^find/, function (next) {
   // multiple field populate
    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // }).populate({
    //     path: 'user',
    //     select: 'name photo'
    // })

    this.populate({
            path: 'user',
            select: 'name photo'
        })
    
    next();
});


const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

