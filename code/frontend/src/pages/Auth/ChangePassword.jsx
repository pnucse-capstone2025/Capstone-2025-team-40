import React, { useState } from "react";
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
  Divider,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient"; // axios instance with Bearer token


function extractMsg(d) {
  if (!d) return "";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.join(" ");
  if (d.detail) return String(d.detail);
  const keys = Object.keys(d);
  if (keys.length) {
    const v = d[keys[0]];
    if (typeof v === "string") return v;
    if (Array.isArray(v)) return v.join(" ");
  }
  return "Could not change password. Please try again.";
}
function toText(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(toText).join(" ");
  if (typeof v === "object") {
    if (v.message) return toText(v.message);
    return Object.values(v).map(toText).join(" ");
  }
  return String(v);
}

const CHANGE_PASSWORD_ENDPOINT = "/authx/change_password/";

export default function ChangePassword({ onAlert }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    old_password: "",
    new_password: "",
    new_password_confirm: "",
  });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
    setGeneralError("");
    setSuccess("");
  }
  function toggleVis(key) {
    setShow((s) => ({ ...s, [key]: !s[key] }));
  }
  function validateLocal() {
    const e = {};
    if (!form.old_password) e.old_password = "Enter your current password.";
    if (!form.new_password) e.new_password = "Enter a new password.";
    if (!form.new_password_confirm) e.new_password_confirm = "Confirm your new password.";
    if (form.new_password && form.new_password_confirm && form.new_password !== form.new_password_confirm) {
      e.new_password_confirm = "Passwords do not match.";
    }
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");

    const localErrs = validateLocal();
    if (Object.keys(localErrs).length > 0) {
      setErrors(localErrs);
      return;
    }

    setLoading(true);
    try {
      const { data } = await apiClient.put(CHANGE_PASSWORD_ENDPOINT, form);
      const msg = data?.detail || "Your password changed successfully.";
      if (onAlert) onAlert("success", msg);
      else setSuccess(msg);

      // brief success, then sign out and redirect
      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh");
        navigate("/signin");
      }, 1200);
    } catch (err) {
      const resp = err?.response;
      if (resp?.data) {
        const d = resp.data;
        const fieldErrs = {};
        ["old_password", "new_password", "new_password_confirm"].forEach((k) => {
          if (d[k]) fieldErrs[k] = toText(d[k]);
        });
        setErrors(fieldErrs);
        const msg = extractMsg(d);
        if (!Object.keys(fieldErrs).length || d.detail) setGeneralError(msg);
      } else {
        setGeneralError("Network or server error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: { xs: 6, sm: 8 },
        px: 2,
        background:
          "linear-gradient(180deg, #f8fafc 0%, #ffffff 40%, #ffffff 100%)",
      }}
    >
      <Container maxWidth="sm">
        {/* Header */}
        <Box sx={{ mb: 3, textAlign: "left" }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              letterSpacing: -0.5,
              color: "text.primary",
              lineHeight: 1.1,
            }}
          >
            Change Password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Keep your account secure. Use a strong, unique password.
          </Typography>
        </Box>

        {/* Card */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            boxShadow: "0 10px 30px rgba(2,6,23,.06), inset 0 1px 0 #fff8",
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            {/* Tiny lock badge */}
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                px: 1.25,
                py: 0.5,
                borderRadius: 999,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                boxShadow: 1,
                mb: 2,
              }}
            >
              <LockOutlinedIcon fontSize="small" />
              <Typography variant="caption" sx={{ letterSpacing: 0.6 }}>
                Security
              </Typography>
            </Box>

            {/* Success / Error */}
            {success && (
              <Box
                sx={{
                  mb: 2,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "success.light",
                  color: "success.dark",
                  border: "1px solid",
                  borderColor: "success.main",
                }}
              >
                <Typography variant="body2">{success}</Typography>
              </Box>
            )}
            {generalError && (
              <Box
                sx={{
                  mb: 2,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "error.light",
                  color: "error.dark",
                  border: "1px solid",
                  borderColor: "error.main",
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {generalError}
                </Typography>
              </Box>
            )}

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                margin="normal"
                label="Current password"
                name="old_password"
                type={show.old ? "text" : "password"}
                value={form.old_password}
                onChange={handleChange}
                error={Boolean(errors.old_password)}
                helperText={errors.old_password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle current password visibility"
                        onClick={() => toggleVis("old")}
                        edge="end"
                        size="small"
                      >
                        {show.old ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                margin="normal"
                label="New password"
                name="new_password"
                type={show.new ? "text" : "password"}
                value={form.new_password}
                onChange={handleChange}
                error={Boolean(errors.new_password)}
                helperText={
                  errors.new_password ||
                  "Use a strong password (mix of letters, numbers, symbols)."
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle new password visibility"
                        onClick={() => toggleVis("new")}
                        edge="end"
                        size="small"
                      >
                        {show.new ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                margin="normal"
                label="Confirm new password"
                name="new_password_confirm"
                type={show.confirm ? "text" : "password"}
                value={form.new_password_confirm}
                onChange={handleChange}
                error={Boolean(errors.new_password_confirm)}
                helperText={errors.new_password_confirm}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => toggleVis("confirm")}
                        edge="end"
                        size="small"
                      >
                        {show.confirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Divider sx={{ my: 3 }} />

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexDirection: { xs: "column", sm: "row" },
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  type="button"
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate(-1)}
                  sx={{
                    borderRadius: 2,
                    py: 1.25,
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    py: 1.25,
                    textTransform: "none",
                    fontWeight: 700,
                    boxShadow: (t) => `0 10px 18px ${t.palette.primary.main}22`,
                  }}
                >
                  {loading ? "Saving..." : "Change Password"}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
