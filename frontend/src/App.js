import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import AdminHome from "./pages/adminhome"; // Import adminhome

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/adminhome" element={<AdminHome />} /> {/* เพิ่ม Route */}
            </Routes>
        </Router>
    );
}

export default App;