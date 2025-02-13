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

    // ฟังก์ชันดึงข้อมูลอุปกรณ์
    const fetchDevices = useCallback(async () => {
        try {
            const response = await fetch("http://localhost:8000/devices/all", { credentials: "include" });
            if (!response.ok) throw new Error("Failed to fetch devices.");
            const data = await response.json();

            // 📌 ดึงข้อมูล showdetect ของแต่ละอุปกรณ์
            const devicesWithData = await Promise.all(
                data.devices.map(async (device) => {
                    try {
                        const detectResponse = await fetch(`http://localhost:8000/showdetect/${device.api_key}`);
                        if (!detectResponse.ok) return null;
                        const detectData = await detectResponse.json();
                        return { ...device, ...detectData };
                    } catch {
                        return null;
                    }
                })
            );

            setDevices(devicesWithData.filter((d) => d)); // กรอง null ออก
        } catch (err) {
            console.error(err);
        }
    }, []);

    // useEffect → ดึงข้อมูลครั้งแรก + ดึงข้อมูลอุปกรณ์ทุกๆ 1 นาที
    useEffect(() => {
        fetchDevices();
        const interval = setInterval(fetchDevices, 60000);
        return () => clearInterval(interval);
    }, [fetchDevices]);

    // กรองข้อมูลในตารางอุปกรณ์โดยใช้ searchTerm
    const filteredDevices = devices.filter((device) => {
        const term = searchTerm.trim().toLowerCase();
        if (term === "") return true;
        return device.device_name.toLowerCase().includes(term) || device.location.toLowerCase().includes(term);
    });

    // Pagination
    const paginatedDevices = filteredDevices.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

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
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
            />

            {/* 📌 แสดงข้อมูลอุปกรณ์ */}
            <Grid container spacing={2} style={{ padding: "20px" }}>
                {paginatedDevices.length > 0 ? (
                    paginatedDevices.map((device) => (
                        <Grid item xs={12} sm={6} md={3}>
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

            {/* 📌 Pagination */}
            <TablePagination
                rowsPerPageOptions={[4, 8, 12]}
                component="div"
                count={filteredDevices.length}
                rowsPerPage={pageSize}
                page={currentPage}
                onPageChange={(event, newPage) => setCurrentPage(newPage)}
                onRowsPerPageChange={(event) => {
                    setPageSize(parseInt(event.target.value, 10));
                    setCurrentPage(0);
                }}
            />
        </div>
    );
};

export default Home;