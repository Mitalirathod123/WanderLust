import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ListingDetails from "./pages/ListingDetails";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NewListing from "./pages/NewListing";
import EditListing from "./pages/EditListing";

function App() {
    return (
        <BrowserRouter>

            <Navbar />

            <Routes>

                <Route
                    path="/"
                    element={<Home />}
                />
                <Route
                    path="/listings/new"
                    element={<NewListing />}
                />

                <Route
                    path="/listings/:id"
                    element={<ListingDetails />}
                />
                <Route
                    path="/listings/:id/edit"
                    element={<EditListing />}
                />
                <Route
                    path="/login"
                    element={<Login />}
                />
                <Route
                    path="/register"
                    element={<Register />}
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;