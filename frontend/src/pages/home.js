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
    TableRow,
    Select, 
    MenuItem, 
    FormControl, 
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

    const [activeTab, setActiveTab] = useState("score");
    const [selectedParameter, setSelectedParameter] = useState("avg_pm2_5");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // ค่าเริ่มต้นเป็นปีปัจจุบัน
    const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, "0")); // ค่าเริ่มต้นเป็นเดือนปัจจุบัน
    const [availableYears, setAvailableYears] = useState([]); // ✅ เก็บรายการปีที่มีอยู่

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

    // กรองข้อมูลในกราฟให้เเสดงเฉพาะปี-เดือนที่เลือก
    const filteredAverages = dailyAverages.filter((data) => {
        const dataYearMonth = data.date.slice(0, 7); // ตัดเฉพาะ YYYY-MM
        return dataYearMonth === `${selectedYear}-${selectedMonth}`;
    });
    
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
            setSelectedYear(new Date().getFullYear()); // รีเซ็ตเป็นปีปัจจุบัน
            setSelectedMonth((new Date().getMonth() + 1).toString().padStart(2, "0")); // รีเซ็ตเป็นเดือนปัจจุบัน
            setActiveTab("score"); // รีเซ็ตเป็น "score" โดยค่าเริ่มต้น
            setSelectedParameter("avg_pm2_5"); // รีเซ็ตเป็นค่า PM2.5
        }
    }, [isScoreDialogOpen, targetApiKey, fetchScoreData, fetchDailyAverages]);

    useEffect(() => {
        if (dailyAverages.length > 0) {
            const years = [...new Set(dailyAverages.map(data => data.date.slice(0, 4)))]; // ดึงปีจากข้อมูล
            setAvailableYears(years.sort((a, b) => b - a)); // เรียงปีจากมากไปน้อย
        }
    }, [dailyAverages]);
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
            <Dialog 
                open={isScoreDialogOpen} 
                onClose={toggleScoreDialog}
                maxWidth={false} 
                fullWidth
                sx={{ 
                    "& .MuiDialog-paper": { 
                        width: activeTab === "average" ? "90vw" : "850px",  
                        maxWidth: "1500px", 
                        padding: "20px" 
                    } 
                }}
            >
                <DialogTitle>
                    Device Score Data - {targetDeviceName}
                </DialogTitle>

                {/* ปุ่ม Toggle สลับระหว่าง Score Data / Daily Averages */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div>
                        <Button 
                            variant={activeTab === "score" ? "contained" : "outlined"} 
                            onClick={() => setActiveTab("score")}
                            sx={{ marginRight: "5px" }}
                        >
                            Score Data
                        </Button>
                        <Button 
                            variant={activeTab === "average" ? "contained" : "outlined"} 
                            onClick={() => setActiveTab("average")}
                        >
                            Daily Averages
                        </Button>
                    </div>
                </div>

                {/* แสดงเฉพาะเมื่อเลือก "Daily Averages" */}
                {activeTab === "average" && (
                    <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                        
                        {/* เลือกปี */}
                        <FormControl sx={{ width: "120px" }} size="small">
                            <Select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                            >
                                {availableYears.map((year) => ( // ใช้ปีที่ได้จาก fetchDailyAverages
                                    <MenuItem key={year} value={year}>{year}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* เลือกเดือน */}
                        <FormControl sx={{ width: "120px" }} size="small">
                            <Select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                            >
                                {[
                                    { value: "01", label: "January" },
                                    { value: "02", label: "February" },
                                    { value: "03", label: "March" },
                                    { value: "04", label: "April" },
                                    { value: "05", label: "May" },
                                    { value: "06", label: "June" },
                                    { value: "07", label: "July" },
                                    { value: "08", label: "August" },
                                    { value: "09", label: "September" },
                                    { value: "10", label: "October" },
                                    { value: "11", label: "November" },
                                    { value: "12", label: "December" },
                                ].map((month) => (
                                    <MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* เลือกค่าที่จะแสดง*/}
                        <FormControl sx={{ width: "120px" }} size="small">
                            <Select
                                value={selectedParameter}
                                onChange={(e) => setSelectedParameter(e.target.value)}
                            >
                                <MenuItem value="avg_pm2_5">PM2.5</MenuItem>
                                <MenuItem value="avg_pm10">PM10</MenuItem>
                                <MenuItem value="avg_co2">CO2</MenuItem>
                                <MenuItem value="avg_tvoc">TVOC</MenuItem>
                                <MenuItem value="avg_humidity">Humidity</MenuItem>
                                <MenuItem value="avg_temperature">Temperature</MenuItem>
                            </Select>
                        </FormControl>
                    </div>
                )}

                <DialogContent>
                    {activeTab === "score" ? (
                        // แสดง Score Data
                        scoreData ? (
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
                        )
                    ) : (
                        // แสดง Daily Averages Graph
                        filteredAverages.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={filteredAverages}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="date" 
                                        tickFormatter={(date) => date.split("-")[2]} // แสดงเฉพาะ "วัน"
                                    />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line 
                                        type="monotone" 
                                        dataKey={selectedParameter} 
                                        stroke="#ff0000" 
                                        name={selectedParameter.replace("avg_", "").toUpperCase()} 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <Typography>No Data Available</Typography>
                        )
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