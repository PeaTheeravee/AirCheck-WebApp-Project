import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SearchIcon from "@mui/icons-material/Search";
import {
    Card,
    CardContent,
    Typography,
    Grid,
    TextField,
    InputAdornment,
    TablePagination,
} from "@mui/material";
import "./home.css";

const Home = () => {
    const navigate = useNavigate();
    const [devices, setDevices] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(8);
    const [totalDevices, setTotalDevices] = useState(0);
    const [loading, setLoading] = useState(false);

    // ฟังก์ชันดึงข้อมูลอุปกรณ์
    const fetchDevices = useCallback(async () => {
        setLoading(true); // เริ่มโหลดข้อมูล
        try {
            const response = await fetch(`http://localhost:8000/showdetect/all?page=${currentPage + 1}&size=${pageSize}`, {
                method: "GET",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to fetch showdetect data.");
            }

            const data = await response.json();
            setDevices(data.shows);
            setTotalDevices(data.total);
        } catch (err) {
            console.error("Error fetching showdetect data:", err.message);
        } finally {
            setLoading(false); // จบโหลดข้อมูล
        }
    }, [currentPage, pageSize]);

    //------------------------------------------------------------------------------------------------

    // ฟังก์ชันสำหรับเปลี่ยนหน้า สำหรับ อุปกรณ์
    const handlePageChange = (event, newPage) => {
        setCurrentPage(newPage);
    };

    // ฟังก์ชันสำหรับเปลี่ยนจำนวนรายการต่อหน้า
    const handleRowsPerPageChange = (event) => {
        setPageSize(parseInt(event.target.value, 10));
        setCurrentPage(0); // รีเซ็ตหน้า
    };

    // ฟังก์ชันค้นหา สำหรับ อุปกรณ์
    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
        setCurrentPage(0); // รีเซ็ตหน้าเมื่อมีการค้นหา
    };

    // กรองข้อมูลในตารางอุปกรณ์โดยใช้ searchTerm
    const filteredDevices = devices.filter((device) => {
        // ตรวจสอบว่า searchTerm ไม่ว่าง และมีการ trim ค่า searchTerm
        const term = searchTerm.trim().toLowerCase();
        if (term === "") {
            return true; // ถ้า searchTerm ว่าง แสดงอุปกรณ์ทั้งหมด
        }
        return(
            device.device_name.toLowerCase().includes(term) || 
            device.location.toLowerCase().includes(term)
        );
    });

    //------------------------------------------------------------------------------------------------

    // useEffect → ดึงข้อมูลครั้งแรก + ดึงข้อมูลอุปกรณ์ทุกๆ 1 นาที
    useEffect(() => {
        fetchDevices();
        const interval = setInterval(fetchDevices, 60000);
        return () => clearInterval(interval);
    }, [fetchDevices]);

    return (
        <div>
            {/* Header */}
            <header className="home-header">
                <h1>Welcome to My Application!</h1>
                <button className="profile-icon" onClick={() => navigate("/login")}>
                    <AccountCircleIcon fontSize="large" />
                </button>
            </header>

            {/* 🔍 ค้นหาอุปกรณ์ */}
            <TextField
                label="Search Devices"
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

            {/* แสดงข้อมูลอุปกรณ์ */}
            <Grid container spacing={2} style={{ padding: "20px" }}>
                {loading ? (
                    <Typography variant="h6" style={{ margin: "20px" }}>Loading devices...</Typography>
                ) : filteredDevices.length > 0 ? (
                    filteredDevices.map((device) => (
                        <Grid item xs={12} sm={6} md={3} key={device.api_key}>
                            <Card variant="outlined" sx={{ maxWidth: "350px", width: "100%" }}>
                                <CardContent>
                                    <Typography variant="h6">{device.device_name}</Typography>
                                    <Typography variant="body2" color="textSecondary">📍 {device.location}</Typography>
                                    <Typography variant="body2"><strong>ค่า PM 2.5 ที่วัดได้:</strong> {device.pm2_5} µg/m³</Typography>
                                    <Typography variant="body2"><strong>ค่า PM 10 ที่วัดได้:</strong> {device.pm10} µg/m³</Typography>
                                    <Typography variant="body2"><strong>ค่า CO2 ที่วัดได้:</strong> {device.co2} ppm</Typography>
                                    <Typography variant="body2"><strong>ค่า TVOC ที่วัดได้:</strong> {device.tvoc} ppb</Typography>
                                    <Typography variant="body2"><strong>ค่า อุณหภูมิ ที่วัดได้:</strong> {device.temperature}°C</Typography>
                                    <Typography variant="body2"><strong>ค่า ความชื้นสัมพัทธ์ ที่วัดได้:</strong> {device.humidity}%</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                ) : (
                    <Typography variant="h6" style={{ margin: "20px" }}>No device data available.</Typography>
                )}
            </Grid>
            <TablePagination
                rowsPerPageOptions={[8, 12, 16]}
                component="div"
                count={totalDevices} 
                rowsPerPage={pageSize}
                page={currentPage}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />
        </div>
    );
};

export default Home;