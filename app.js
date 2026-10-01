require("dotenv").config();

const express = require("express");
const app = express();
app.set("trust proxy", 1);
const cors = require("cors");

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://wander-lust-seven-beige.vercel.app"
        ],
        credentials: true,
    })
);

const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const User = require("./models/user.js");
const bcrypt = require("bcrypt");

const path = require("path");
const methodOverride = require("method-override");
const session = require("express-session");
const ejsMate = require("ejs-mate");

const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const validateListing = require("./utils/validateListing.js");
const isLoggedIn = require("./utils/isLoggedIn.js");
const validateReview = require("./utils/validateReview.js");

const MONGO_URL = process.env.MONGO_URL;


// ================= DATABASE CONNECTION =================

main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
   await mongoose.connect(MONGO_URL, {
    family: 4
});
}


// ================= APP CONFIGURATION =================

app.set("view engine", "ejs");

app.set(
    "views",
    path.join(__dirname, "views")
);

app.engine("ejs", ejsMate);


// ================= MIDDLEWARE =================

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: true,
            httpOnly: true,
            sameSite: "none",
        },
    })
);

// Make logged-in user available to all EJS files

app.use(async (req, res, next) => {

    if (req.session.userId) {

        const user =
            await User.findById(req.session.userId);

        res.locals.currentUser = user;

    } else {

        res.locals.currentUser = null;

    }

    next();

});

app.use(methodOverride("_method"));

app.use(
    express.static(path.join(__dirname, "public"))
);


// ================= ROOT ROUTE =================

app.get("/", (req, res) => {
    res.send("Hi, I am root");
});
app.get(
    "/api/current-user",
    wrapAsync(async (req, res) => {

        // User is not logged in
        if (!req.session.userId) {
            return res.json({
                user: null
            });
        }

        // Find logged-in user
        const user = await User.findById(
            req.session.userId
        );

        // Session exists but user was deleted
        if (!user) {
            return res.json({
                user: null
            });
        }

        // Send user information to React
        res.json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    })
);

app.post(
    "/api/listings",
    isLoggedIn,
    validateListing,
    wrapAsync(async (req, res) => {

        const { listing } = req.body;

        const newListing = new Listing(listing);

        newListing.owner = req.session.userId;

        await newListing.save();

        res.status(201).json(newListing);
    })
);
app.get("/api/listings/:id", wrapAsync(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ExpressError(400, "Invalid listing ID");
    }

    const listing = await Listing.findById(id);

    if (!listing) {
        throw new ExpressError(404, "Listing not found");
    }

    res.json(listing);
}));
app.put(
    "/api/listings/:id",
    isLoggedIn,
    validateListing,
    wrapAsync(async (req, res) => {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ExpressError(
                400,
                "Invalid listing ID"
            );
        }

        const listing = await Listing.findById(id);

        if (!listing) {
            throw new ExpressError(
                404,
                "Listing not found"
            );
        }

        // Check that the logged-in user owns this listing
        if (
            !listing.owner ||
            !listing.owner.equals(req.session.userId)
        ) {
            throw new ExpressError(
                403,
                "You are not authorized to edit this listing"
            );
        }

        const { listing: listingData } = req.body;

        const updatedListing =
            await Listing.findByIdAndUpdate(
                id,
                listingData,
                {
                    new: true,
                    runValidators: true,
                }
            );

        res.json(updatedListing);
    })
);


app.get("/api/listings",
    wrapAsync(async (req, res) => {
        console.log("API LISTINGS ROUTE HIT");
        const {
            search,
            country,
            minPrice,
            maxPrice,
            sort,
            page = 1
        } = req.query;

        // Build filter
        const filter = {};

        // Search
        if (search) {
            filter.$or = [
                {
                    title: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    location: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    country: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ];
        }

        // Country
        if (country) {
            filter.country = {
                $regex: country,
                $options: "i"
            };
        }

        // Price
        if (minPrice || maxPrice) {
            filter.price = {};

            if (minPrice) {
                filter.price.$gte = Number(minPrice);
            }

            if (maxPrice) {
                filter.price.$lte = Number(maxPrice);
            }
        }

        // Sorting
        let sortOption = {};

        if (sort === "price_asc") {
            sortOption.price = 1;
        }

        if (sort === "price_desc") {
            sortOption.price = -1;
        }

        // Pagination
        const limit = 6;
        const currentPage = Math.max(
            Number(page) || 1,
            1
        );

        const skip =
            (currentPage - 1) * limit;

        // Count matching listings
        const totalListings =
            await Listing.countDocuments(filter);

        // Calculate pages
        const totalPages = Math.ceil(
            totalListings / limit
        );

        // Get listings
        const listings =
            await Listing.find(filter)
                .sort(sortOption)
                .skip(skip)
                .limit(limit);
             
        console.log("PAGINATION API ROUTE RUNNING");

        res.json({
            listings,
            currentPage,
            totalPages,
            totalListings
        });
    })
);
app.delete(
    "/api/listings/:id",
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ExpressError(
                400,
                "Invalid listing ID"
            );
        }

        const listing = await Listing.findById(id);

        if (!listing) {
            throw new ExpressError(
                404,
                "Listing not found"
            );
        }

        // Check that the logged-in user owns this listing
        if (
            !listing.owner ||
            !listing.owner.equals(req.session.userId)
        ) {
            throw new ExpressError(
                403,
                "You are not authorized to delete this listing"
            );
        }

        await Listing.findByIdAndDelete(id);

        res.json({
            message: "Listing deleted successfully"
        });
    })
);

app.get(
    "/listings",
    wrapAsync(async (req, res) => {

        const {
            search,
            country,
            minPrice,
            maxPrice,
            sort
        } = req.query;

        let query = {};


        // ================= SEARCH =================

        if (search) {

            query.$or = [
                {
                    title: {
                        $regex: search,
                        $options: "i"
                    }
                },

                {
                    location: {
                        $regex: search,
                        $options: "i"
                    }
                },

                {
                    country: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ];

        }


        // ================= COUNTRY FILTER =================

        if (country) {

            query.country = {
                $regex: `^${country}$`,
                $options: "i"
            };

        }


        // ================= PRICE FILTER =================

        if (minPrice || maxPrice) {

            query.price = {};

            if (minPrice) {
                query.price.$gte = Number(minPrice);
            }

            if (maxPrice) {
                query.price.$lte = Number(maxPrice);
            }

        }


        // ================= SORTING =================

        let sortOption = {};

        if (sort === "price_asc") {

            sortOption = {
                price: 1
            };

        }

        if (sort === "price_desc") {

            sortOption = {
                price: -1
            };

        }


        // ================= PAGINATION =================

        const page = Number(req.query.page) || 1;

        const queryParams = new URLSearchParams({

            ...(search && { search }),

            ...(country && { country }),

            ...(minPrice && { minPrice }),

            ...(maxPrice && { maxPrice }),

            ...(sort && { sort })

        }).toString();


        const limit = 6;

        const skip = (page - 1) * limit;


        // Get listings for current page

        const allListings = await Listing
            .find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(limit);


        // Count total matching listings

        const totalListings =
            await Listing.countDocuments(query);


        const totalPages =
            Math.ceil(totalListings / limit);


        res.render(
            "listings/index",
            {
                allListings,
                search,
                country,
                minPrice,
                maxPrice,
                sort,
                page,
                totalPages,
                queryParams
            }
        );

    })
);


// ================= NEW LISTING PAGE =================
// Must come before /listings/:id

app.get(
    "/listings/new",
    isLoggedIn,
    (req, res) => {

        res.render("listings/new");

    }
);


// ================= CREATE LISTING =================

app.post(
    "/listings",
    isLoggedIn,
    validateListing,

    wrapAsync(async (req, res) => {

        const newListing = new Listing(req.body.listing);

        newListing.owner = req.session.userId;

        await newListing.save();

        res.redirect("/listings");

    })
);


// ================= SHOW ROUTE =================

app.get(
    "/listings/:id",

    wrapAsync(async (req, res) => {

        const { id } = req.params;


        // Check ObjectId

        if (!mongoose.Types.ObjectId.isValid(id)) {

            throw new ExpressError(
                400,
                "Invalid listing ID"
            );

        }

        const listing = await Listing
            .findById(id)
            .populate({
                path: "reviews",
                populate: {
                    path: "author",
                },
            });


        // If listing does not exist

        if (!listing) {

            throw new ExpressError(
                404,
                "Listing not found"
            );

        }


        res.render(
            "listings/show",
            {
                listing
            }
        );

    })
);


// ================= EDIT ROUTE =================

app.get(
    "/listings/:id/edit",

    isLoggedIn,

    wrapAsync(async (req, res) => {

        const { id } = req.params;


        // Check ObjectId

        if (!mongoose.Types.ObjectId.isValid(id)) {

            throw new ExpressError(
                400,
                "Invalid listing ID"
            );

        }


        const listing =
            await Listing.findById(id);

        if (!listing) {
            throw new ExpressError(
                404,
                "Listing not found"
            );
        }

        if (
            !listing.owner ||
            !listing.owner.equals(req.session.userId)
        ) {
            throw new ExpressError(
                403,
                "You are not authorized to edit this listing"
            );
        }

        res.render(
            "listings/edit",
            {
                listing
            }
        );

    })
);


// ================= UPDATE ROUTE =================

app.put(
    "/listings/:id",

    isLoggedIn,

    validateListing,

    wrapAsync(async (req, res) => {

        const { id } = req.params;


        // Check ObjectId

        if (!mongoose.Types.ObjectId.isValid(id)) {

            throw new ExpressError(
                400,
                "Invalid listing ID"
            );

        }


        // Find listing first

        const listing =
            await Listing.findById(id);


        // If listing does not exist

        if (!listing) {

            throw new ExpressError(
                404,
                "Listing not found"
            );

        }


        // Check ownership

        if (
            !listing.owner ||
            !listing.owner.equals(req.session.userId)
        ) {

            throw new ExpressError(
                403,
                "You are not authorized to update this listing"
            );

        }


        // Update listing

        Object.assign(
            listing,
            req.body.listing
        );


        await listing.save();


        res.redirect(
            `/listings/${id}`
        );

    })
);


// ================= DELETE ROUTE =================

app.delete(
    "/listings/:id",

    isLoggedIn,

    wrapAsync(async (req, res) => {

        const { id } = req.params;


        // Check ObjectId

        if (!mongoose.Types.ObjectId.isValid(id)) {

            throw new ExpressError(
                400,
                "Invalid listing ID"
            );

        }


        // Find listing first

        const listing =
            await Listing.findById(id);


        // If listing does not exist

        if (!listing) {

            throw new ExpressError(
                404,
                "Listing not found"
            );

        }


        // Check ownership

        if (
            !listing.owner ||
            !listing.owner.equals(req.session.userId)
        ) {

            throw new ExpressError(
                403,
                "You are not authorized to delete this listing"
            );

        }


        // Delete listing

        await Listing.findByIdAndDelete(id);


        console.log(listing);


        res.redirect("/listings");

    })
);

app.post(
    "/api/listings/:id/reviews",
    isLoggedIn,
    validateReview,
    wrapAsync(async (req, res) => {
        const { id } = req.params;

        // Check listing ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ExpressError(
                400,
                "Invalid listing ID"
            );
        }

        // Find listing
        const listing = await Listing.findById(id);

        if (!listing) {
            throw new ExpressError(
                404,
                "Listing not found"
            );
        }

        // Get review data
        const { review } = req.body;

        // Create review
        const newReview = new Review(review);

        // Set review author
        newReview.author = req.session.userId;

        // Save review
        await newReview.save();

        // Add review to listing
        listing.reviews.push(newReview._id);

        await listing.save();

        res.status(201).json({
            message: "Review added successfully",
            review: newReview
        });
    })
);

// ================= REVIEW CREATE ROUTE =================

app.post(
    "/listings/:id/reviews",

    isLoggedIn,

    validateReview,

    wrapAsync(async (req, res) => {

        const { id } = req.params;

        // Check ObjectId

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ExpressError(
                400,
                "Invalid listing ID"
            );
        }

        // Find listing

        const listing =
            await Listing.findById(id);

        // If listing does not exist

        if (!listing) {
            throw new ExpressError(
                404,
                "Listing not found"
            );
        }

        // Create review

        const newReview =
            new Review(req.body.review);

        newReview.author =
            req.session.userId;

        // Save review

        await newReview.save();

        // Add review ID to listing

        listing.reviews.push(
            newReview._id
        );

        // Save listing

        await listing.save();

        // Redirect to listing

        res.redirect(
            `/listings/${id}`
        );

    })
);

app.get(
    "/api/listings/:id/reviews",
    wrapAsync(async (req, res) => {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ExpressError(
                400,
                "Invalid listing ID"
            );
        }

        const listing = await Listing.findById(id)
            .populate("reviews");

        if (!listing) {
            throw new ExpressError(
                404,
                "Listing not found"
            );
        }

        res.json(listing.reviews);
    })
);

// ================= DELETE REVIEW ROUTE =================

app.delete(
    "/listings/:listingId/reviews/:reviewId",

    isLoggedIn,

    wrapAsync(async (req, res) => {

        const {
            listingId,
            reviewId
        } = req.params;

        // Check review ID

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            throw new ExpressError(
                400,
                "Invalid review ID"
            );
        }

        // Find review

        const review =
            await Review.findById(reviewId);

        // If review does not exist

        if (!review) {
            throw new ExpressError(
                404,
                "Review not found"
            );
        }

        // Check review ownership

        if (
            !review.author ||
            !review.author.equals(req.session.userId)
        ) {
            throw new ExpressError(
                403,
                "You are not authorized to delete this review"
            );
        }

        // Delete review

        await Review.findByIdAndDelete(
            reviewId
        );

        // Remove review ID from listing

        await Listing.findByIdAndUpdate(
            listingId,
            {
                $pull: {
                    reviews: reviewId
                }
            }
        );

        // Go back to listing

        res.redirect(
            `/listings/${listingId}`
        );

    })
);


// ================= REGISTER PAGE =================

app.get(
    "/register",
    (req, res) => {

        res.render("users/register");

    }
);


// ================= REGISTER ROUTE =================

app.post(
    "/register",

    wrapAsync(async (req, res) => {

        const {
            username,
            email,
            password
        } = req.body;


        // Check if username or email already exists

        const existingUser =
            await User.findOne({
                $or: [
                    { username: username },
                    { email: email }
                ]
            });


        if (existingUser) {

            throw new ExpressError(
                400,
                "Username or email already exists"
            );

        }


        // Hash password

        const hashedPassword =
            await bcrypt.hash(password, 10);


        // Create user

        const newUser = new User({

            username,

            email,

            password: hashedPassword,

        });


        // Save user

        await newUser.save();


        // Create login session

        req.session.userId =
            newUser._id;


        // Send JSON response to React

        res.json({
            message: "Registration successful",
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email
            }
        });

    })
);

// ================= LOGIN PAGE =================

app.get(
    "/login",
    (req, res) => {

        res.render("users/login");

    }
);


// ================= LOGIN ROUTE =================

app.post(
    "/login",
    wrapAsync(async (req, res) => {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            throw new ExpressError(
                401,
                "Invalid email or password"
            );
        }

        const isValidPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!isValidPassword) {
            throw new ExpressError(
                401,
                "Invalid email or password"
            );
        }

        req.session.regenerate((err) => {
            if (err) {
                console.error("Session error:", err);

                return res.status(500).json({
                    message: "Could not create login session"
                });
            }

            req.session.userId = user._id;

            req.session.save((saveErr) => {
                if (saveErr) {
                    console.error(
                        "Session save error:",
                        saveErr
                    );

                    return res.status(500).json({
                        message: "Could not save login session"
                    });
                }

                console.log("LOGIN SUCCESS");
                console.log(
                    "SESSION USER ID:",
                    req.session.userId
                );

                res.json({
                    message: "Login successful",
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email
                    }
                });
            });
        });
    })
);

// ================= LOGOUT ROUTE =================

app.get(
    "/logout",
    (req, res) => {

        req.session.destroy((err) => {

            if (err) {

                return res.status(500).json({
                    message: "Could not logout"
                });

            }

            // Clear session cookie

            res.clearCookie("connect.sid");

            // Send response to React

            res.json({
                message: "Logout successful"
            });

        });

    }
);

// ================= 404 ROUTE =================

app.use((req, res, next) => {
    next(new ExpressError(404, "Page not found"));
});


// ================= ERROR HANDLER =================

app.use((err, req, res, next) => {
    const {
        statusCode = 500,
        message = "Something went wrong!"
    } = err;

    // React/API routes should return JSON
    if (
        req.originalUrl.startsWith("/api/") ||
        req.originalUrl === "/login"
    ) {
        return res.status(statusCode).json({
            success: false,
            message: message
        });
    }

    // Normal EJS routes
    res.status(statusCode).render("error", {
        statusCode,
        message
    });
});


// ================= START SERVER =================

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log("server is listening to port 8080");
});