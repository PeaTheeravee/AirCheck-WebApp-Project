import React from "react";
import { useNavigate } from "react-router-dom";
import AccountCircleIcon from "@mui/icons-material/AccountCircle"; // ไอคอนรูปคน
import "./home.css";

const Home = () => {
    const navigate = useNavigate();

    return (
        <div>
            <header className="home-header">
                <h1>Welcome to My Application!</h1>
                <button
                    className="profile-icon"
                    onClick={() => navigate("/login")}
                >
                    <AccountCircleIcon fontSize="large" />
                </button>
            </header>
            <p>This is the home page where you can find the latest updates and features.</p>
        </div>
    );
};

export default Home;
