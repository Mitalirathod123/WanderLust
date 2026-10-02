import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

function ListingDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [listing, setListing] = useState(null);
    const [user, setUser] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    // Fetch listing
    useEffect(() => {
        fetch(`https://wanderlust-backend-lwcg.onrender.com/api/listings/${id}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to fetch listing");
                }

                return response.json();
            })
            .then((data) => {
                console.log("LISTING DETAILS:", data);

                setListing(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error(
                    "Error fetching listing:",
                    error
                );

                setError("Unable to load listing.");
                setLoading(false);
            });
    }, [id]);

    // Fetch current logged-in user
    useEffect(() => {
        fetch("https://wanderlust-backend-lwcg.onrender.com/api/current-user", {
            credentials: "include",
        })
            .then((response) => response.json())
            .then((data) => {
                console.log("DETAILS PAGE USER:", data.user);
                setUser(data.user);
            })
            .catch((error) => {
                console.error(
                    "Current user error:",
                    error
                );
            });
    }, []);

    useEffect(() => {
        fetch(`https://wanderlust-backend-lwcg.onrender.com/api/listings/${id}/reviews`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to fetch reviews");
                }

                return response.json();
            })
            .then((data) => {
                console.log("LISTING REVIEWS:", data);

                setReviews(data);
            })
            .catch((error) => {
                console.error(
                    "Error fetching reviews:",
                    error
                );
            });
    }, [id]);
    // Add review
    const handleReviewSubmit = async (event) => {
        event.preventDefault();

        if (!user) {
            alert("Please login to add a review.");
            navigate("/login");
            return;
        }

        try {
            const response = await fetch(
                `https://wanderlust-backend-lwcg.onrender.com/api/listings/${id}/reviews`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        review: {
                            rating: Number(rating),
                            comment: comment,
                        },
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to add review"
                );
            }

            alert("Review added successfully!");

            setReviews((previousReviews) => [
                ...previousReviews,
                data.review || data,
            ]);

            setRating(5);
            setComment("");
        } catch (error) {
            console.error("Review error:", error);
            alert(error.message);
        }
    };



    // Delete listing
    const handleDelete = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this listing?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(
                `https://wanderlust-backend-lwcg.onrender.com/api/listings/${id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to delete listing"
                );
            }

            alert("Listing deleted successfully");

            navigate("/");
        } catch (error) {
            console.error("Delete error:", error);

            alert(error.message);
        }
    };

    if (loading) {
        return <p>Loading listing...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    if (!listing) {
        return <p>Listing not found.</p>;
    }

    // Check whether current user owns this listing
    const isOwner =
        user &&
        listing.owner &&
        String(user.id) === String(listing.owner);

    return (
        <div className="listing-details">
            <Link to="/">
                ← Back to listings
            </Link>

            <img
                src={
                    listing.image?.url ||
                    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6"
                }
                alt={listing.title}
                className="details-image"
            />

            <h1>{listing.title}</h1>

            <p>
                {listing.location}, {listing.country}
            </p>

            <p>
                <strong>₹{listing.price}</strong> / night
            </p>

            <p>{listing.description}</p>
            <div className="review-section">
                <h2>Reviews</h2>
                {user ? (
                    <form onSubmit={handleReviewSubmit} className="review-form">

                        <div className="review-rating-row">
                            <label>Rating:</label>

                            <select
                                value={rating}
                                onChange={(event) =>
                                    setRating(event.target.value)
                                }
                            >
                                <option value="5">⭐⭐⭐⭐⭐ 5</option>
                                <option value="4">⭐⭐⭐⭐ 4</option>
                                <option value="3">⭐⭐⭐ 3</option>
                                <option value="2">⭐⭐ 2</option>
                                <option value="1">⭐ 1</option>
                            </select>
                        </div>

                        <div className="review-comment">
                            <label>Comment:</label>

                            <textarea
                                value={comment}
                                onChange={(event) =>
                                    setComment(event.target.value)
                                }
                                placeholder="Write your review..."
                                required
                            />
                        </div>

                        <button type="submit">
                            Submit Review
                        </button>

                    </form>
                ) : (
                    <p>
                        <Link to="/login">
                            Login
                        </Link>{" "}
                        to add a review.
                    </p>
                )}

                {reviews.length === 0 ? (
                    <p>No reviews yet.</p>
                ) : (
                    reviews.map((review) => (
                        <div
                            key={review._id}
                            className="review-card"
                        >
                            <p>
                                ⭐ {review.rating}/5
                            </p>

                            <p>
                                {review.comment}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {isOwner && (
                <div className="listing-actions">
                    <Link
                        to={`/listings/${listing._id}/edit`}
                        className="edit-btn"
                    >
                        Edit Listing
                    </Link>

                    <button
                        onClick={handleDelete}
                        className="delete-btn"
                    >
                        Delete Listing
                    </button>
                </div>
            )}
        </div>
    );
}

export default ListingDetails;