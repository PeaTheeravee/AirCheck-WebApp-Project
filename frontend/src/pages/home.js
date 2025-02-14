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
    const [showdetects, setShowdetects] = useState([]);
    const [devices, setDevices] = useState([]); 

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(8);
    const [totalShowdetects, setTotalShowdetects] = useState(0);
    const [loading, setLoading] = useState(false);

    // ✅ ฟังก์ชันดึงข้อมูล devices
    const fetchDevices = useCallback(async () => {
        try {
            const response = await fetch("http://localhost:8000/devices/all?page=1&size=100", {
                method: "GET",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to fetch devices.");
            }

            const data = await response.json();
            setDevices(data.devices); // ✅ เก็บ devices ทั้งหมด
        } catch (err) {
            console.error("Error fetching devices:", err.message);
        }
    }, []);

    const fetchShowdetects = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/showdetect/all?page=${currentPage + 1}&size=${pageSize}`, {
                method: "GET",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to fetch showdetect data.");
            }

            const data = await response.json();

            // ✅ แมตช์ api_key กับ devices เพื่อเพิ่ม device_name และ location
            const enrichedShowdetects = data.shows.map(showdetect => {
                const device = devices.find(dev => dev.api_key === showdetect.api_key);
                return {
                    ...showdetect,
                    device_name: device ? device.device_name : "Unknown Device",
                    location: device ? device.location : "Unknown Location",
                };
            });

            setShowdetects(enrichedShowdetects);
            setTotalShowdetects(data.total);
        } catch (err) {
            console.error("Error fetching showdetect data:", err.message);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, devices]);

    //------------------------------------------------------------------------------------------------

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

    // กรองข้อมูลในตารางอุปกรณ์โดยใช้ searchTerm
    const filteredShowdetects = showdetects.filter((showdetect) => {
        // ตรวจสอบว่า searchTerm ไม่ว่าง และมีการ trim ค่า searchTerm
        const term = searchTerm.trim().toLowerCase();
        if (term === "") {
            return true; // ถ้า searchTerm ว่าง แสดงผู้ใช้ทั้งหมด
        }
        return (
            showdetect.device_name.toLowerCase().includes(term) ||
            showdetect.location.toLowerCase().includes(term)
        );
    });

    //------------------------------------------------------------------------------------------------

    // ดึงข้อมูลอุปกรณ์ทุกๆ 1 นาที
    useEffect(() => {
        const fetchData = async () => {
            await fetchDevices();
            await fetchShowdetects();
        };
        fetchData();
        const interval = setInterval(fetchShowdetects, 60000);
        return () => clearInterval(interval);
    }, [fetchDevices, fetchShowdetects]);

    return (
        <div>
            {/* Header */}
            <header className="home-header">
                <h1>Welcome to My Application!</h1>
                <button className="profile-icon" onClick={() => navigate("/login")}>
                    <AccountCircleIcon fontSize="large" />
                </button>
            </header>

            {/* 🔍 ค้นหา showdetect */}
            <TextField
                label="Search Showdetect"
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

            {/* แสดงข้อมูล showdetect */}
            <Grid container spacing={2} style={{ padding: "20px" }}>
                {loading ? (
                    <Typography variant="h6" style={{ margin: "20px" }}>Loading showdetects...</Typography>
                ) : filteredShowdetects.length > 0 ? (
                    filteredShowdetects.map((showdetect) => (
                        <Grid item xs={12} sm={6} md={3} key={showdetect.api_key}>
                            <Card variant="outlined" sx={{ maxWidth: "350px", width: "100%" }}>
                                <CardContent>
                                    <Typography variant="h6">{showdetect.device_name}</Typography>
                                    <Typography variant="body2" color="textSecondary">📍 {showdetect.location}</Typography>
                                    <Typography variant="body2"><strong>ค่า PM 2.5 ที่วัดได้:</strong> {showdetect.pm2_5} µg/m³</Typography>
                                    <Typography variant="body2"><strong>ค่า PM 10 ที่วัดได้:</strong> {showdetect.pm10} µg/m³</Typography>
                                    <Typography variant="body2"><strong>ค่า CO2 ที่วัดได้:</strong> {showdetect.co2} ppm</Typography>
                                    <Typography variant="body2"><strong>ค่า TVOC ที่วัดได้:</strong> {showdetect.tvoc} ppb</Typography>
                                    <Typography variant="body2"><strong>ค่า อุณหภูมิ ที่วัดได้:</strong> {showdetect.temperature}°C</Typography>
                                    <Typography variant="body2"><strong>ค่า ความชื้นสัมพัทธ์ ที่วัดได้:</strong> {showdetect.humidity}%</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                ) : (
                    <Typography variant="h6" style={{ margin: "20px" }}>No showdetect data available.</Typography>
                )}
            </Grid>

            {/* Pagination */}
            <TablePagination
                rowsPerPageOptions={[8, 12, 16]}
                component="div"
                count={totalShowdetects}
                rowsPerPage={pageSize}
                page={currentPage}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />
        </div>
    );
};

export default Home;