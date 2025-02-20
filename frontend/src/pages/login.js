import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, TextField, Button, Typography, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material"; 
import backgroundImage from "../assets/background.jpg"; 

import { API_BASE_URL } from "./config";

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false); 

    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleTogglePassword = () => {
        setShowPassword((prev) => !prev);
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!username || !password) {
            setError("Username and password cannot be empty.");
            setTimeout(() => setError(""), 2000);
            return;
        }
    
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                credentials: "include", 
                body: new URLSearchParams({ username, password }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Login failed.");
            }

            navigate("/adminhome");

        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(""), 2000);
        }
    };    

    return (
        <Box 
            sx={{ 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                justifyContent: "center", 
                height: "100vh",
                background: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: "fixed",
            }}
        >
            <Box 
                sx={{ 
                    p: 4, 
                    border: "1px solid #ccc", 
                    borderRadius: "8px", 
                    boxShadow: 3, 
                    width: 500, 
                    textAlign: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.8)" 
                }}
            >
                <Typography>
                    <img src={require('../assets/logo.png')} alt="AirCheck" className="logologin" />
                </Typography>
                <form>
                    <TextField
                        label="Username"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        InputProps={{ style: { fontSize: "20px" } }} 
                        InputLabelProps={{ style: { fontSize: "20px" } }} 
                        sx={{ marginBottom: "10px" }}
                    />
                    <TextField
                        label="Password"
                        type={showPassword ? "text" : "password"} // ✅ เปลี่ยน type เป็น 'text' เมื่อ showPassword เป็น true
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        InputProps={{
                            style: { fontSize: "20px" },
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={handleTogglePassword}>  
                                        {showPassword ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        InputLabelProps={{ style: { fontSize: "20px" } }}
                    />

                    {error && (
                        <p style={{ color: "red", marginTop: "10px", fontSize: "20px" }}>
                            {error}
                        </p>
                    )}
                    
                    <Button 
                        type="submit" 
                        onClick={handleLogin} 
                        sx={{ fontSize: "18px" }}
                    >
                        Login
                    </Button>
                </form>
            </Box>
        </Box>
    );
};

export default Login;