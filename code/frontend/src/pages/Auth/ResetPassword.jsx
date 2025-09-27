import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  InputAdornment,
  IconButton, 
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import "../../styles/resetpassword.css";

export default function ResetPassword({ onAlert }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");

  // shared
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // request mode
  const [email, setEmail] = useState("");

  // confirm mode
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  // optional token validation
  const [validating, setValidating] = useState(!!token);
  const [validToken, setValidToken] = useState(!token);

  // UX helpers
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = password2.length > 0 && password !== password2;
  const canSubmit = !loading && !tooShort && !mismatch && password.length >= 8;

  useEffect(() => {
    async function validate() {
      if (!token) return;
      try {
        await axios.post("http://localhost:8000/authx/password_reset/validate_token/", { token });
        setValidToken(true);
      } catch {
        setMsg({ ok: false, text: "This reset link is invalid or has expired." });
      } finally {
        setValidating(false);
      }
    }
    validate();
  }, [token]);

  async function sendLink(e) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      await axios.post("http://localhost:8000/authx/password_reset/", { email });
      setMsg({
        ok: true,
        text: "If that email is registered, a reset link has been sent. Please check your inbox.",
      });
      onAlert?.({
        message: "Reset link sent (if email exists).",
        backgroundColor: "#10b981",
        textColor: "white",
      });
    } catch {
      setMsg({ ok: false, text: "Could not send reset email. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  async function setNewPassword(e) {
    e.preventDefault();

    if (password !== password2) {
      setMsg({ ok: false, text: "Passwords do not match." });
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      await axios.post("http://localhost:8000/authx/password_reset/confirm/", {
        token,
        password,
      });

      setMsg({ ok: true, text: "Password updated. Redirecting to Sign in…" });
      setTimeout(() => navigate("/signin"), 1200);
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data || {};
      console.error("confirm error", status, data);

      let text = "Reset failed. Link may be invalid or expired.";
      if (Array.isArray(data.password)) text = data.password.join(" ");
      else if (typeof data.password === "string") text = data.password;
      else if (data.detail) text = data.detail;
      else if (Array.isArray(data.non_field_errors)) text = data.non_field_errors.join(" ");
      else if (data.error) text = data.error;
      else if (status >= 500) text = "Server error. Please try again shortly.";

      setMsg({ ok: false, text });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box className="rp-bg">
      {/* Centered brand header */}
      <Box className="rp-brand centered">
        <Box className="rp-brand-dot" />
        <Box>
          <Typography variant="h3" className="rp-title">
            Schedulane
          </Typography>
          <Typography variant="body1" className="rp-subtitle">
            Plan by taste, time & weather
          </Typography>
        </Box>
      </Box>


      <Container maxWidth="sm" sx={{ px: 0 }}>
        <Card elevation={0} className="rp-card">
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            {/* MODE 1: Email form (no token) */}
            {!token ? (
              <>
                <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 700 }}>
                  Reset password
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                  Enter your account email. We’ll send you a secure link to set a new password.
                </Typography>

                <Box component="form" noValidate onSubmit={sendLink}>
                  <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MailOutlineIcon sx={{ opacity: 0.7 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { height: 56, borderRadius: 2, bgcolor: "#fff" } }}
                  />
                  <Button type="submit" fullWidth disabled={loading || !email} className="rp-btn" sx={{ mt: 2.5 }}>
                    {loading ? "Sending…" : "Send reset link"}
                  </Button>
                </Box>
              </>
            ) : (
              // MODE 2: New password form (token present)
              <>
                <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 700 }}>
                  Set a new password
                </Typography>

                {validating ? (
                  <Typography variant="body2">Validating link…</Typography>
                ) : validToken ? (
                  <Box component="form" noValidate onSubmit={setNewPassword}>
                    <TextField
                      label="New password"
                      type={show1 ? "text" : "password"}
                      fullWidth
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      slotProps={{ input: { minLength: 8 } }} 
                      error={tooShort}
                      helperText={tooShort ? "Use at least 8 characters." : " "}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlinedIcon sx={{ opacity: 0.7 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShow1((v) => !v)} edge="end" aria-label="toggle password visibility">
                              {show1 ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ "& .MuiOutlinedInput-root": { height: 56, borderRadius: 2, bgcolor: "#fff" } }}
                    />

                    <TextField
                      label="Confirm new password"
                      type={show2 ? "text" : "password"}
                      fullWidth
                      required
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                      autoComplete="new-password"
                      error={mismatch}
                      helperText={mismatch ? "Passwords don’t match." : " "}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShow2((v) => !v)} edge="end" aria-label="toggle password visibility">
                              {show2 ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ mt: 2, "& .MuiOutlinedInput-root": { height: 56, borderRadius: 2, bgcolor: "#fff" } }}
                    />

                    <Button type="submit" fullWidth disabled={!canSubmit} className="rp-btn" sx={{ mt: 2.5 }}>
                      {loading ? "Saving…" : "Reset password"}
                    </Button>
                  </Box>
                ) : (
                  <Typography variant="body2" color="error">
                    This reset link is invalid or has expired.
                  </Typography>
                )}
              </>
            )}

            {msg && (
              <Typography variant="body2" sx={{ mt: 2, color: msg.ok ? "#059669" : "#DC2626", fontWeight: 500 }}>
                {msg.text}
              </Typography>
            )}

            <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Back to{" "}
                <Link to="/signin" className="rp-link">
                  Sign in
                </Link>
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                No account?{" "}
                <Link to="/signup" className="rp-link">
                  Create one
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Typography variant="caption" sx={{ display: "block", textAlign: "center", mt: 1.5, color: "#94a3b8" }}>
          🔐 We’ll never share your email with anyone.
        </Typography>
      </Container>
    </Box>
  );
}
