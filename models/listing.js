const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const listingSchema = new Schema({

    title: {
        type: String,
        required: true,
    },

    description: {
        type: String,
        required: true,
    },

    image: {
        filename: {
            type: String,
            default: "listingimage",
        },

        url: {
            type: String,
            default: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
        },
    },

    price: {
        type: Number,
        required: true,
        min: 0,
    },

    location: {
        type: String,
        required: true,
    },

    country: {
        type: String,
        required: true,
    },

    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review",
        },
    ],
    owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
},
});

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;