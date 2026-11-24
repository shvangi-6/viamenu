import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Login.css";
import PasswordInput from "../../components/common/PasswordInput";
import logo from "./images/logo.png"
export default function Login() {
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.warning("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/admin/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Tokens are set as httpOnly cookies by the server — this is just a
      // non-sensitive UI hint for route guards, not the credential itself.
      localStorage.setItem("isLoggedIn", "1");

      toast.success("Login successful 🎉");

      // small delay for UX
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 800);
    } catch (err) {
      toast.error(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1 className="crm-logo"><img src={logo} alt="logo" className="img-fluid mb-2" width={300} /></h1>

        <h2 className="login-heading">Log in to Admin Dashboard</h2>
        <p className="login-subtext">
          Welcome back! Please enter your details.
        </p>

        <div className="form-group">
          <label>Email / Username</label>
          <input
            type="text"
            placeholder="Enter email / username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <PasswordInput
          label="Password"
          placeholder="********"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {/* <div className="forgot-password d-flex justify-content-end mb-2">
          <button
            onClick={() => navigate("/forgot-password")}
            className="btn btn-sm btn-primary"
          >
            Forgot Password?
          </button>
        </div> */}

        <button className="login-btn" onClick={handleLogin} disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </div>
    </div>
  );
}
