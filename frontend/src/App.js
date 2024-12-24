import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import AdminHome from "./pages/adminhome";
import Login from "./pages/login"; // Import หน้า Login

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} /> {/* เพิ่ม Route */}
                <Route path="/adminhome" element={<AdminHome />} />
            </Routes>
        </Router>
    );
}

export default App;