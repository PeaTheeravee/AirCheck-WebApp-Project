import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import Popup from "../components/Popup";
import "./adminhome.css";

const AdminHome = () => {
    const navigate = useNavigate();
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState("");
    const [isPasswordChange, setIsPasswordChange] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "" });
    const [users, setUsers] = useState([]); // State สำหรับข้อมูลผู้ใช้ทั้งหมด (ตาราง)

    // ฟังก์ชันสำหรับเปิด/ปิด popup
    const togglePopup = () => setIsPopupOpen(!isPopupOpen);

    // ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้ (Header)
    const fetchUserData = async () => {
        try {
            const response = await fetch("http://localhost:8000/users/me", {
                method: "GET",
                credentials: "include",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to fetch user details.");
            }

            const data = await response.json();
            setUserData(data);
        } catch (err) {
            setError(err.message);
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
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to change password.");
            }

            alert("Password updated successfully. Please log in again.");
            setIsPasswordChange(false);
            setPasswordData({ currentPassword: "", newPassword: "" });
            togglePopup();
        } catch (err) {
            setError(err.message);
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
                const errorData = await response.json();
                throw new Error(errorData.detail || "Logout failed.");
            }

            alert("Logged out successfully.");
            navigate("/");
        } catch (err) {
            setError(err.message);
        }
    };

    // ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้ทั้งหมด (Content/Main)
    const fetchUsers = async () => {
        try {
            const response = await fetch("http://localhost:8000/users/all", {
                method: "GET",
                credentials: "include",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to fetch user details.");
            }

            const data = await response.json();
            setUsers(data); // เก็บข้อมูลผู้ใช้ใน state
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        if (isPopupOpen) {
            fetchUserData();
        }
        fetchUsers(); // ดึงข้อมูลผู้ใช้ทั้งหมด
    }, [isPopupOpen]);

    return (
        <div>
            {/* Header */}
            <header className="admin-header">
                <h1>Admin Home</h1>
                <button className="profile-icon" onClick={togglePopup}>
                    <AccountCircleIcon fontSize="large" />
                </button>
            </header>



            {/* Content/Main */}
            <div className="content">
                <h2>User Management</h2>
                <button
                    className="create-button"
                    onClick={() => alert("Mock: Create Account")} // Mock ปุ่มสร้างบัญชี
                >
                    Create account
                </button>
                <table className="user-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>{user.username}</td>
                                <td>{user.first_name}</td>
                                <td>{user.last_name}</td>
                                <td>
                                    <button
                                        className="edit-button"
                                        onClick={() => alert(`Mock: Edit account of ${user.username}`)}
                                    >
                                        Edit account
                                    </button>
                                    <button
                                        className="delete-button"
                                        onClick={() => alert(`Mock: Delete account of ${user.username}`)}
                                    >
                                        Delete account
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>



            {/* Popup */}
            <Popup isOpen={isPopupOpen} onClose={togglePopup}>
                {isPasswordChange ? (
                    <div>
                        <h2>Change Password</h2>
                        {error && <p style={{ color: "red" }}>{error}</p>}
                        <input
                            type="password"
                            placeholder="Current Password"
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                                setPasswordData({ ...passwordData, currentPassword: e.target.value })
                            }
                        />
                        <input
                            type="password"
                            placeholder="New Password"
                            value={passwordData.newPassword}
                            onChange={(e) =>
                                setPasswordData({ ...passwordData, newPassword: e.target.value })
                            }
                        />
                        <button onClick={handleChangePassword}>Submit</button>
                        <button onClick={() => setIsPasswordChange(false)}>Back</button>
                    </div>
                ) : (
                    <div>
                        <h2>User Details</h2>
                        
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
