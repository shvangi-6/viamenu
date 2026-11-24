import { useEffect, useState } from "react";
import { FaCog, FaSave, FaCreditCard, FaShieldAlt, FaUser, FaEdit, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../../utils/axiosInstance";
import "../../components/common/Modal.css";
import "./GeneralSettings.css";

// Proposal "Global Settings": platform-wide configuration — default
// subscription terms, payment gateway switches, data retention & privacy.
// View mode by default; "Edit" switches the same cards to inputs (tester asked
// for separate view and edit states).
const GROUPS = [
  { title: "Platform", icon: FaCog, fields: [
    ["platform.name", "Platform name", "text"],
    ["platform.supportEmail", "Support email", "email"],
    ["platform.currency", "Currency", "text"],
  ] },
  { title: "Subscriptions & payments", icon: FaCreditCard, fields: [
    ["subscription.reminderDays", "Renewal reminder (days before end)", "number"],
    ["payments.stripeEnabled", "Card payments (Stripe)", "bool"],
    ["payments.paypalEnabled", "PayPal", "bool"],
    ["payments.platformFeePercent", "Platform fee on guest payments (%)", "number"],
    ["payments.platformFeeFixed", "Platform fee per order (€, fixed)", "number"],
    ["orders.enabled", "Guest ordering in the web app", "bool"],
  ] },
  { title: "Privacy & data", icon: FaShieldAlt, fields: [
    ["privacy.dataRetentionDays", "Keep deleted data for (days)", "number"],
    ["privacy.policyUrl", "Privacy policy URL", "url"],
    ["privacy.termsUrl", "Terms & conditions URL", "url"],
  ] },
];

const show = (v, type) => (type === "bool" ? (v ? "On" : "Off") : v === "" || v == null ? "—" : String(v));

export default function GeneralSettings() {
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [admin, setAdmin] = useState({});

  useEffect(() => {
    axiosInstance.get("/admin/settings/general").then((r) => setSettings(r.data.data)).catch(() => toast.error("Could not load settings"));
    axiosInstance.get("/admin/auth/profile").then((r) => setAdmin(r.data?.data || {})).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const changed = Object.fromEntries(Object.entries(draft).filter(([k, v]) => v !== settings[k]));
      const res = await axiosInstance.put("/admin/settings/general", changed);
      setSettings(res.data.data);
      setDraft(null);
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  const editing = !!draft;
  const values = draft ?? settings;

  return (
    <div className="gs-page">
      <div className="gs-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <h1 className="gs-title">General Settings</h1>
          <p className="gs-subtitle">Platform-wide configuration</p>
        </div>
        {settings && (editing ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-plain" onClick={() => setDraft(null)} disabled={saving}><FaTimes /> Cancel</button>
            <button className="gs-btn" style={{ marginTop: 0 }} onClick={save} disabled={saving}>{saving ? <span className="gs-spin" /> : <FaSave />} Save settings</button>
          </div>
        ) : (
          <button className="gs-btn" style={{ marginTop: 0 }} onClick={() => setDraft({ ...settings })}><FaEdit /> Edit settings</button>
        ))}
      </div>

      {!settings ? <div className="dt-spinner" style={{ margin: "60px auto" }} /> : (
        <div className="gs-grid">
          {GROUPS.map(({ title, icon: Icon, fields }) => (
            <div className="gs-card" key={title}>
              <h3 className="gs-card-title"><Icon /> {title}</h3>
              {fields.map(([key, label, type]) => (
                <div className="gs-field-group" key={key}>
                  <label className="gs-label">{label}</label>
                  {!editing ? (
                    <div style={{ fontSize: 14, color: "#1e293b", padding: "4px 0" }}>{show(values[key], type)}</div>
                  ) : type === "bool" ? (
                    <label className="fm-check">
                      <input type="checkbox" checked={!!values[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })} /> Enabled
                    </label>
                  ) : (
                    <input
                      className="fm-input"
                      type={type}
                      value={values[key] ?? ""}
                      onChange={(e) => setDraft({ ...draft, [key]: type === "number" ? Number(e.target.value) : e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}

          <div className="gs-card">
            <h3 className="gs-card-title"><FaUser /> Admin profile</h3>
            <div className="gs-field-group"><label className="gs-label">Name</label><div style={{ fontSize: 14 }}>{admin.name || "Admin"}</div></div>
            <div className="gs-field-group"><label className="gs-label">Email</label><div style={{ fontSize: 14 }}>{admin.email || "—"}</div></div>
            <p className="gs-note">To update admin credentials, use the <Link to="/change-password">Change Password</Link> page.</p>
          </div>
        </div>
      )}
    </div>
  );
}
