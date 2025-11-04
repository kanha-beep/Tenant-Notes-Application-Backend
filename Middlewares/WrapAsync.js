const WrapAsync = (func) => {
    return function (req, res, next) {
        func(req, res, next).catch((e) => next(e))
    }
}
export default WrapAsync;