import React from "react";
import { useNavigate } from "react-router-dom";
import AccountCircleIcon from "@mui/icons-material/AccountCircle"; // ไอคอนรูปคน
import "./adminhome.css"; // ใช้สไตล์ของ adminhome โดยตรง

const AdminHome = () => {
    const navigate = useNavigate();

    return (
        <div>
            <header className="admin-header">
                <h1>Admin Home</h1>
                <button
                    className="profile-icon"
                    onClick={() => navigate("/login")} // นำทางไปหน้า Login หรือฟังก์ชันอื่น
                >
                    <AccountCircleIcon fontSize="large" />
                </button>
            </header>
            <p>Welcome to the admin dashboard!</p>
        </div>
    );
};

export default AdminHome;
