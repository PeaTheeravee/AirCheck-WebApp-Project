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
import "./decorate.css";

const HStyle = {
    fontSize: "25px", 
}; 
const TStyle = {
    fontSize: "20px", 
};

const AdminHome = () => {
    const navigate = useNavigate();
    const [isDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("devices"); // ควบคุมตารางที่แสดง

    const [role, setRole] = useState("");
    const [userData, setUserData] = useState(null);
    const [users, setUsers] = useState([]);
    const [devices, setDevices] = useState([]);

    const [targetUserId, setTargetUserId] = useState(null); // เก็บ userId ใน state
    const [targetUserName, setTargetUserName] = useState(""); // แสดงชื่อ ใน Pop-Up
    const [targetApiKey, setTargetApiKey] = useState(null); // เก็บ ApiKey ใน state
    const [targetDeviceName, setTargetDeviceName] = useState(""); // แสดงชื่ออุปกรณ์ ใน Pop-Up

    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState(""); 


    const [newUser, setNewUser] = useState({username: "",firstName: "",lastName: "",password: ""});
    const [updateData, setUpdateData] = useState({username: "",firstName: "",lastName: "",});
    const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "" });
    //------------------------------------------------------------------------------------------------
    const [updateDeviceData, setUpdateDeviceData] = useState({ device_name: "", location: "", device_settime: "" });
    const [newDeviceData, setNewDeviceData] = useState({ device_name: "", location: ""});
    const [monthsToDelete, setMonthsToDelete] = useState(1);

    const [showPassword, setShowPassword] = useState({ current: false, new: false });
    const [isUserDetailsDialogOpen, setIsUserDetailsDialogOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
    const [isChangePasswordYourselfDialogOpen, setIsChangePasswordYourselfDialogOpen] = useState(false);
    const [isChangeSomeonePasswordDialogOpen, setIsChangeSomeonePasswordDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    //------------------------------------------------------------------------------------------------
    const [timestamps, setTimestamps] = useState([]);
    const [isCreateDeviceDialogOpen, setIsCreateDeviceDialogOpen] = useState(false);
    const [isUpdateDeviceDialogOpen, setIsUpdateDeviceDialogOpen] = useState(false);
    const [isDeleteDeviceDialogOpen, setIsDeleteDeviceDialogOpen] = useState(false);
    const [isDeleteDataDialogOpen, setIsDeleteDataDialogOpen] = useState(false);

    //สำหรับ ตารางผู้ใช้
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(8);
    const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(false);

    //สำหรับ ตารางอุปกรณ์
    const [deviceSearchTerm, setDeviceSearchTerm] = useState("");
    const [devicePage, setDevicePage] = useState(0);
    const [deviceSize, setDeviceSize] = useState(8);
    const [totalDevices, setTotalDevices] = useState(0);
    const [deviceLoading, setDeviceLoading] = useState(false);

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
    //------------------------------------------------------------------------------------------------
    const toggleCreateDeviceDialog = () => {
        setNewDeviceData({ device_name: "", location: "" }); 
        setIsCreateDeviceDialogOpen(!isCreateDeviceDialogOpen);
    };   
    
    const toggleUpdateDeviceDialog = (apiKey = null, device_name = "", location = "", device_settime = "") => {
        if (apiKey) {
            setUpdateDeviceData({ device_name, location, device_settime });
            setTargetApiKey(apiKey); // เก็บ ApiKey ใน state
            setTargetDeviceName(device_name);
        }
        setIsUpdateDeviceDialogOpen(!isUpdateDeviceDialogOpen);
    };

    const toggleDeleteDeviceDialog = (apiKey = null, device_name = "") => {
        setTargetApiKey(apiKey); // เก็บ ApiKey ใน state
        setTargetDeviceName(device_name);
        setIsDeleteDeviceDialogOpen(!isDeleteDeviceDialogOpen);
    };

    const toggleDeleteDataDialog = (apiKey = null, device_name = "") => {
        setMonthsToDelete(1);
        setTargetApiKey(apiKey); // เก็บ ApiKey ใน state
        setTargetDeviceName(device_name);
        setIsDeleteDataDialogOpen(!isDeleteDataDialogOpen);
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
            setRole(data.role);
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
                    password: newUser.password,
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

            navigate("/");
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(""), 2000);
        }
    };

    // ฟังก์ชันดึงข้อมูลผู้ใช้
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

    // ฟังก์ชันดึงข้อมูลอุปกรณ์
    const fetchDevices = useCallback(async () => {
        setDeviceLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/devices/all?page=${devicePage + 1}&size=${deviceSize}`, {
                method: "GET",
                credentials: "include",
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to fetch devices.");
            }
    
            const data = await response.json();
            setDevices(data.devices);
            setTotalDevices(data.total);
        } catch (err) {
            console.error("Error fetching devices:", err.message);
        } finally {
            setDeviceLoading(false);
        }
    }, [devicePage, deviceSize]);

    // ฟังก์ชันสร้างอุปกรณ์
    const handleCreateDevice = async () => {
        if (!newDeviceData.device_name.trim() || !newDeviceData.location.trim()) {
            setError("Device Name and Location are required!");
            setTimeout(() => setError(""), 2000);
            return;
        }
            
        try {
            const response = await fetch("http://localhost:8000/devices/create", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    device_name: newDeviceData.device_name,
                    location: newDeviceData.location,
                }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to create device.");
            }
    
            setSuccessMessage("Device created successfully!");
            await fetchDevices(); // โหลดข้อมูลอุปกรณ์ใหม่
            setTimeout(() => {
                setSuccessMessage("");
                toggleCreateDeviceDialog(); // ปิด Pop-Up
            }, 2000);
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(""), 2000);
        }
    };    

    // ฟังก์ชันอัปเดตข้อมูลอุปกรณ์
    const handleUpdateDevice = async () => {
        if (!updateDeviceData.device_name.trim() || !updateDeviceData.location.trim()) {
            setError("Device Name and Location are required!");
            setTimeout(() => setError(""), 2000);
            return;
        }
        
        if (updateDeviceData.device_settime < 1) {
            setError("Set Time must be at least 1 minute!");
            setTimeout(() => setError(""), 2000);
            return;
        }         
        
        try {
            const response = await fetch(`http://localhost:8000/devices/update/${targetApiKey}`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    device_name: updateDeviceData.device_name,
                    location: updateDeviceData.location,
                    device_settime: updateDeviceData.device_settime,
                }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to update device.");
            }
    
            setSuccessMessage("Device updated successfully!");
            await fetchDevices(); // โหลดข้อมูลอุปกรณ์ใหม่
            setTimeout(() => {
                setSuccessMessage("");
                toggleUpdateDeviceDialog(); // ปิด Pop-Up
            }, 2000);
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(""), 2000);
        }
    };

    // ฟังก์ชันลบอุปกรณ์
    const handleDeleteDevice = async () => {
        try {
            const response = await fetch(`http://localhost:8000/devices/delete/${targetApiKey}`, {
                method: "DELETE",
                credentials: "include",
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to delete device.");
            }
    
            setSuccessMessage("Device deleted successfully!");
            await fetchDevices(); // โหลดข้อมูลอุปกรณ์ใหม่
            setTimeout(() => {
                setSuccessMessage("");
                toggleDeleteDeviceDialog(); // ปิด Pop-Up
            }, 2000);
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(""), 2000);
        }
    };    

    // ฟังก์ชันลบข้อมูลอุปกรณ์
    const handleDeleteDataByMonth = async () => {
        if (monthsToDelete < 1) {
            setError("Months to delete must be at least 1.");
            setTimeout(() => setError(""), 2000);
            return;
        }
    
        try {
            const response = await fetch(`http://localhost:8000/devices/delete_by_month/${targetApiKey}?months_to_delete=${monthsToDelete}`, {
                method: "DELETE",
                credentials: "include",
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to delete data.");
            }
    
            setSuccessMessage(`Deleted ${monthsToDelete} months of data successfully.`);
            setTimeout(() => {
                setSuccessMessage("");
                toggleDeleteDataDialog(); // ปิด Pop-Up
            }, 2000);
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(""), 2000);
        }
    };

    // ฟังก์ชันดึงข้อมูล timestamps ตาม API Key
    const fetchTimestamps = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:8000/devices/timestamps/${targetApiKey}`, {
                method: "GET",
                credentials: "include",
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to fetch timestamps.");
            }
    
            const data = await response.json();
            setTimestamps(data);
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(""), 2000);
        }
    }, [targetApiKey]);
    
    //------------------------------------------------------------------------------------------------

    // ฟังก์ชันสำหรับเปลี่ยนหน้า
    // สำหรับ ตารางผู้ใช้
    const handlePageChange = (event, newPage) => {
        setCurrentPage(newPage);
    };
    // สำหรับ ตารางอุปกรณ์
    const handleDevicePageChange = (event, newPage) => {
        setDevicePage(newPage);
    };

    // ฟังก์ชันสำหรับเปลี่ยนจำนวนรายการต่อหน้า
    // สำหรับ ตารางผู้ใช้
    const handleRowsPerPageChange = (event) => {
        setPageSize(parseInt(event.target.value, 10));
        setCurrentPage(0); // รีเซ็ตหน้า
    };
    // สำหรับ ตารางอุปกรณ์
    const handleDeviceRowsPerPageChange = (event) => {
        setDeviceSize(parseInt(event.target.value, 10));
        setDevicePage(0);
    };

    // ฟังก์ชันค้นหา
    // สำหรับ ตารางผู้ใช้
    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
        setCurrentPage(0); // รีเซ็ตหน้าเมื่อมีการค้นหา
    };
    // สำหรับ ตารางอุปกรณ์
    const handleDeviceSearch = (event) => {
        setDeviceSearchTerm(event.target.value);
        setDevicePage(0);
    };

    // กรองข้อมูลในตารางผู้ใช้โดยใช้ searchTerm
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

    // กรองข้อมูลในตารางอุปกรณ์โดยใช้ searchTerm
    const filteredDevices = devices.filter((device) => {
        // ตรวจสอบว่า searchTerm ไม่ว่าง และมีการ trim ค่า searchTerm
        const term = deviceSearchTerm.trim().toLowerCase();
        if (term === "") {
            return true; // ถ้า searchTerm ว่าง แสดงอุปกรณ์ทั้งหมด
        }
        return(
            device.device_name.toLowerCase().includes(term) || 
            device.location.toLowerCase().includes(term)
        );
    });

    //------------------------------------------------------------------------------------------------

    // ดึงข้อมูลอุปกรณ์ทุกๆ 1 นาที
    useEffect(() => {
        const interval = setInterval(fetchDevices, 60000);
        return () => clearInterval(interval); 
    }, [fetchDevices]);

    // ดึงข้อมูลผู้ใช้ตอนโหลดหน้า
    useEffect(() => {
        fetchUserData();
    }, []);
    
    useEffect(() => {
        if (activeTab === "users") {
            fetchUserAll();
        } else {
            fetchDevices();
        }
    }, [activeTab, fetchUserAll, fetchDevices]);

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

    // เรียก API เมื่อ Pop-Up เปิดขึ้น
    useEffect(() => {
        if (isDeleteDataDialogOpen && targetApiKey) {
            setTimestamps([]); // ✅ รีเซ็ต timestamps ก่อนโหลดใหม่
            fetchTimestamps();
        }
    }, [isDeleteDataDialogOpen, targetApiKey, fetchTimestamps]);

    //================================================================================================
    
    return (
        <div>
            {/* Header */}
            <header className="header">
                <h1 className="title" sx={{ marginBottom: "30px" }}>Admin Home</h1>
                <button className="profile-icon" onClick={setIsUserDetailsDialogOpen}>
                    <AccountCircleIcon fontSize="large" />
                </button>
            </header>

            {/* Content/Main */}
            <div style={{ padding: "20px" }}>
                {/* แสดงเฉพาะ superadmin */}
                {role === "superadmin" && (
                    <div style={{ display: "flex", marginBottom: "20px"}}>
                        <Button
                            variant={activeTab === "devices" ? "contained" : "outlined"}
                            onClick={() => setActiveTab("devices")}
                            sx={{ fontSize: "18px", padding: "8px 16px", marginRight: "20px" }}
                        >
                            Device Management
                        </Button>
                        <Button
                            variant={activeTab === "users" ? "contained" : "outlined"}
                            onClick={() => setActiveTab("users")}
                            sx={{ fontSize: "18px", padding: "8px 16px"}}
                        >
                            User Management
                        </Button>
                    </div>
                )}

                {/* ตาราง User */}
                {activeTab === "users" && (
                    <>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={toggleCreateDialog}
                            style={{ marginBottom: "10px" }}
                            sx={{ fontSize: "18px", padding: "8px 16px"}}
                        >
                            Create Account
                        </Button>

                        <TextField
                            label="Search Users"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={searchTerm}
                            onChange={handleSearch}
                            sx={{ marginTop: 3, marginBottom: 3, }}
                            InputLabelProps={{
                                style: { fontSize: "25px" }, 
                            }}
                            InputProps={{
                                style: { fontSize: "25px" },
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
                                        <TableCell style={HStyle}>User ID</TableCell>
                                        <TableCell style={HStyle}>Username</TableCell>
                                        <TableCell style={HStyle}>First Name</TableCell>
                                        <TableCell style={HStyle}>Last Name</TableCell>
                                        <TableCell style={HStyle}>Actions</TableCell>
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
                                                <TableCell style={TStyle}>{user.id}</TableCell>
                                                <TableCell style={TStyle}>{user.username}</TableCell>
                                                <TableCell style={TStyle}>{user.first_name}</TableCell>
                                                <TableCell style={TStyle}>{user.last_name}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="contained"
                                                        color="warning"
                                                        onClick={() => toggleUpdateDialog(user.id, user.username, user.first_name, user.last_name)}
                                                        style={{ marginRight: "20px" }}
                                                        sx={{ fontSize: "18px", padding: "8px 16px"}}
                                                    >
                                                        Update
                                                    </Button>

                                                    {/* ซ่อนปุ่ม Change Password ถ้า user เป็น superadmin */}
                                                    {user.role !== "superadmin" && (
                                                        <Button
                                                            variant="contained"
                                                            color="warning"
                                                            onClick={() => toggleChangeSomeonePasswordDialog(user.id, user.username)}
                                                            style={{ marginRight: "20px" }}
                                                            sx={{ fontSize: "18px", padding: "8px 16px"}}
                                                        >
                                                            Change Password
                                                        </Button>
                                                    )}

                                                    {/* ซ่อนปุ่ม Delete ถ้า user เป็น superadmin */}
                                                    {user.role !== "superadmin" && (
                                                        <Button
                                                            variant="contained"
                                                            color="error"
                                                            onClick={() => toggleDeleteDialog(user.id, user.username)}
                                                            sx={{ fontSize: "18px", padding: "8px 16px"}}
                                                        >
                                                            Delete
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell style={TStyle} colSpan={5} align="center">
                                                No users found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[8, 12, 16]}
                            component="div"
                            count={totalUsers}
                            rowsPerPage={pageSize}
                            page={currentPage}
                            onPageChange={handlePageChange}
                            onRowsPerPageChange={handleRowsPerPageChange}
                        />
                    </>
                )}

                {/* ตาราง Device */}
                {activeTab === "devices" && (
                    <>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={toggleCreateDeviceDialog}
                            style={{ marginBottom: "10px" }}
                            sx={{ fontSize: "18px", padding: "8px 16px"}}
                        >
                            Create Device
                        </Button>

                        <TextField
                            label="Search Devices"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={deviceSearchTerm}
                            onChange={handleDeviceSearch}
                            sx={{ marginTop: 3, marginBottom: 3, }}
                            InputLabelProps={{
                                style: { fontSize: "25px" }, 
                            }}
                            InputProps={{
                                style: { fontSize: "25px" },
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
                                        <TableCell style={HStyle}>Device ID</TableCell>
                                        <TableCell style={HStyle}>Device Name</TableCell>
                                        <TableCell style={HStyle}>Location</TableCell>
                                        <TableCell style={HStyle}>Status</TableCell>
                                        <TableCell style={HStyle}>Set Time (min)</TableCell>
                                        <TableCell style={HStyle}>Added By</TableCell>
                                        <TableCell style={HStyle}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {deviceLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredDevices.length > 0 ? (
                                        filteredDevices.map((device) => (
                                            <TableRow key={device.api_key}>
                                                <TableCell style={TStyle}>
                                                    {device.api_key}
                                                    <IconButton 
                                                        onClick={() => navigator.clipboard.writeText(device.api_key)}
                                                    >
                                                        📋
                                                    </IconButton>                                               
                                                </TableCell>
                                                <TableCell style={TStyle}>{device.device_name}</TableCell>
                                                <TableCell style={TStyle}>{device.location}</TableCell>
                                                <TableCell style={TStyle}>{device.device_status}</TableCell>
                                                <TableCell style={TStyle}>{device.device_settime}</TableCell>
                                                <TableCell style={TStyle}>{device.user_id}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="contained"
                                                        color="warning"
                                                        onClick={() => toggleUpdateDeviceDialog(device.api_key, device.device_name, device.location, device.device_settime)}
                                                        style={{ marginRight: "10px" }}
                                                        sx={{ fontSize: "18px", padding: "8px 16px"}}
                                                    >
                                                        Update
                                                    </Button>
                                                    
                                                    <Button
                                                        variant="contained"
                                                        color="error"
                                                        onClick={() => toggleDeleteDeviceDialog(device.api_key, device.device_name)}
                                                        style={{ marginRight: "10px" }}
                                                        sx={{ fontSize: "18px", padding: "8px 16px"}}
                                                    >
                                                        Delete
                                                    </Button>

                                                    <Button
                                                        variant="contained"
                                                        color="error"
                                                        onClick={() => toggleDeleteDataDialog(device.api_key, device.device_name)}
                                                        style={{ marginRight: "10px" }}
                                                        sx={{ fontSize: "18px", padding: "8px 16px"}}
                                                    >
                                                        Delete Data
                                                    </Button>

                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell style={TStyle} colSpan={7} align="center">
                                                No devices found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TablePagination
                            rowsPerPageOptions={[8, 12, 16]}
                            component="div"
                            count={totalDevices}
                            rowsPerPage={deviceSize}
                            page={devicePage}
                            onPageChange={handleDevicePageChange}
                            onRowsPerPageChange={handleDeviceRowsPerPageChange}
                        />
                    </>
                )}
            </div>

            {/* PopUp User Details */}
            <Dialog open={isUserDetailsDialogOpen} onClose={toggleUserDetailsDialog}>
                <DialogTitle style={HStyle}>
                    User Details
                    <Button onClick={toggleUserDetailsDialog} style={{ float: "right" }}>X</Button>
                </DialogTitle>
                <DialogContent>
                    {userData ? (
                        <>
                            <p style={TStyle}>Username: {userData.username}</p>
                            <p style={TStyle}>First Name: {userData.first_name}</p>
                            <p style={TStyle}>Last Name: {userData.last_name}</p>
                        </>
                    ) : (
                        <p>Loading...</p>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={toggleChangePasswordYourselfDialog} sx={{ fontSize: "18px" }}>Change Password</Button> {/* เปิด Pop-Up Change Password */}
                    <Button onClick={handleLogout} sx={{ fontSize: "18px" }}>Logout</Button> {/* Logout */}
                </DialogActions>
            </Dialog>

            {/* Pop-Up Create Account */}
            <Dialog open={isCreateDialogOpen} onClose={toggleCreateDialog}>
                <DialogTitle style={HStyle}>
                    Create New Account
                </DialogTitle>
                <DialogContent>
                    <TextField
                        label="Username"
                        fullWidth
                        margin="dense"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        InputProps={{ style: { fontSize: "20px" } }} 
                        InputLabelProps={{ style: { fontSize: "20px" } }} 
                    />
                    <TextField
                        label="First Name"
                        fullWidth
                        margin="dense"
                        value={newUser.firstName}
                        onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                        InputProps={{ style: { fontSize: "20px" } }} 
                        InputLabelProps={{ style: { fontSize: "20px" } }} 
                    />
                    <TextField
                        label="Last Name"
                        fullWidth
                        margin="dense"
                        value={newUser.lastName}
                        onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                        InputProps={{ style: { fontSize: "20px" } }} 
                        InputLabelProps={{ style: { fontSize: "20px" } }} 
                    />
                    <TextField
                        label="Password"
                        type="password"
                        fullWidth
                        margin="dense"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        InputProps={{ style: { fontSize: "20px" } }} 
                        InputLabelProps={{ style: { fontSize: "20px" } }} 
                    />
                    {error && (
                        <p style={{ color: "red", marginTop: "10px" }}>
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
                    <Button onClick={handleCreateAccount} sx={{ fontSize: "18px" }}>Submit</Button>
                    <Button onClick={toggleCreateDialog} sx={{ fontSize: "18px" }}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* Pop-Up Change Password Yourself */}
            <Dialog open={isChangePasswordYourselfDialogOpen} onClose={toggleChangePasswordYourselfDialog}>
                <DialogTitle style={HStyle}>
                    Change Password
                </DialogTitle>
                <DialogContent>
                    <TextField
                        label="Current Password"
                        type={showPassword.current ? "text" : "password"}
                        fullWidth
                        margin="dense"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        InputProps={{
                            style: { fontSize: "20px" },
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => handleTogglePassword("current")}>
                                        {showPassword.current ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        InputLabelProps={{ style: { fontSize: "20px" } }}
                    />
                    <TextField
                        label="New Password"
                        type={showPassword.new ? "text" : "password"}
                        fullWidth
                        margin="dense"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        InputProps={{
                            style: { fontSize: "20px" },
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => handleTogglePassword("new")}>
                                        {showPassword.new ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        InputLabelProps={{ style: { fontSize: "20px" } }}
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
                    <Button onClick={handleChangePasswordYourself} sx={{ fontSize: "18px" }}>Submit</Button>
                    <Button onClick={toggleChangePasswordYourselfDialog} sx={{ fontSize: "18px" }}>Back</Button>
                </DialogActions>
            </Dialog>  

            {/* Pop-Up Change Someone Password */}
            <Dialog open={isChangeSomeonePasswordDialogOpen} onClose={toggleChangeSomeonePasswordDialog}>
                <DialogTitle style={HStyle}>
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
                            style: { fontSize: "20px" },
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => handleTogglePassword("new")}>
                                        {showPassword.new ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        InputLabelProps={{ style: { fontSize: "20px" } }}
                    />
                    <TextField
                        label="Confirm New Password"
                        type={showPassword.confirm ? "text" : "password"}
                        fullWidth
                        margin="dense"
                        value={passwordData.confirmNewPassword || ""}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                        InputProps={{
                            style: { fontSize: "20px" },
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => handleTogglePassword("confirm")}>
                                        {showPassword.confirm ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        InputLabelProps={{ style: { fontSize: "20px" } }}
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
                    <Button onClick={handleChangeSomeonePassword} sx={{ fontSize: "18px" }}>Submit</Button>
                    <Button onClick={toggleChangeSomeonePasswordDialog} sx={{ fontSize: "18px" }}>Cancel</Button>
                </DialogActions>
            </Dialog>
                      
            {/* Pop-Up Update User */}
            <Dialog open={isUpdateDialogOpen} onClose={toggleUpdateDialog}>
                <DialogTitle style={HStyle}>
                    The user you updated is <strong>{targetUserName}</strong>
                </DialogTitle>
                <DialogContent>
                    <TextField
                        label="Username"
                        fullWidth
                        margin="dense"
                        value={updateData.username} 
                        onChange={(e) => setUpdateData({ ...updateData, username: e.target.value })}
                        InputProps={{ style: { fontSize: "20px" } }} 
                        InputLabelProps={{ style: { fontSize: "20px" } }} 
                    />
                    <TextField
                        label="First Name"
                        fullWidth
                        margin="dense"
                        value={updateData.firstName}
                        onChange={(e) => setUpdateData({ ...updateData, firstName: e.target.value })}
                        InputProps={{ style: { fontSize: "20px" } }} 
                        InputLabelProps={{ style: { fontSize: "20px" } }} 
                    />
                    <TextField
                        label="Last Name"
                        fullWidth
                        margin="dense"
                        value={updateData.lastName}
                        onChange={(e) => setUpdateData({ ...updateData, lastName: e.target.value })}
                        InputProps={{ style: { fontSize: "20px" } }} 
                        InputLabelProps={{ style: { fontSize: "20px" } }} 
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
                    <Button onClick={handleUpdateUser} sx={{ fontSize: "18px" }}>Submit</Button>
                    <Button onClick={toggleUpdateDialog} sx={{ fontSize: "18px" }}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* Pop-Up Delete User */}
            <Dialog open={isDeleteDialogOpen} onClose={toggleDeleteDialog}>
                <DialogTitle style={HStyle}>
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
                    <Button onClick={handleDeleteUser} sx={{ fontSize: "18px" }}>Delete</Button>
                    <Button onClick={toggleDeleteDialog} sx={{ fontSize: "18px" }}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* Pop-Up Create Device */}
            <Dialog open={isCreateDeviceDialogOpen} onClose={toggleCreateDeviceDialog}>
                <DialogTitle style={HStyle}>
                    Create New Device
                </DialogTitle>
                <DialogContent>
                    <TextField
                        label="Device Name"
                        fullWidth
                        margin="dense"
                        value={newDeviceData.device_name}
                        onChange={(e) => setNewDeviceData({ ...newDeviceData, device_name: e.target.value })}
                        InputProps={{ style: { fontSize: "20px" } }} 
                        InputLabelProps={{ style: { fontSize: "20px" } }} 
                    />
                    <TextField
                        label="Location"
                        fullWidth
                        margin="dense"
                        value={newDeviceData.location}
                        onChange={(e) => setNewDeviceData({ ...newDeviceData, location: e.target.value })}
                        InputProps={{ style: { fontSize: "20px" } }} 
                        InputLabelProps={{ style: { fontSize: "20px" } }} 
                    />
                    {error && (
                        <p style={{ color: "red", marginTop: "10px" }}>
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
                    <Button onClick={handleCreateDevice} sx={{ fontSize: "18px" }}>Submit</Button>
                    <Button onClick={toggleCreateDeviceDialog} sx={{ fontSize: "18px" }}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* Pop-Up Update Device */}
            <Dialog open={isUpdateDeviceDialogOpen} onClose={toggleUpdateDeviceDialog}>
                <DialogTitle style={HStyle}>
                    The device you updated is <strong>{targetDeviceName}</strong>
                </DialogTitle>
                <DialogContent>
                    <TextField
                        label="Device Name"
                        fullWidth
                        margin="dense"
                        value={updateDeviceData.device_name}
                        onChange={(e) => setUpdateDeviceData({ ...updateDeviceData, device_name: e.target.value })}
                        InputProps={{ style: { fontSize: "20px" } }} 
                        InputLabelProps={{ style: { fontSize: "20px" } }} 
                    />
                    <TextField
                        label="Location"
                        fullWidth
                        margin="dense"
                        value={updateDeviceData.location}
                        onChange={(e) => setUpdateDeviceData({ ...updateDeviceData, location: e.target.value })}
                        InputProps={{ style: { fontSize: "20px" } }} 
                        InputLabelProps={{ style: { fontSize: "20px" } }} 
                    />
                    <TextField
                        label="Set Time (minutes)"
                        type="number"
                        fullWidth
                        margin="dense"
                        value={updateDeviceData.device_settime}
                        onChange={(e) => {
                            const value = parseInt(e.target.value, 10);
                            setUpdateDeviceData({ 
                                ...updateDeviceData, 
                                device_settime: value < 1 ? 1 : value  // ป้องกันค่าต่ำกว่า 1
                            });
                        }}
                        InputProps={{ style: { fontSize: "20px" } }} 
                        InputLabelProps={{ style: { fontSize: "20px" } }} 
                    />
                    {error && ( 
                        <p style={{ color: "red", marginTop: "10px" }}>
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
                    <Button onClick={handleUpdateDevice} sx={{ fontSize: "18px" }}>Submit</Button>
                    <Button onClick={toggleUpdateDeviceDialog} sx={{ fontSize: "18px" }}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* Pop-Up Delete Device */}
            <Dialog open={isDeleteDeviceDialogOpen} onClose={toggleDeleteDeviceDialog}>
                <DialogTitle style={HStyle}>
                    Are you sure you want to delete the device <strong>{targetDeviceName}</strong>?
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
                    <Button onClick={handleDeleteDevice} sx={{ fontSize: "18px" }}>Delete</Button>
                    <Button onClick={toggleDeleteDeviceDialog} sx={{ fontSize: "18px" }}>Cancel</Button>
                </DialogActions>
            </Dialog>
            
            {/* Pop-Up Delete Device Data */}
            <Dialog open={isDeleteDataDialogOpen} onClose={toggleDeleteDataDialog}>
                <DialogTitle style={HStyle}>
                    Are you sure you want to delete the device data <strong>{targetDeviceName}</strong>?
                </DialogTitle>
                <DialogContent>
                    {/* แสดง timestamps ที่ได้จาก API */}
                    {timestamps.length > 0 ? (
                        <div style={TStyle}>
                            <p style={{ marginTop: "0px"}}>Available Data:</p>
                            <ul>
                                {timestamps.reduce((acc, timestamp, index) => {
                                    if (index % 5 === 0) {
                                    acc.push([timestamp]);
                                    } else {
                                    acc[acc.length - 1].push(timestamp);
                                    }
                                    return acc;
                                }, []).map((pair, index) => (
                                    <div key={index}>{pair.join(' , ')}</div>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p style={TStyle}>No data found for this device.</p>
                    )}
                    <TextField
                        label="Months to Delete"
                        type="number"
                        fullWidth
                        margin="dense"
                        value={monthsToDelete}
                        onChange={(e) => {
                            const value = parseInt(e.target.value, 10);
                            setMonthsToDelete(value < 1 ? 1 : value); // ป้องกันค่าต่ำกว่า 1
                        }}
                        InputProps={{ style: { fontSize: "20px" } }} 
                        InputLabelProps={{ style: { fontSize: "20px" } }}
                        sx={{ marginTop: "30px" }} 
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
                    <Button onClick={handleDeleteDataByMonth} sx={{ fontSize: "18px" }}>Delete</Button>
                    <Button onClick={toggleDeleteDataDialog} sx={{ fontSize: "18px" }}>Cancel</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default AdminHome;