import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(""); // รีเซ็ตข้อความ error

        try {
            const response = await fetch("http://localhost:8000/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    username: username,
                    password: password,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json(); // ดึงข้อความจาก detail
                throw new Error(errorData.detail || "Unknown error occurred");
            }

            const data = await response.json();
            if (data.role === "superadmin") {
                navigate("/adminhome"); // ถ้า role คือ superadmin ให้ไปหน้า adminhome
            } else {
                setError("Access denied. Only superadmins are allowed.");
            }
        } catch (err) {
            setError(err.message); // แสดงข้อความ error จาก Backend
        }
    };

    return (
        <div>
            <h1>Login</h1>
            <form onSubmit={handleLogin}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit">Login</button>
            </form>
            {error && <p style={{ color: "red" }}>{error}</p>} {/* แสดงข้อความ error */}
        </div>
    );
};

export default Login;