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
    const [showdetects, setShowdetects] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");

    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(8);
    const [totalPage, setTotalPage] = useState(0);

    const [loading, setLoading] = useState(false);

    // ✅ ฟังก์ชันดึงข้อมูลอุปกรณ์ (ใช้ Pagination)
    const fetchDevices = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/devices/all?page=${currentPage + 1}&size=${pageSize}`, {
                method: "GET",
                credentials: "include",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to fetch devices.");
            }

            const data = await response.json();
            setDevices(data.devices);
            setTotalPage(data.total);
        } catch (err) {
            console.error("Error fetching devices:", err.message);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize]);

    // ✅ ฟังก์ชันดึงข้อมูล showdetects
    const fetchShowdetects = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:8000/showdetect/all?page=${currentPage + 1}&size=${pageSize}`, {
                method: "GET",
                credentials: "include",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to fetch showdetect data.");
            }

            const data = await response.json();
            setShowdetects(data.shows);
            setTotalPage(data.total);
        } catch (err) {
            console.error("Error fetching showdetect data:", err.message);
        }
    }, [currentPage, pageSize]);

    //------------------------------------------------------------------------------------------------

    // ฟังก์ชันสำหรับเปลี่ยนหน้า
    const handlePageChange = (event, newPage) => {
        setCurrentPage(newPage);
    };

    // ฟังก์ชันสำหรับเปลี่ยนจำนวนรายการต่อหน้า
    const handleRowsPerPageChange = (event) => {
        setPageSize(parseInt(event.target.value, 10));
        setCurrentPage(0); // รีเซ็ตไปหน้าแรกเมื่อเปลี่ยนขนาดหน้า
    };

    // ฟังก์ชันค้นหา
    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
        setCurrentPage(0);
    };

    // กรองข้อมูลอุปกรณ์โดยใช้ searchTerm
    const filteredDevices = devices.filter((device) => {
        const term = searchTerm.trim().toLowerCase();
        if (term === "") return true;
        return (
            device.device_name.toLowerCase().includes(term) ||
            device.location.toLowerCase().includes(term)
        );
    });

    // ✅ รวมข้อมูล showdetect กับ devices
    const devicesWithShowdetects = filteredDevices.map(device => {
        const matchingShowdetect = showdetects.find(show => show.api_key === device.api_key);
        return {
            ...device,
            pm2_5: matchingShowdetect ? matchingShowdetect.pm2_5 : "N/A",
            pm10: matchingShowdetect ? matchingShowdetect.pm10 : "N/A",
            co2: matchingShowdetect ? matchingShowdetect.co2 : "N/A",
            tvoc: matchingShowdetect ? matchingShowdetect.tvoc : "N/A",
            humidity: matchingShowdetect ? matchingShowdetect.humidity : "N/A",
            temperature: matchingShowdetect ? matchingShowdetect.temperature : "N/A",
        };
    });

    //------------------------------------------------------------------------------------------------
    
    // โหลด Devices & Showdetects ตอนแรก & เมื่อเปลี่ยนหน้า
    useEffect(() => {
        fetchDevices();
        fetchShowdetects();
    }, [fetchDevices, fetchShowdetects]);

    // ✅ อัปเดต Devices & Showdetects ทุกๆ 1 นาที
    useEffect(() => {
        const interval = setInterval(() => {
            fetchDevices();
            fetchShowdetects();
        }, 60000);
        return () => clearInterval(interval);
    }, [fetchDevices, fetchShowdetects]);

    return (
        <div>
            <header className="home-header">
                <h1>Welcome to My Application!</h1>
                <button className="profile-icon" onClick={() => navigate("/login")}>
                    <AccountCircleIcon fontSize="large" />
                </button>
            </header>

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

            <Grid container spacing={2} style={{ padding: "20px" }}>
                {loading ? (
                    <Typography variant="h6" style={{ margin: "20px" }}>Loading devices...</Typography>
                ) : devicesWithShowdetects.length > 0 ? (
                    devicesWithShowdetects.map((device) => (
                        <Grid item xs={12} sm={6} md={3} key={device.api_key}>
                            <Card variant="outlined" sx={{ maxWidth: "350px", width: "100%" }}>
                                <CardContent>
                                    <Typography variant="h6">{device.device_name}</Typography>
                                    <Typography variant="body2" color="textSecondary">📍 {device.location}</Typography>
                                    <Typography variant="body2"><strong>PM 2.5:</strong> {device.pm2_5} µg/m³</Typography>
                                    <Typography variant="body2"><strong>PM 10:</strong> {device.pm10} µg/m³</Typography>
                                    <Typography variant="body2"><strong>CO2:</strong> {device.co2} ppm</Typography>
                                    <Typography variant="body2"><strong>TVOC:</strong> {device.tvoc} ppb</Typography>
                                    <Typography variant="body2"><strong>Temp:</strong> {device.temperature}°C</Typography>
                                    <Typography variant="body2"><strong>Humidity:</strong> {device.humidity}%</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                ) : (
                    <Typography variant="h6" style={{ margin: "20px" }}>No devices available.</Typography>
                )}
            </Grid>

            <TablePagination
                rowsPerPageOptions={[8, 12, 16]}
                component="div"
                count={totalPage}
                rowsPerPage={pageSize}
                page={currentPage}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />
        </div>
    );
};

export default Home;