import React, { useState, useEffect, useCallback} from "react";
import { useNavigate } from "react-router-dom";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SearchIcon from "@mui/icons-material/Search";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    IconButton,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,

} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import "./adminhome.css";

const AdminHome = () => {
    const navigate = useNavigate();
    const [isDialogOpen] = useState(false);

    const [userData, setUserData] = useState(null);
    const [users, setUsers] = useState([]);
    const [targetUserId, setTargetUserId] = useState(null); // เก็บ userId ใน state
    const [targetUserName, setTargetUserName] = useState(""); // แสดงชื่อ ใน Pop-Up

    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState(""); 


    const [newUser, setNewUser] = useState({username: "",firstName: "",lastName: "",password: ""});
    const [updateData, setUpdateData] = useState({username: "",firstName: "",lastName: "",});
    const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "" });


    const [showPassword, setShowPassword] = useState({ current: false, new: false });
    const [isUserDetailsDialogOpen, setIsUserDetailsDialogOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
    const [isChangePasswordYourselfDialogOpen, setIsChangePasswordYourselfDialogOpen] = useState(false);
    const [isChangeSomeonePasswordDialogOpen, setIsChangeSomeonePasswordDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    //สำหรับ ตาราง + Pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(5);
    const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(false);

    //------------------------------------------------------------------------------------------------
    const toggleUserDetailsDialog = () => setIsUserDetailsDialogOpen(!isUserDetailsDialogOpen);
    const toggleChangePasswordYourselfDialog = () => {
        setShowPassword({ current: false, new: false }); // รีเซ็ตให้เป็นซ่อนรหัสเสมอ
        setIsChangePasswordYourselfDialogOpen(!isChangePasswordYourselfDialogOpen)
    };

    const toggleCreateDialog = () => {
        setNewUser({ username: "", firstName: "", lastName: "", password: "" }); 
        setIsCreateDialogOpen(!isCreateDialogOpen);
    };

    const toggleChangeSomeonePasswordDialog = (userId = null, username = "") => {
        setTargetUserId(userId); // เก็บ userId ใน state
        setTargetUserName(username);
        setShowPassword({ new: false, confirm: false }); // รีเซ็ตให้เป็นซ่อนรหัสเสมอ
        setIsChangeSomeonePasswordDialogOpen(!isChangeSomeonePasswordDialogOpen);
    };

    const toggleDeleteDialog = (userId = null, username = "") => {
        setTargetUserId(userId); // เก็บ userId ใน state
        setTargetUserName(username);
        setIsDeleteDialogOpen(!isDeleteDialogOpen);
    };

    const toggleUpdateDialog = (userId = null, username = "", firstName = "", lastName = "") => {
        if (userId) {
            setUpdateData({
                username: username || "",
                firstName: firstName || "",
                lastName: lastName || "",
            });
            setTargetUserId(userId); // เก็บ userId ใน state
            setTargetUserName(username);
        }
        setIsUpdateDialogOpen(!isUpdateDialogOpen);
    };

    //================================================================================================
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
            setTimeout(() => setError(""), 2000); 
        }
    };

    // ฟังก์ชันสำหรับสร้างผู้ใช้ใหม่
    const handleCreateAccount = async () => {
        if (!newUser.username || !newUser.firstName || !newUser.lastName || !newUser.password) {
            setError("All fields are required!");
            setTimeout(() => setError(""), 2000); 
            return;
        }
    
        try {
            const response = await fetch("http://localhost:8000/users/create", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: newUser.username,
                    first_name: newUser.firstName,
                    last_name: newUser.lastName,
                    password: newUser.password
                }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to create user.");
            }
    
            setSuccessMessage("User created successfully!"); 
            await fetchUserAll(); // อัปเดตตารางข้อมูลผู้ใช้
            setTimeout(() => {
                setSuccessMessage("");
                toggleCreateDialog(); // ปิด Pop-Up
            }, 2000);
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(""), 2000); 
        }
    };

    // ฟังก์ชันสำหรับเปลี่ยนรหัสผ่านตัวเอง
    const handleChangePasswordYourself = async () => {
        if (!passwordData.currentPassword.trim() && !passwordData.newPassword.trim()) {
            setError("Current Password and New Password cannot be empty.");
            setTimeout(() => setError(""), 2000); 
            return;
        }
        if (!passwordData.currentPassword.trim()) {
            setError("Current Password cannot be empty.");
            setTimeout(() => setError(""), 2000); 
            return;
        }
        if (!passwordData.newPassword.trim()) {
            setError("New Password cannot be empty.");
            setTimeout(() => setError(""), 2000); 
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
                throw new Error(errorData.detail || "Failed to change password.");
            }

            setSuccessMessage("Password updated successfully!"); 
            setTimeout(() => {
                setSuccessMessage(""); 
                navigate("/login"); // เด้งไปหน้า Login
            }, 2000);
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(""), 2000); 
        }
    };

    // ฟังก์ชันสำหรับเปลี่ยนรหัสผ่านของผู้ใช้อื่น (โดย Super Admin)
    const handleChangeSomeonePassword = async () => {
        if (!passwordData.newPassword.trim()) {
            setError("New Password cannot be empty.");
            setTimeout(() => setError(""), 2000); 
            return;
        }
        if (!passwordData.confirmNewPassword.trim()) {
            setError("Confirm Password cannot be empty.");
            setTimeout(() => setError(""), 2000); 
            return;
        }
    
        try {
            const response = await fetch(`http://localhost:8000/users/${targetUserId}/change_password`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    new_password: passwordData.newPassword,
                    confirm_new_password: passwordData.confirmNewPassword,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to change password for the user.");
            }

            setSuccessMessage("Password updated successfully for the user!"); 
            setTimeout(() => {
                setSuccessMessage("");
                toggleChangeSomeonePasswordDialog(); // ปิด Pop-Up 
            }, 2000);
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(""), 2000); 
        }
    };    

    // ฟังก์ชันแสดง/ซ่อนรหัสผ่าน
    const handleTogglePassword = (field) => {
        setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    // ฟังก์ชันสำหรับลบผู้ใช้
    const handleDeleteUser = async (userId) => {
        try {
            const response = await fetch(`http://localhost:8000/users/${targetUserId}`, {
                method: "DELETE",
                credentials: "include",
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to delete user.");
            }
    
            setSuccessMessage("User deleted successfully!"); 
            await fetchUserAll(); // โหลดข้อมูลผู้ใช้ใหม่
            setTimeout(() => {
                setSuccessMessage("");
                toggleDeleteDialog(); // ปิด Pop-Up
            }, 2000);
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(""), 2000);
        }
    };

    // ฟังก์ชันสำหรับอัปเดตข้อมูลผู้ใช้
    const handleUpdateUser = async () => {
        if (!updateData.firstName.trim() || !updateData.lastName.trim()) {
            setError("First Name and Last Name cannot be empty.");
            setTimeout(() => setError(""), 2000);
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/users/${targetUserId}/update`, {
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
            await fetchUserAll(); // อัปเดตตารางข้อมูลผู้ใช้
            setTimeout(() => {
                setSuccessMessage("");
                toggleUpdateDialog(); // ปิด Pop-Up 
            }, 2000);
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(""), 2000); 
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
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(""), 2000);
        }
    };

    // ดึงข้อมูลผู้ใช้ทั้งหมด
    const fetchUserAll = useCallback(async () => {
        setLoading(true); // เริ่มโหลดข้อมูล
        try {
            const response = await fetch(
                `http://localhost:8000/users/all?page=${currentPage + 1}&size=${pageSize}`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to fetch user details.");
            }

            const data = await response.json();
            setUsers(data.users); // เก็บข้อมูลผู้ใช้ใน state
            setTotalUsers(data.total); // จำนวนผู้ใช้ทั้งหมด
        } catch (err) {
            console.error("Error fetching users:", err.message);
        } finally {
            setLoading(false); // จบโหลดข้อมูล
        }
    }, [currentPage, pageSize]); // เพิ่ม dependencies

    // ฟังก์ชันสำหรับเปลี่ยนหน้า
    const handlePageChange = (event, newPage) => {
        setCurrentPage(newPage);
    };

    // ฟังก์ชันสำหรับเปลี่ยนจำนวนรายการต่อหน้า
    const handleRowsPerPageChange = (event) => {
        setPageSize(parseInt(event.target.value, 10));
        setCurrentPage(0); // รีเซ็ตหน้า
    };

    // ฟังก์ชันค้นหา
    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
        setCurrentPage(0); // รีเซ็ตหน้าเมื่อมีการค้นหา
    };

    // กรองข้อมูลในตารางโดยใช้ searchTerm
    const filteredUsers = users.filter((user) => {
        // ตรวจสอบว่า searchTerm ไม่ว่าง และมีการ trim ค่า searchTerm
        const term = searchTerm.trim().toLowerCase();
        if (term === "") {
            return true; // ถ้า searchTerm ว่าง แสดงผู้ใช้ทั้งหมด
        }
        return (
            user.username.toLowerCase().includes(term) ||
            user.first_name.toLowerCase().includes(term) ||
            user.last_name.toLowerCase().includes(term)
        );
    });
    
    // ดึงข้อมูลเมื่อมีการเปลี่ยนแปลงของ pagination หรือ searchTerm
    useEffect(() => {
        fetchUserAll();
    }, [fetchUserAll]);


    //------------------------------------------------------------------------------------------------
    // ใช้ useEffect ดึงข้อมูลผู้ใช้เมื่อเปิด Dialog
    useEffect(() => {
        if (isDialogOpen) {
            fetchUserData();
        }
    }, [isDialogOpen]);

    // ใช้ useEffect ดึงข้อมูลเมื่อเปิด User Details Dialog
    useEffect(() => {
        if (isUserDetailsDialogOpen) {
            fetchUserData(); // เรียกตอนเปิด Dialog
        }
    }, [isUserDetailsDialogOpen]);


    //================================================================================================
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
                    onClick={toggleCreateDialog}
                >
                    Create account
                </button>
                
                <TextField
                    label="Search Users"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={searchTerm}
                    onChange={handleSearch}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Username</TableCell>
                                <TableCell>First Name</TableCell>
                                <TableCell>Last Name</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.username}</TableCell>
                                        <TableCell>{user.first_name}</TableCell>
                                        <TableCell>{user.last_name}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={() => toggleUpdateDialog(user.id, user.username, user.first_name, user.last_name)} // ส่งข้อมูลผู้ใช้ไปยังฟังก์ชัน
                                                style={{ marginRight: "10px" }}
                                            >
                                                Update
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={() => toggleChangeSomeonePasswordDialog(user.id, user.username)} // ส่ง user.id และ user.username
                                                style={{ marginRight: "10px" }}
                                            >
                                                Change Password
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="secondary"
                                                onClick={() => toggleDeleteDialog(user.id, user.username)} // ส่ง user.id และ user.username
                                            >
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={totalUsers}
                    rowsPerPage={pageSize}
                    page={currentPage}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                />
            </div>

            {/* PopUp User Details */}
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
                    <Button onClick={toggleChangePasswordYourselfDialog}>Change Password</Button> {/* เปิด Pop-Up Change Password */}
                    <Button onClick={handleLogout}>Logout</Button> {/* Logout */}
                </DialogActions>
            </Dialog>

            {/* Pop-Up Create Account */}
            <Dialog open={isCreateDialogOpen} onClose={toggleCreateDialog}>
                <DialogTitle>Create New Account</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Username"
                        fullWidth
                        margin="dense"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    />
                    <TextField
                        label="First Name"
                        fullWidth
                        margin="dense"
                        value={newUser.firstName}
                        onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    />
                    <TextField
                        label="Last Name"
                        fullWidth
                        margin="dense"
                        value={newUser.lastName}
                        onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    />
                    <TextField
                        label="Password"
                        type="password"
                        fullWidth
                        margin="dense"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                    {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
                    {successMessage && <p style={{ color: "green", marginTop: "10px" }}>{successMessage}</p>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCreateAccount} color="primary">Submit</Button>
                    <Button onClick={toggleCreateDialog}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* Pop-Up Change Password Yourself */}
            <Dialog open={isChangePasswordYourselfDialogOpen} onClose={toggleChangePasswordYourselfDialog}>
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
                    <Button onClick={handleChangePasswordYourself}>Submit</Button>
                    <Button onClick={toggleChangePasswordYourselfDialog}>Back</Button>
                </DialogActions>
            </Dialog>  

            {/* Pop-Up Change Someone Password */}
            <Dialog open={isChangeSomeonePasswordDialogOpen} onClose={toggleChangeSomeonePasswordDialog}>
                <DialogTitle>
                    The user password you changed is <strong>{targetUserName}</strong>
                </DialogTitle>
                <DialogContent>
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
                    <TextField
                        label="Confirm New Password"
                        type={showPassword.confirm ? "text" : "password"}
                        fullWidth
                        margin="dense"
                        value={passwordData.confirmNewPassword || ""}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => handleTogglePassword("confirm")}>
                                        {showPassword.confirm ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
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
                    <Button onClick={handleChangeSomeonePassword}>Submit</Button>
                    <Button onClick={toggleChangeSomeonePasswordDialog}>Cancel</Button>
                </DialogActions>
            </Dialog>
                      
            {/* Pop-Up Update User */}
            <Dialog open={isUpdateDialogOpen} onClose={toggleUpdateDialog}>
                <DialogTitle>
                    The user you updated is <strong>{targetUserName}</strong>
                </DialogTitle>
                <DialogContent>
                    <TextField
                        label="Username"
                        fullWidth
                        margin="dense"
                        value={updateData.username} 
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
                    <Button onClick={toggleUpdateDialog}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* Pop-Up Delete User */}
            <Dialog open={isDeleteDialogOpen} onClose={toggleDeleteDialog}>
                <DialogTitle>
                    Are you sure you want to delete the user <strong>{targetUserName}</strong>?
                </DialogTitle>
                <DialogContent>
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
                    <Button onClick={handleDeleteUser}>Delete</Button>
                    <Button onClick={toggleDeleteDialog}>Cancel</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default AdminHome;