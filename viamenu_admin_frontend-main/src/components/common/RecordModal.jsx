import { useState } from "react";
import { toast } from "react-toastify";
import Modal from "./Modal";
import axiosInstance from "../../utils/axiosInstance";

/**
 * Add / edit form in a modal, used by every admin "manage" action.
 * fields: [{ key, label, type: text|email|password|textarea|select|checkbox|number, options, required, hint }]
 * Editing (PUT) sends only the fields that changed; adding (POST) skips empty ones.
 */
export default function RecordModal({ title, fields, initial = {}, method = "put", url, onClose, onSaved, saveLabel = "Save" }) {
  const empty = (f) => (f.type === "checkbox" ? false : "");
  const [form, setForm] = useState(() => Object.fromEntries(fields.map((f) => [f.key, initial[f.key] ?? empty(f)])));
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = async () => {
    const body = {};
    for (const f of fields) {
      const v = form[f.key];
      if (method === "put" ? v === (initial[f.key] ?? empty(f)) : v === "") continue;
      body[f.key] = f.type === "number" ? (v === "" ? null : Number(v)) : v;
    }
    if (!Object.keys(body).length) return onClose();
    setSaving(true);
    try {
      const r = await axiosInstance[method](url, body);
      toast.success(r.data?.message || "Saved");
      onSaved?.(r.data?.data);
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };
  const missing = fields.some((f) => f.required && !String(form[f.key] ?? "").trim());

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={<>
        <button className="btn-plain" onClick={onClose}>Cancel</button>
        <button className="ps-btn" disabled={saving || missing} onClick={submit}>{saving ? "Saving…" : saveLabel}</button>
      </>}
    >
      {fields.map((f) => f.type === "checkbox" ? (
        <div className="fm-field" key={f.key}>
          <label className="fm-check"><input type="checkbox" checked={!!form[f.key]} onChange={set(f.key)} /> {f.label}</label>
        </div>
      ) : (
        <div className="fm-field" key={f.key}>
          <label className="fm-label" htmlFor={`rm-${f.key}`}>{f.label}{f.required && " *"}</label>
          {f.type === "textarea" ? (
            <textarea id={`rm-${f.key}`} className="fm-textarea" value={form[f.key]} onChange={set(f.key)} />
          ) : f.type === "select" ? (
            <select id={`rm-${f.key}`} className="fm-select" value={form[f.key]} onChange={set(f.key)}>
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input id={`rm-${f.key}`} className="fm-input" type={f.type || "text"} value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder} autoComplete={f.type === "password" ? "new-password" : undefined} />
          )}
          {f.hint && <p className="fm-hint">{f.hint}</p>}
        </div>
      ))}
    </Modal>
  );
}

