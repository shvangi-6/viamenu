import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../../utils/axiosInstance";
import "./MyProfile.css";

export default function MyProfile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get("/admin/auth/profile");
        setProfile({
          name: res.data?.data?.name || "",
          email: res.data?.data?.email || "",
        });
      } catch (err) {
        toast.error(err.response?.data?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1 className="crm-logo">CRM</h1>

        <h2 className="login-heading">My Profile</h2>
        <p className="login-subtext">
          View your account information
        </p>

        <div className="form-group">
          <label>Name</label>
          <input value={profile.name} disabled />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input value={profile.email} disabled />
        </div>

        <button
          className="login-btn"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
