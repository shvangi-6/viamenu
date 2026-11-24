import React, { useState } from "react";
import { parseGermanPrice, formatGermanPrice } from "../../utils/germanPrice";
import "./PriceInput.css";

/**
 * Price field in German format ("1,50"). Auto-corrects to "x,yy" on blur
 * ("1,5" -> "1,50", "1" -> "1,00", "1,254" -> "1,25", "1,255" -> "1,26") and
 * shows an inline error for invalid input. Holds the display string; parse it
 * with parseGermanPrice at save time.
 */
export default function PriceInput({
  label,
  value,
  onChange,
  placeholder = "0,00",
  disabled = false,
  required = false,
}) {
  const [error, setError] = useState("");

  const handleChange = (e) => {
    if (error) setError("");
    onChange(e.target.value);
  };

  const handleBlur = () => {
    const v = String(value ?? "").trim();
    if (!v) {
      setError(required ? "Price is required" : "");
      return;
    }
    const num = parseGermanPrice(v);
    if (num === null) {
      setError('Invalid price. Use the format "1,50".');
      return;
    }
    setError("");
    onChange(formatGermanPrice(num));
  };

  return (
    <div className="form-group price-group">
      {label && <label className="form-label">{label}</label>}
      <input
        type="text"
        inputMode="decimal"
        className={`form-control${error ? " price-invalid" : ""}`}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={!!error}
      />
      {error && <span className="price-error">{error}</span>}
    </div>
  );
}
