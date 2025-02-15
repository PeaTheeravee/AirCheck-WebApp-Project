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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from "@mui/material";
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    Tooltip, 
    Legend, 
    CartesianGrid, 
    ResponsiveContainer 
} from "recharts";
import "./home.css";

const Home = () => {
    const navigate = useNavigate();
    const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);

    const [devices, setDevices] = useState([]);
    const [showdetects, setShowdetects] = useState([]);
    const [scoreData, setScoreData] = useState(null);
    const [dailyAverages, setDailyAverages] = useState([]);

    const [targetApiKey, setTargetApiKey] = useState(null);
    const [targetDeviceName, setTargetDeviceName] = useState("");

    //------------------------------------------------------------------------------------------------
    
    //สำหรับ เเสดงข้อมูลอุปกรณ์
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(8);
    const [totalPage, setTotalPage] = useState(0);
    const [loading, setLoading] = useState(false);

    //------------------------------------------------------------------------------------------------

    const toggleScoreDialog = (apiKey = null, device_name = "") => {
        setTargetApiKey(apiKey); // เก็บ ApiKey ใน state
        setTargetDeviceName(device_name);
        setIsScoreDialogOpen(!isScoreDialogOpen);
    };

    //================================================================================================

    // ฟังก์ชันดึงข้อมูลอุปกรณ์ (ใช้ Pagination)
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

    // ฟังก์ชันดึงข้อมูล showdetects
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

    // ฟังก์ชันดึงข้อมูล score
    const fetchScoreData = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:8000/scores/${targetApiKey}`, {
                method: "GET",
                credentials: "include",
            });
    
            if (!response.ok) throw new Error("Failed to fetch score data.");
    
            const data = await response.json();
            setScoreData(data);
        } catch (err) {
            console.error(err.message);
        }
    }, [targetApiKey]);

    // ฟังก์ชันดึงข้อมูล ค่าเฉลี่ยรายวัน
    const fetchDailyAverages = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:8000/avg/daily_averages/${targetApiKey}`, {
                method: "GET",
                credentials: "include",
            });
    
            if (!response.ok) throw new Error("Failed to fetch daily averages.");
    
            const data = await response.json();
            setDailyAverages(data);
        } catch (err) {
            console.error(err.message);
        }
    }, [targetApiKey]); 

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

    //================================================================================================

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

    //================================================================================================
    
    // โหลด Devices & Showdetects ตอนแรก & เมื่อเปลี่ยนหน้า
    useEffect(() => {
        fetchDevices();
        fetchShowdetects();
    }, [fetchDevices, fetchShowdetects]);

    // อัปเดต Devices & Showdetects ทุกๆ 1 นาที
    useEffect(() => {
        const interval = setInterval(() => {
            fetchDevices();
            fetchShowdetects();
        }, 60000);
        return () => clearInterval(interval);
    }, [fetchDevices, fetchShowdetects]);

    useEffect(() => {
        if (isScoreDialogOpen && targetApiKey) {
            fetchScoreData();
            fetchDailyAverages();
        }
    }, [isScoreDialogOpen, targetApiKey, fetchScoreData, fetchDailyAverages]);

    //================================================================================================

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
                            <Card 
                                variant="outlined" 
                                sx={{ maxWidth: "350px", width: "100%", cursor: "pointer" }}
                                onClick={() => toggleScoreDialog(device.api_key, device.device_name)}
                            >
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

            {/* ✅ Popup แสดงข้อมูล Score */}
            <Dialog open={isScoreDialogOpen} onClose={toggleScoreDialog}>
                <DialogTitle>
                    Device Score Data - {targetDeviceName}
                </DialogTitle>
                <DialogContent>
                    {scoreData ? (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Parameter</TableCell>
                                        <TableCell>Quality Level</TableCell>
                                        <TableCell>Fixed Value</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        <TableCell>PM2.5</TableCell>
                                        <TableCell>{scoreData.pm2_5_quality_level}</TableCell>
                                        <TableCell>{scoreData.pm2_5_fix}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>PM10</TableCell>
                                        <TableCell>{scoreData.pm10_quality_level}</TableCell>
                                        <TableCell>{scoreData.pm10_fix}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>CO2</TableCell>
                                        <TableCell>{scoreData.co2_quality_level}</TableCell>
                                        <TableCell>{scoreData.co2_fix}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>TVOC</TableCell>
                                        <TableCell>{scoreData.tvoc_quality_level}</TableCell>
                                        <TableCell>{scoreData.tvoc_fix}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Humidity</TableCell>
                                        <TableCell>{scoreData.humidity_quality_level}</TableCell>
                                        <TableCell>{scoreData.humidity_fix}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Temperature</TableCell>
                                        <TableCell>{scoreData.temperature_quality_level}</TableCell>
                                        <TableCell>{scoreData.temperature_fix}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Typography>Loading...</Typography>
                    )}

                    {/*Line Chart ของค่าเฉลี่ยรายวัน */}
                    {dailyAverages.length > 0 && (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={dailyAverages}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="avg_pm2_5" stroke="#ff0000" name="PM2.5" />
                                <Line type="monotone" dataKey="avg_pm10" stroke="#ffa500" name="PM10" />
                                <Line type="monotone" dataKey="avg_co2" stroke="#008000" name="CO2" />
                                <Line type="monotone" dataKey="avg_tvoc" stroke="#800080" name="TVOC" />
                                <Line type="monotone" dataKey="avg_humidity" stroke="#0000ff" name="Humidity" />
                                <Line type="monotone" dataKey="avg_temperature" stroke="#ff69b4" name="Temperature" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}                 
                </DialogContent>
                <DialogActions>
                    <Button onClick={toggleScoreDialog}>Close</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Home;