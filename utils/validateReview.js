const Joi = require("joi");
const ExpressError = require("./ExpressError.js");

const reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number()
            .required()
            .min(1)
            .max(5),

        comment: Joi.string()
            .required()
            .min(3)
            .max(500)
    }).required()
});

const validateReview = (req, res, next) => {

    const { error } =
        reviewSchema.validate(req.body);

    if (error) {

        const message =
            error.details
                .map((el) => el.message)
                .join(", ");

        throw new ExpressError(
            400,
            message
        );
    }

    next();
};

module.exports = validateReview;