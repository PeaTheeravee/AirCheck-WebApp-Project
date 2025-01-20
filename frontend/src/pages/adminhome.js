import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    IconButton,
    InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import "./adminhome.css";

const AdminHome = () => {
    const navigate = useNavigate();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState(""); // เพิ่ม state สำหรับข้อความยืนยัน
    const [isPasswordChange, setIsPasswordChange] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "" });
    const [showPassword, setShowPassword] = useState({ current: false, new: false });
    const [users, setUsers] = useState([]);

    // ฟังก์ชันสำหรับเปิด/ปิด Dialog
    const toggleDialog = () => setIsDialogOpen(!isDialogOpen);

    // ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่
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

            setSuccessMessage("Password updated successfully!"); // แสดงข้อความยืนยัน
            setPasswordData({ currentPassword: "", newPassword: "" });
            
            setTimeout(() => {
                setSuccessMessage(""); // ลบข้อความหลัง 3 วินาที
                navigate("/login"); // เด้งไปหน้า Login
            }, 3000);
        } catch (err) {
            setError(err.message);
        }
    };

    // ฟังก์ชันแสดง/ซ่อนรหัสผ่าน
    const handleTogglePassword = (field) => {
        setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
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

    useEffect(() => {
        if (isDialogOpen) {
            fetchUserData();
        }
        fetchUsers();
    }, [isDialogOpen]);

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

    return (
        <div>
            {/* Header */}
            <header className="admin-header">
                <h1>Admin Home</h1>
                <button className="profile-icon" onClick={toggleDialog}>
                    <AccountCircleIcon fontSize="large" />
                </button>
            </header>

            {/* Content/Main */}
            <div className="content">
                <h2>User Management</h2>
                <button
                    className="create-button"
                    onClick={() => alert("Mock: Create Account")}
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

            {/* Dialog */}
            <Dialog open={isDialogOpen} onClose={toggleDialog}>
                <DialogTitle>
                    {isPasswordChange ? "Change Password" : "User Details"}
                    <Button onClick={toggleDialog} style={{ float: "right" }}>X</Button>
                </DialogTitle>
                <DialogContent>
                    {isPasswordChange ? (
                        <div>
                            {error && <p style={{ color: "red" }}>{error}</p>}
                            <TextField
                                label="Current Password"
                                type={showPassword.current ? "text" : "password"}
                                fullWidth
                                margin="dense"
                                value={passwordData.currentPassword}
                                onChange={(e) =>
                                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                                }
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => handleTogglePassword("current")}
                                            >
                                                {showPassword.current ? <Visibility /> : <VisibilityOff />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <TextField
                                label="New Password"
                                type={showPassword.new ? "text" : "password"}
                                fullWidth
                                margin="dense"
                                value={passwordData.newPassword}
                                onChange={(e) =>
                                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                                }
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => handleTogglePassword("new")}
                                            >
                                                {showPassword.new ? <Visibility /> : <VisibilityOff />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            {successMessage && (
                                <p style={{ color: "green", marginTop: "10px" }}>
                                    {successMessage}
                                </p>
                            )}
                        </div>
                    ) : userData ? (
                        <div>
                            <p><strong>Username:</strong> {userData.username}</p>
                            <p><strong>First Name:</strong> {userData.first_name}</p>
                            <p><strong>Last Name:</strong> {userData.last_name}</p>
                        </div>
                    ) : (
                        <p>Loading...</p>
                    )}
                </DialogContent>
                <DialogActions>
                    {isPasswordChange ? (
                        <>
                            <Button onClick={handleChangePassword}>Submit</Button>
                            <Button onClick={() => setIsPasswordChange(false)}>Back</Button>
                        </>
                    ) : (
                        <>
                            <Button onClick={() => setIsPasswordChange(true)}>Change Password</Button>
                            <Button onClick={handleLogout}>Logout</Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default AdminHome;