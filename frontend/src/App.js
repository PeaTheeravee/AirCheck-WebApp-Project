import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/home";
import AdminHome from "./pages/adminhome";
import Login from "./pages/login"; // Import หน้า Login

function App() {
    return (
        <Router>
            <Routes>
                {/* ถ้าเข้าหน้า "/" ให้ Redirect ไปที่ "/home" */}
                <Route path="/" element={<Navigate to="/home" />} />

                <Route path="/home" element={<Home />} />
                <Route path="/login" element={<Login />} /> {/* เพิ่ม Route */}
                <Route path="/adminhome" element={<AdminHome />} />
            </Routes>
        </Router>
    );
}

export default App;
