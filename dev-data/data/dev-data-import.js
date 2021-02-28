
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const fs  = require('fs');

const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

// Read and Parse data
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

dotenv.config({ path: './config.env'});

const DB= process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

// Database Connection
mongoose.connect(DB, {
    useNewUrlParser : true,
    useCreateIndex : true,
    useFindAndModify : false
}).then(con =>{
    console.log('We connect successfully');
});

// Import Data From File

const importData = async () => {
    try{
        await Tour.create(tours, {validateBeforeSave: false});
        await User.create(users, {validateBeforeSave: false});
        await Review.create(reviews);
        console.log('Successfully import Data');
    } catch (err) {
        console.error(err);
        console.log('There is something wrong');
    }
    process.exit();
}

// Delete Data 

const deleteData = async () => {
    try{
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Successfully Delete Data');
    } catch (err) {
        console.error(err);
        console.log('There is something wrong');
    }
    process.exit();
}


if(process.argv[2] === '--import'){
    importData();
}else if(process.argv[2] === '--delete'){
    deleteData();
}

