module.exports = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch( err => next(err))// i can also write next(err) as short form
    }
};