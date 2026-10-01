import { useEffect, useState } from "react";
import ListingCard from "../components/ListingCard";

function Home() {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [country, setCountry] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sort, setSort] = useState("");

    const [countryInput, setCountryInput] = useState("");
    const [minPriceInput, setMinPriceInput] = useState("");
    const [maxPriceInput, setMaxPriceInput] = useState("");
    const [sortInput, setSortInput] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const applyFilters = () => {
        setPage(1);

        setCountry(countryInput);
        setMinPrice(minPriceInput);
        setMaxPrice(maxPriceInput);
        setSort(sortInput);
    };

    useEffect(() => {
        const params = new URLSearchParams();

        if (search) {
            params.append("search", search);
        }

        if (country) {
            params.append("country", country);
        }

        if (minPrice) {
            params.append("minPrice", minPrice);
        }

        if (maxPrice) {
            params.append("maxPrice", maxPrice);
        }

        if (sort) {
            params.append("sort", sort);
        }
        params.append("page", page);

        fetch(
            `https://wanderlust-backend-lwcg.onrender.com/api/listings?${params.toString()}`
        )
            .then(async (response) => {
                console.log("API STATUS:", response.status);

                const data = await response.json();

                console.log("API RESPONSE:", data);

                if (!response.ok) {
                    throw new Error(
                        data.error || data.message || "Failed to fetch listings"
                    );
                }

                return data;
            })
            .then((data) => {
                console.log("LISTINGS API DATA:", data);

                setListings(data.listings || []);
                setTotalPages(data.totalPages || 1);
                setLoading(false);
            })
            .catch((error) => {
                console.error(
                    "Error fetching listings:",
                    error
                );

                setError("Unable to load listings.");
                setLoading(false);
            });
    }, [search, country, minPrice, maxPrice, sort, page]);

    useEffect(() => {
  fetch("https://wanderlust-backend-lwcg.onrender.com/api/current-user", {
            credentials: "include",
        })
            .then((response) => response.json())
            .then((data) => {
                console.log("CURRENT USER:", data);
            })
            .catch((error) => {
                console.error("Current user error:", error);
            });
    }, []);

    return (
        <div>
            <h1>Explore stays</h1>

            <form
                className="search-form"
                onSubmit={(event) => {
                    event.preventDefault();

                    setSearch(searchInput);
                    setPage(1);
                }}
            >
                <input
                    type="text"
                    placeholder="Search by title, location, or country"
                    value={searchInput}
                    onChange={(event) => {
                        setSearchInput(event.target.value);
                    }}
                />

                <button type="submit">
                    Search
                </button>
            </form>
            <div className="filter-form">
                <input
                    type="text"
                    placeholder="Country"
                    value={countryInput}
                    onChange={(event) =>
                        setCountryInput(event.target.value)
                    }
                />

                <input
                    type="number"
                    placeholder="Min price"
                    value={minPriceInput}
                    onChange={(event) =>
                        setMinPriceInput(event.target.value)
                    }
                    min="0"
                />

                <input
                    type="number"
                    placeholder="Max price"
                    value={maxPriceInput}
                    onChange={(event) =>
                        setMaxPriceInput(event.target.value)
                    }
                    min="0"
                />

                <select
                    value={sortInput}
                    onChange={(event) =>
                        setSortInput(event.target.value)
                    }
                >
                    <option value="">Sort by price</option>

                    <option value="price_asc">
                        Price: Low to High
                    </option>

                    <option value="price_desc">
                        Price: High to Low
                    </option>
                </select>

                <button
                    type="button"
                    onClick={applyFilters}
                >
                    Apply Filters
                </button>
            </div>


            {loading ? (
                <p className="loading-text">
                    Loading listings...
                </p>
            ) : error ? (
                <p className="error-text">
                    {error}
                </p>
            ) : listings.length === 0 ? (
                <p className="empty-text">
                    No listings found.
                </p>
            ) : (
                <>
                    <div className="listing-grid">
                        {listings.map((listing) => (
                            <div key={listing._id}>
                                <ListingCard listing={listing} />
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                onClick={() =>
                                    setPage((currentPage) =>
                                        Math.max(currentPage - 1, 1)
                                    )
                                }
                                disabled={page === 1}
                            >
                                ← Previous
                            </button>

                            <span>
                                Page {page} of {totalPages}
                            </span>

                            <button
                                onClick={() =>
                                    setPage((currentPage) =>
                                        Math.min(
                                            currentPage + 1,
                                            totalPages
                                        )
                                    )
                                }
                                disabled={page === totalPages}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default Home;