import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import Popup from "../components/Popup";
import "./adminhome.css";

const AdminHome = () => {
    const navigate = useNavigate(); // Initialize navigate
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState(""); // State for errors
    const [isPasswordChange, setIsPasswordChange] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "" });

    // ฟังก์ชันสำหรับเปิด/ปิด popup
    const togglePopup = () => setIsPopupOpen(!isPopupOpen);

    // ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้
    const fetchUserData = async () => {
        try {
            const response = await fetch("http://localhost:8000/users/me", {
                method: "GET",
                credentials: "include",
            });

            if (!response.ok) {
                const errorData = await response.json(); // ดึงข้อความจาก detail
                throw new Error(errorData.detail || "Failed to fetch user details.");
            }

            const data = await response.json();
            setUserData(data);
        } catch (err) {
            setError(err.message); // แสดงข้อความ error
        }
    };

    // ฟังก์ชันสำหรับเปลี่ยนรหัสผ่าน
    const handleChangePassword = async () => {
        try {
            const response = await fetch("http://localhost:8000/users/change_password", {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    current_password: passwordData.currentPassword,
                    new_password: passwordData.newPassword,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json(); // ดึงข้อความจาก detail
                throw new Error(errorData.detail || "Failed to change password.");
            }

            alert("Password updated successfully. Please log in again.");
            setIsPasswordChange(false);
            setPasswordData({ currentPassword: "", newPassword: "" });
            togglePopup();
        } catch (err) {
            setError(err.message); // แสดงข้อความ error
        }
    };

    // ฟังก์ชันสำหรับ logout
    const handleLogout = async () => {
        try {
            const response = await fetch("http://localhost:8000/logout", {
                method: "POST",
                credentials: "include",
            });

            if (!response.ok) {
                const errorData = await response.json(); // ดึงข้อความจาก detail
                throw new Error(errorData.detail || "Logout failed.");
            }

            alert("Logged out successfully.");
            navigate("/"); // Redirect to Home
        } catch (err) {
            setError(err.message); // แสดงข้อความ error
        }
    };

    useEffect(() => {
        if (isPopupOpen) {
            fetchUserData();
        }
    }, [isPopupOpen]);

    return (
        <div>
            <header className="admin-header">
                <h1>Admin Home</h1>
                <button
                    className="profile-icon"
                    onClick={togglePopup}
                >
                    <AccountCircleIcon fontSize="large" />
                </button>
            </header>
            <p>Welcome to the admin dashboard!</p>

            {/* Popup Component */}
            <Popup isOpen={isPopupOpen} onClose={togglePopup}>
                {isPasswordChange ? (
                    <div>
                        <h2>Change Password</h2>
                        {error && <p style={{ color: "red" }}>{error}</p>} {/* แสดงข้อความ error */}
                        <input
                            type="password"
                            placeholder="Current Password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        />
                        <input
                            type="password"
                            placeholder="New Password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        />
                        <button onClick={handleChangePassword}>Submit</button>
                        <button onClick={() => setIsPasswordChange(false)}>Back</button>
                    </div>
                ) : (
                    <div>
                        <h2>User Details</h2>
                        {error && <p style={{ color: "red" }}>{error}</p>} {/* แสดงข้อความ error */}
                        {userData ? (
                            <div>
                                <p><strong>Username:</strong> {userData.username}</p>
                                <p><strong>First Name:</strong> {userData.first_name}</p>
                                <p><strong>Last Name:</strong> {userData.last_name}</p>
                            </div>
                        ) : (
                            <p>Loading...</p>
                        )}
                        <button onClick={() => setIsPasswordChange(true)}>Change Password</button>
                        <button onClick={handleLogout}>Logout</button>
                    </div>
                )}
            </Popup>
        </div>
    );
};

export default AdminHome;
