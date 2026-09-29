import { Link } from "react-router-dom";

function ListingCard({ listing }) {
    return (
        <Link
            to={`/listings/${listing._id}`}
            className="listing-link"
        >
            <div className="listing-card">

                <img
                    src={
                        listing.image?.url ||
                        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6"
                    }
                    alt={listing.title}
                    className="listing-image"
                />

                <div className="listing-info">

                    <h3>{listing.title}</h3>

                    <p>
                        {listing.location}, {listing.country}
                    </p>

                    <p className="listing-price">
                        ₹{listing.price} / night
                    </p>
                    <p className="view-details">
                        View Details →
                    </p>

                </div>

            </div>
        </Link>
    );
}

export default ListingCard;