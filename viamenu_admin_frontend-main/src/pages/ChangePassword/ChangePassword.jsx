import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../../utils/axiosInstance";
import PasswordInput from "../../components/common/PasswordInput";
import "./ChangePassword.css";

export default function ChangePassword() {
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.warning("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    setLoading(true);

    try {
      await axiosInstance.post("/admin/auth/change-password", {
        oldPassword,
        newPassword,
        confirmPassword,
      });

      toast.success("Password changed successfully 🎉");

      // Backend already nulls the stored refresh token on password change —
      // just clear the local UI hint and send the user back to login.
      setTimeout(() => {
        localStorage.removeItem("isLoggedIn");
        navigate("/");
      }, 1200);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1 className="crm-logo">CRM</h1>

        <h2 className="login-heading">Change Password</h2>
        <p className="login-subtext">
          Update your account password securely
        </p>

        <PasswordInput
          label="Old Password"
          placeholder="Enter old password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          autoComplete="current-password"
        />

        <PasswordInput
          label="New Password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
        />

        <PasswordInput
          label="Confirm New Password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />

        <button
          className="login-btn"
          onClick={handleChangePassword}
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
}
