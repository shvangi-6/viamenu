// Topbar.jsx - Responsive Topbar Component
import { useState, useRef, useEffect } from "react";
import {
  FaSearch,
  FaBell,
  FaQuestionCircle,
  FaBars,
  FaUser,
  FaKey,
  FaSignOutAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { handleLogout as performLogout } from "../utils/axiosInstance";

export default function Topbar({ onToggle }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    performLogout();
  };

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    }
  };

  return (
    <header className="crm-topbar">
      {/* Menu icon, not an arrow: this toggles the sidebar, it never navigates back. */}
      <button className="collapse-btn" onClick={handleToggle} title="Show/hide menu" aria-label="Toggle sidebar">
        <FaBars />
      </button>

      {/* <div className="search-box">
        <FaSearch />
        <input 
          type="text"
          placeholder="Search for lead or contact" 
          aria-label="Search"
        />
      </div> */}

      <div className="topbar-actions" ref={dropdownRef}>
        <FaBell 
          role="button"
          tabIndex={0}
          aria-label="Notifications"
        />

        {/* USER AVATAR */}
        <div 
          className="avatar" 
          onClick={() => setOpen(!open)}
          role="button"
          tabIndex={0}
          aria-label="User menu"
        >
          A
        </div>

        {/* DROPDOWN */}
        {open && (
          <div className="user-dropdown">
            {/* <button 
              className="dropdown-item" 
              onClick={() => {
                navigate("/my-profile");
                setOpen(false);
              }}
            >
              <FaUser /> My Profile
            </button>

            <button
              className="dropdown-item"
              onClick={() => {
                navigate("/change-password");
                setOpen(false);
              }}
            >
              <FaKey /> Change Password
            </button> */}

            <div className="dropdown-divider" />

            <button 
              className="dropdown-item logout" 
              onClick={() => {
                handleLogout();
                setOpen(false);
              }}
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}