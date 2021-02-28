
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');
// Delete  data (not implementing code only structure)


exports.createOne = Model => catchAsync ( async (req, res, next) => {
    
    // const newId = tours[tours.length - 1].id + 1 ;
    // const newTour = Object.assign({id : newId }, req.body); //merge two object
   
   // tours.push(newTour);
   

   // fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), 
  
   const doc = await Model.create(req.body);
   res.status(201).json({
       status : "success",
       message : "New Document Created Successfully",
       data : {
           data : doc
       }
   });
   
});



exports.getAll = Model => catchAsync (async(req, res, next) => {
    
    // only for getting reveiw of specific tour
    let filter = {};
    // if there is tour id then get all the reviews of that tour otherwise get all the reviews of all tour
    if(req.params.tourId) filter = {tour : req.params.tourId} // check if tour id of parameter and tour id of review is same


    // Execute Query
    const features = new APIFeatures(Model.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
    const doc = await features.query;

    res.status(200).json({
        status : 'success',
        result : doc.length,
        data   : {
            data : doc
        }
    });
});



exports.getOne = (Model, popOption) => catchAsync( async (req, res, next) => {

    let query;
    query = Model.findById(req.params.id);
    if (popOption) query.populate(popOption);

    const doc = await query;

    //For giving error on false Tour ID
    if (!doc) {
        const err = new AppError(`No document found at ID:  ${req.params.id}`, 404);
        return next(err);
    }
    
        
    res.status(200).json({
        status : 'success',
        data   : {
            data : doc
        }
    });   
        
});




exports.updateOne = Model => catchAsync( async(req, res, next) => {

    const doc  = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new : true,
        runValidators :true
    });

    //For giving error on false Tour ID
    if (!doc) {
        const err = new AppError(`No Document found at ID:  ${req.params.id}`, 404);
        return next(err);
    }
    

    res.status(200).json({
        status : 'success',
        data   : {
            data : doc
        }
    });
    

});



exports.deleteOne = Model => catchAsync( async (req, res, next) => {
    
    const doc = await Model.findByIdAndDelete(req.params.id);
    
    //For giving error on false Tour ID
    if (!doc) {
        const err = new AppError(`No Document found at ID:  ${req.params.id}`, 404);
        return next(err);
    }
    
    res.status(200).json({
        status : 'success',
        data   : null
    });
});

