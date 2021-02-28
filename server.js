
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

// handle synchronous code error and it should stay before starting app
process.on('uncaughtException', err => {
    console.error(err);
    process.exit(1); // stop the app

});

const app = require('./app');

// console.log(process.env.NODE_ENV);

const DB= process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

// Database Connection
mongoose.connect(DB, {
    useNewUrlParser : true,
    useCreateIndex : true,
    useFindAndModify : false
}).then(con =>{
    console.log('We connect successfully');
});



const port = process.env.PORT || 3001;
const server = app.listen(port, ()=> {
    console.log(`Listening on Port ${port}`);
});

// handle all asynchronous unhandled rejection

process.on('unhandledRejection', err => {
    server.close(() => { // finish all pending request and close the server
        process.exit(1); // stop the app
    });
});
