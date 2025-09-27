import React, { useState } from "react";
import {
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Divider,
  InputAdornment,
  IconButton,
  Link as MLink,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/auth.css"; 

const Register = ({ onAlert }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);

  const register = async (e) => {
    e.preventDefault();
    console.log(" Register function triggered");

    if (password !== passwordConfirm) {
      onAlert?.({
        message: "Passwords do not match",
        backgroundColor: "#f44336",
        textColor: "white",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("http://localhost:8000/authx/register/", {
        username,
        email,
        password,
        password_confirm: passwordConfirm,
      });

      onAlert?.({
        message: "Registration successful!",
        backgroundColor: "#4CAF50",
        textColor: "white",
      });

      const token = response.data.access;
      localStorage.setItem("token", token);
      localStorage.setItem("username_hint", username);

      navigate("/profile", { replace: true}); 
    } catch (error) {
      console.error("Registration failed:", error);
      onAlert?.({
        message:
          error.response?.data?.message ||
          "Registration failed. Please try again.",
        backgroundColor: "#f44336",
        textColor: "white",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "start center",
        alignContent: "start",
        p: { xs: 3, sm: 6 },
        background:
          "radial-gradient(1200px 800px at 20% 10%, #0ea5e9, transparent 60%), radial-gradient(1200px 900px at 90% 90%, #f472b6, transparent 60%), linear-gradient(135deg,#f8fafc,#eef2ff)",
      }}
    >
      {/* Brand header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
        <Box
          sx={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            boxShadow: "0 0 0 6px #ffffff55",
            background: "linear-gradient(135deg,#0ea5e9,#f472b6)",
          }}
        />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
            Schedulane
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Plan by taste, time & weather
          </Typography>
        </Box>
      </Box>

      <Container maxWidth="sm" sx={{ px: 0 }}>
        <Card
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 720,
            mx: "auto",
            borderRadius: 3,
            border: "1px solid rgba(226,232,240,0.7)",
            bgcolor: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 12px 36px rgba(2,6,23,.18)",
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Create account
            </Typography>

            <Box component="form" noValidate onSubmit={register}>
              {/* Username */}
              <TextField
                label="Username"
                fullWidth
                margin="normal"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ opacity: 0.7 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 56,
                    borderRadius: 2,
                    bgcolor: "#fff",
                  },
                }}
              />

              {/* Email */}
              <TextField
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ opacity: 0.7 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 56,
                    borderRadius: 2,
                    bgcolor: "#fff",
                  },
                }}
              />

              {/* Password */}
              <TextField
                label="Password"
                type={showPw ? "text" : "password"}
                fullWidth
                margin="normal"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ opacity: 0.7 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={() => setShowPw((v) => !v)}
                        aria-label="toggle password visibility"
                      >
                        {showPw ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 56,
                    borderRadius: 2,
                    bgcolor: "#fff",
                  },
                }}
              />

              {/* Confirm Password */}
              <TextField
                label="Confirm Password"
                type={showPw2 ? "text" : "password"}
                fullWidth
                margin="normal"
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ opacity: 0.7 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={() => setShowPw2((v) => !v)}
                        aria-label="toggle confirm password visibility"
                      >
                        {showPw2 ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 56,
                    borderRadius: 2,
                    bgcolor: "#fff",
                  },
                }}
              />

              {/* Divider (optional, matches login look) */}
              <Box sx={{ my: 2 }}>
                <Divider>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  </Typography>
                </Divider>
              </Box>

              {/* Primary CTA – gradient pill */}
              <Button
                type="submit"
                fullWidth
                disabled={loading}
                sx={{
                  height: 60,
                  borderRadius: 999,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 18,
                  textTransform: "none",
                  boxShadow: "0 12px 28px rgba(37,99,235,.28)",
                  backgroundImage:
                    "linear-gradient(90deg,#2563eb 0%, #6d5efc 50%, #ec4899 100%)",
                  "&:hover": {
                    filter: "brightness(1.03)",
                    backgroundImage:
                      "linear-gradient(90deg,#2563eb 0%, #6d5efc 50%, #ec4899 100%)",
                  },
                }}
              >
                {loading ? "Creating…" : "Create account"}
              </Button>
            </Box>

            {/* Footnote */}
            <Typography
              variant="body2"
              sx={{ textAlign: "center", mt: 2, color: "text.secondary" }}
            >
              Already have an account?{" "}
              <MLink href="/signin" underline="hover" color="primary">
                Sign in
              </MLink>
            </Typography>
          </CardContent>
        </Card>

        <Typography
          variant="caption"
          sx={{ display: "block", textAlign: "center", mt: 1.5, color: "#94a3b8" }}
        >
          🔐 Your registration is encrypted and secure.
        </Typography>
      </Container>
    </Box>
  );
};

export default Register;
