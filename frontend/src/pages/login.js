import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, TextField, Button, Typography } from "@mui/material";

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!username || !password) {
            setError("Username and password cannot be empty.");
            setTimeout(() => setError(""), 2000);
            return;
        }
    
        try {
            const response = await fetch("http://localhost:8000/login", {
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
                height: "100vh" 
            }}
        >
            <Box 
                sx={{ 
                    p: 4, 
                    border: "1px solid #ccc", 
                    borderRadius: "8px", 
                    boxShadow: 3, 
                    width: 300, 
                    textAlign: "center" 
                }}
            >
                <Typography variant="h5" mb={2}>Login</Typography>
                <form onSubmit={handleLogin}>
                    <TextField
                        label="Username"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <TextField
                        label="Password"
                        type="password"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {error && (
                        <p style={{ color: "red", marginTop: "10px", fontSize: "20px" }}>
                            {error}
                        </p>
                    )}
                    
                    <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary" 
                        fullWidth 
                        sx={{ mt: 2 }}
                    >
                        Login
                    </Button>
                </form>
            </Box>
        </Box>
    );
};

export default Login;