import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

function ListingDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [listing, setListing] = useState(null);
    const [user, setUser] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    // Fetch listing
    useEffect(() => {
        fetch(`http://localhost:8080/api/listings/${id}`)
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
        fetch("http://localhost:8080/api/current-user", {
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
    fetch(`http://localhost:8080/api/listings/${id}/reviews`)
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
                `http://localhost:8080/api/listings/${id}`,
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
            <div className="reviews-section">
    <h2>Reviews</h2>

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