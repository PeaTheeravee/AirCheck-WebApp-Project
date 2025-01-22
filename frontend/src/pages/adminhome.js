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
    const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "" });
    const [showPassword, setShowPassword] = useState({ current: false, new: false });
    const [users, setUsers] = useState([]);
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
    const [updateData, setUpdateData] = useState({username: "",firstName: "",lastName: "",});
    const [isUserDetailsDialogOpen, setIsUserDetailsDialogOpen] = useState(false);
    const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);

    const toggleUserDetailsDialog = () => setIsUserDetailsDialogOpen(!isUserDetailsDialogOpen);
    const toggleChangePasswordDialog = () => setIsChangePasswordDialogOpen(!isChangePasswordDialogOpen);

    const toggleUpdateDialog = () => {
        if (!isUpdateDialogOpen && userData) {
            setUpdateData({
                username: userData.username || "",
                firstName: userData.first_name || "",
                lastName: userData.last_name || "",
            });
        }
        setIsUpdateDialogOpen(!isUpdateDialogOpen);
    };

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
        
        if (!passwordData.currentPassword.trim()) {
            setError("Current Password cannot be empty.");
            setTimeout(() => setError(""), 3000); // ลบข้อความ Error หลัง 3 วินาที
            return;
        }
        if (!passwordData.newPassword.trim()) {
            setError("New Password cannot be empty.");
            setTimeout(() => setError(""), 3000); // ลบข้อความ Error หลัง 3 วินาที
            return;
        }


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
                setError(errorData.detail || "Failed to change password.");
                setTimeout(() => setError(""), 3000); // ลบข้อความหลัง 3 วินาที
                return;
            }

            setSuccessMessage("Password updated successfully!"); // แสดงข้อความยืนยัน
            setPasswordData({ currentPassword: "", newPassword: "" });
            
            setTimeout(() => {
                setSuccessMessage(""); // ลบข้อความหลัง 3 วินาที
                navigate("/login"); // เด้งไปหน้า Login
            }, 3000);
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(""), 3000); // ลบข้อความหลัง 3 วินาที
        }
    };

    // ฟังก์ชันแสดง/ซ่อนรหัสผ่าน
    const handleTogglePassword = (field) => {
        setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    // ฟังก์ชันสำหรับอัปเดตข้อมูลผู้ใช้
    const handleUpdateUser = async () => {
        if (!updateData.firstName.trim() || !updateData.lastName.trim()) {
            setError("First Name and Last Name cannot be empty.");
            setTimeout(() => setError(""), 3000);
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/users/${userData.id}/update`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: updateData.username,
                    first_name: updateData.firstName,
                    last_name: updateData.lastName,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to update user.");
            }

            setSuccessMessage("User updated successfully!");
            await fetchUserData(); // ดึงข้อมูลใหม่
            setTimeout(() => {
                setSuccessMessage("");
                toggleUpdateDialog(); // ปิด Pop-Up Update
            }, 3000);
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(""), 3000);
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

            setSuccessMessage("Return to home page"); // แสดงข้อความยืนยันใต้ Last Name
            setTimeout(() => {
                setSuccessMessage(""); // ลบข้อความหลัง 3 วินาที
                navigate("/"); // เด้งไปหน้า Home
            }, 1000);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        if (isDialogOpen) {
            fetchUserData();
        }
        fetchUserAll();
    }, [isDialogOpen]);

    useEffect(() => {
        if (isUserDetailsDialogOpen) {
            fetchUserData(); // เรียกตอนเปิด Dialog
        }
    }, [isUserDetailsDialogOpen]);

    const fetchUserAll = async () => {
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
                <button className="profile-icon" onClick={setIsUserDetailsDialogOpen}>
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

            {/* Dialog PopUp */}
            <Dialog open={isUserDetailsDialogOpen} onClose={toggleUserDetailsDialog}>
                <DialogTitle>
                    User Details
                    <Button onClick={toggleUserDetailsDialog} style={{ float: "right" }}>X</Button>
                </DialogTitle>
                <DialogContent>
                    {userData ? (
                        <>
                            <p><strong>Username:</strong> {userData.username}</p>
                            <p><strong>First Name:</strong> {userData.first_name}</p>
                            <p><strong>Last Name:</strong> {userData.last_name}</p>
                        </>
                    ) : (
                        <p>Loading...</p>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={toggleUpdateDialog}>Update</Button> {/* เปิด Pop-Up Update User */}
                    <Button onClick={toggleChangePasswordDialog}>Change Password</Button> {/* เปิด Pop-Up Change Password */}
                    <Button onClick={handleLogout}>Logout</Button> {/* Logout */}
                </DialogActions>
            </Dialog>

            <Dialog open={isChangePasswordDialogOpen} onClose={toggleChangePasswordDialog}>
                <DialogTitle>Change Password</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Current Password"
                        type={showPassword.current ? "text" : "password"}
                        fullWidth
                        margin="dense"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => handleTogglePassword("current")}>
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
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => handleTogglePassword("new")}>
                                        {showPassword.new ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    {error && <p style={{ color: "red" }}>{error}</p>}
                    {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleChangePassword}>Submit</Button>
                    <Button onClick={toggleChangePasswordDialog}>Back</Button>
                </DialogActions>
            </Dialog>  

            {/* Pop-Up Update User */}
            <Dialog open={isUpdateDialogOpen} onClose={toggleUpdateDialog}>
                <DialogTitle>
                    Update User
                    <Button onClick={toggleUpdateDialog} style={{ float: "right" }}>X</Button>
                </DialogTitle>
                <DialogContent>
                    <TextField
                        label="Username"
                        fullWidth
                        margin="dense"
                        value={updateData.username} // เพิ่ม state username
                        onChange={(e) => setUpdateData({ ...updateData, username: e.target.value })}
                    />
                    <TextField
                        label="First Name"
                        fullWidth
                        margin="dense"
                        value={updateData.firstName}
                        onChange={(e) => setUpdateData({ ...updateData, firstName: e.target.value })}
                    />
                    <TextField
                        label="Last Name"
                        fullWidth
                        margin="dense"
                        value={updateData.lastName}
                        onChange={(e) => setUpdateData({ ...updateData, lastName: e.target.value })}
                    />
                    {error && (
                        <p style={{ color: "red", marginTop: "10px", marginBottom: "0" }}>
                            {error}
                        </p>
                    )}
                    {successMessage && (
                        <p style={{ color: "green", marginTop: "10px" }}>
                            {successMessage}
                        </p>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleUpdateUser}>Submit</Button>
                    <Button onClick={toggleUpdateDialog}>BACK</Button>
                </DialogActions>
            </Dialog>

        </div>
    );
};

export default AdminHome;