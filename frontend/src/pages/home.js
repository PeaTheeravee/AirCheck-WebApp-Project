import React, { useState, useEffect } from "react";
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
    Button,
    TablePagination
} from "@mui/material";
import "./home.css";

const Home = () => {
    const navigate = useNavigate();
    const [devices, setDevices] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(6); // ตั้งค่าให้แสดง 6 อุปกรณ์ต่อหน้า

    // 📌 ฟังก์ชันดึงข้อมูลอุปกรณ์ + showdetect
    const fetchDevices = async () => {
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
    };

    // 📌 useEffect → ดึงข้อมูลครั้งแรก + ตั้ง interval ทุก 60 วินาที
    useEffect(() => {
        fetchDevices(); // ดึงข้อมูลครั้งแรก

        const interval = setInterval(() => {
            fetchDevices(); // ดึงข้อมูลทุกๆ 60 วินาที
        }, 60000);

        return () => clearInterval(interval); // cleanup ตอน component unmount
    }, []);

    // 📌 ค้นหาอุปกรณ์
    const filteredDevices = devices.filter((device) => {
        const term = searchTerm.trim().toLowerCase();
        if (term === "") return true;
        return device.device_name.toLowerCase().includes(term) || device.location.toLowerCase().includes(term);
    });

    // 📌 Pagination
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
                        <Grid item xs={12} sm={6} md={4} key={device.api_key}>
                            <Card variant="outlined" sx={{ height: "100%" }}>
                                <CardContent>
                                    <Typography variant="h6">{device.device_name}</Typography>
                                    <Typography variant="body2" color="textSecondary">📍 {device.location}</Typography>
                                    <Typography variant="body2">PM2.5: {device.pm2_5}</Typography>
                                    <Typography variant="body2">PM10: {device.pm10}</Typography>
                                    <Typography variant="body2">CO2: {device.co2}</Typography>
                                    <Typography variant="body2">TVOC: {device.tvoc}</Typography>
                                    <Typography variant="body2">Humidity: {device.humidity}%</Typography>
                                    <Typography variant="body2">Temperature: {device.temperature}°C</Typography>
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
                rowsPerPageOptions={[6, 12, 24]}
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