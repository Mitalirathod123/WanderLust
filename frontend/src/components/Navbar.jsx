import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
fetch("https://wanderlust-backend-lwcg.onrender.com/api/current-user", { 
            credentials: "include",
        })
            .then((response) => response.json())
            .then((data) => {
                console.log("NAVBAR USER:", data.user);
                setUser(data.user);
            })
            .catch((error) => {
                console.error(
                    "Navbar user error:",
                    error
                );
            });
    }, []);

    const handleLogout = () => {
fetch("https://wanderlust-backend-lwcg.onrender.com/logout", {
            credentials: "include",
        })
            .then((response) => response.json())
            .then(() => {
                setUser(null);
                navigate("/login");
            })
            .catch((error) => {
                console.error(
                    "Logout error:",
                    error
                );
            });
    };

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-logo">
                WanderLust
            </Link>

            <div className="navbar-links">
                <Link to="/">
                    Home
                </Link>

                <Link to="/listings/new">
                    Add Listing
                </Link>

                {user ? (
                    <>
                        <span>
                            Welcome, {user.username}!
                        </span>

                        <button
                            onClick={handleLogout}
                            className="logout-btn"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login">
                            Login
                        </Link>

                        <Link to="/register">
                            Register
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;