const Joi = require("joi");

const listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string()
            .required()
            .min(3)
            .max(100),

        description: Joi.string()
            .required()
            .min(10),

        location: Joi.string()
            .required(),

        country: Joi.string()
            .required(),

        price: Joi.number()
            .required()
            .min(0),

        image: Joi.object({
            filename: Joi.string()
                .allow(""),

            url: Joi.string()
                .allow("")
        })
    }).required()
});

module.exports = {
    listingSchema
};