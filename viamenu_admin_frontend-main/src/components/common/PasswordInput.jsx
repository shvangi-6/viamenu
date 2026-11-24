import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./PasswordInput.css";

/**
 * Labeled password field with a professional show/hide toggle.
 * Manages its own visibility state so callers only deal with the value.
 */
export default function PasswordInput({
  label,
  value,
  onChange,
  placeholder = "",
  autoComplete = "off",
  disabled = false,
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="form-group password-group">
      {label && <label>{label}</label>}
      <div className="password-wrapper">
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          disabled={disabled}
        />
        <button
          type="button"
          className="toggle-eye"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          title={show ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {show ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    </div>
  );
}
