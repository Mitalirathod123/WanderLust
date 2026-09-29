import { useState } from "react";

function NewListing() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [location, setLocation] = useState("");
    const [country, setCountry] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");

        try {
            const response = await fetch(
                "http://localhost:8080/api/listings",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        listing: {
                            title,
                            description,
                            price,
                            location,
                            country,
                            image: {
                                url: imageUrl,
                            },
                        },
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to create listing"
                );
            }

            window.location.href = `/listings/${data._id}`;
        } catch (error) {
            console.error(
                "Create listing error:",
                error
            );

            setError(error.message);
        }
    };

    return (
        <div className="listing-form">

            <h1>Add New Listing</h1>

            {error && (
                <p className="error-text">
                    {error}
                </p>
            )}

            <form onSubmit={handleSubmit}>

                <div className="form-group">
                    <label>Title</label>

                    <input
                        type="text"
                        placeholder="Enter listing title"
                        value={title}
                        onChange={(event) =>
                            setTitle(event.target.value)
                        }
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Description</label>

                    <textarea
                        placeholder="Describe the place"
                        value={description}
                        onChange={(event) =>
                            setDescription(
                                event.target.value
                            )
                        }
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Price per night</label>

                    <input
                        type="number"
                        placeholder="Enter price"
                        value={price}
                        onChange={(event) =>
                            setPrice(event.target.value)
                        }
                        min="0"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Location</label>

                    <input
                        type="text"
                        placeholder="Enter location"
                        value={location}
                        onChange={(event) =>
                            setLocation(event.target.value)
                        }
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Country</label>

                    <input
                        type="text"
                        placeholder="Enter country"
                        value={country}
                        onChange={(event) =>
                            setCountry(event.target.value)
                        }
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Image URL</label>

                    <input
                        type="url"
                        placeholder="Enter image URL"
                        value={imageUrl}
                        onChange={(event) =>
                            setImageUrl(event.target.value)
                        }
                    />
                </div>

                <button type="submit">
                    Create Listing
                </button>

            </form>

        </div>
    );
}

export default NewListing;