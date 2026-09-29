const ExpressError = require("./ExpressError.js");

const isLoggedIn = (req, res, next) => {

    if (!req.session.userId) {
        throw new ExpressError(401, "You must be logged in to continue");
    }

    next();
};

module.exports = isLoggedIn;