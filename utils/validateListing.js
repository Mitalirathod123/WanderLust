const { listingSchema } = require("../schema.js");
const ExpressError = require("./ExpressError.js");

const validateListing = (req, res, next) => {

    const { error } = listingSchema.validate(req.body);

    if (error) {

        const message = error.details
            .map((el) => el.message)
            .join(", ");

        throw new ExpressError(400, message);
    }

    next();
};

module.exports = validateListing;