import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function EditListing() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch(`http://localhost:8080/api/listings/${id}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to fetch listing");
                }

                return response.json();
            })
            .then((data) => {
                console.log("EDIT LISTING DATA:", data);

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
    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch(
                `http://localhost:8080/api/listings/${id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        listing: {
                            title: listing.title,
                            description: listing.description,
                            price: Number(listing.price),
                            location: listing.location,
                            country: listing.country,
                            image: listing.image
                        }
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to update listing"
                );
            }

            console.log("LISTING UPDATED:", data);

            navigate(`/listings/${id}`);
        } catch (error) {
            console.error(
                "Update listing error:",
                error
            );

            setError(error.message);
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

    return (
        <div className="edit-listing">
            <h1>Edit Listing</h1>
            <form
                className="listing-form"
                onSubmit={handleSubmit}
            >

                <label>
                    Title
                </label>

                <input
                    type="text"
                    value={listing.title}
                    onChange={(event) =>
                        setListing({
                            ...listing,
                            title: event.target.value
                        })
                    }
                />

                <label>
                    Description
                </label>

                <textarea
                    value={listing.description}
                    onChange={(event) =>
                        setListing({
                            ...listing,
                            description: event.target.value
                        })
                    }
                />

                <label>
                    Price
                </label>

                <input
                    type="number"
                    min="0"
                    value={listing.price}
                    onChange={(event) =>
                        setListing({
                            ...listing,
                            price: event.target.value
                        })
                    }
                />

                <label>
                    Location
                </label>

                <input
                    type="text"
                    value={listing.location}
                    onChange={(event) =>
                        setListing({
                            ...listing,
                            location: event.target.value
                        })
                    }
                />

                <label>
                    Country
                </label>

                <input
                    type="text"
                    value={listing.country}
                    onChange={(event) =>
                        setListing({
                            ...listing,
                            country: event.target.value
                        })
                    }
                />

                <button type="submit">
                    Update Listing
                </button>

                <button
                    type="button"
                    onClick={() =>
                        navigate(`/listings/${id}`)
                    }
                >
                    Cancel
                </button>

            </form>
        </div>
    );
}

export default EditListing;