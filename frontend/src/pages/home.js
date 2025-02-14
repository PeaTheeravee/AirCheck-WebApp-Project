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

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(8);
    const [totalShowdetects, setTotalShowdetects] = useState(0);
    const [loading, setLoading] = useState(false);

    // ฟังก์ชันดึงข้อมูล showdetect
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
            setShowdetects(data.shows);
            setTotalShowdetects(data.total);
        } catch (err) {
            console.error("Error fetching showdetect data:", err.message);
        } finally {
            setLoading(false);
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
        setCurrentPage(0);
    };

    // ฟังก์ชันค้นหา 
    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
        setCurrentPage(0);
    };

    // กรองข้อมูล showdetect โดยใช้ searchTerm
    const filteredShowdetects = showdetects.filter((showdetect) => {
        const term = searchTerm.trim().toLowerCase();
        if (term === "") {
            return true;
        }
        return (
            showdetect.device_name.toLowerCase().includes(term) ||
            showdetect.location.toLowerCase().includes(term)
        );
    });

    //------------------------------------------------------------------------------------------------

    // useEffect → ดึงข้อมูลครั้งแรก + ดึงข้อมูลทุกๆ 1 นาที
    useEffect(() => {
        fetchShowdetects();
        const interval = setInterval(fetchShowdetects, 60000);
        return () => clearInterval(interval);
    }, [fetchShowdetects]);

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