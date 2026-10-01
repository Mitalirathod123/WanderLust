require("dotenv").config({ path: "../.env" });

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = process.env.MONGO_URL;

async function main() {
    try {
        await mongoose.connect(MONGO_URL, {
            serverSelectionTimeoutMS: 30000,
            family: 4
        });

        console.log("connected to DB");

        await Listing.insertMany(initData.data);

        console.log("data was initialized");

        await mongoose.connection.close();

        console.log("connection closed");
    } catch (err) {
        console.log("ERROR:", err);
    }
}

main();