import React, { useState, useEffect } from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle"; // ไอคอนรูปคน
import Popup from "../components/Popup"; // Import Popup Component
import "./adminhome.css"; // ใช้สไตล์ของ adminhome โดยตรง

const AdminHome = () => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState("");

    // ฟังก์ชันสำหรับเปิด/ปิด popup
    const togglePopup = () => setIsPopupOpen(!isPopupOpen);

    // ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้
    const fetchUserData = async () => {
        try {
            const response = await fetch("http://localhost:8000/users/me", {
                method: "GET",
                credentials: "include", // ส่งคุกกี้ไปด้วย
            });

            if (!response.ok) {
                throw new Error("Failed to fetch user details.");
            }

            const data = await response.json();
            setUserData(data);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        if (isPopupOpen) {
            fetchUserData(); // ดึงข้อมูลเมื่อเปิด popup
        }
    }, [isPopupOpen]);

    return (
        <div>
            <header className="admin-header">
                <h1>Admin Home</h1>
                <button
                    className="profile-icon"
                    onClick={togglePopup} // เปิด/ปิด popup
                >
                    <AccountCircleIcon fontSize="large" />
                </button>
            </header>
            <p>Welcome to the admin dashboard!</p>

            {/* Popup Component */}
            <Popup isOpen={isPopupOpen} onClose={togglePopup}>
                <h2>User Details</h2>
                {error && <p style={{ color: "red" }}>{error}</p>}
                {userData ? (
                    <div>
                        <p><strong>Username:</strong> {userData.username}</p>
                        <p><strong>First Name:</strong> {userData.first_name}</p>
                        <p><strong>Last Name:</strong> {userData.last_name}</p>
                        <p><strong>Role:</strong> {userData.role}</p>
                    </div>
                ) : (
                    <p>Loading...</p>
                )}
            </Popup>
        </div>
    );
};

export default AdminHome;
