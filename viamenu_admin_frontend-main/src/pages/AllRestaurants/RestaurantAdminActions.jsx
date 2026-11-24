import { useEffect, useState } from "react";
import { FaEdit, FaUserTie, FaTrash, FaPlus, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import Modal from "../../components/common/Modal";
import axiosInstance from "../../utils/axiosInstance";

/**
 * Admin actions on the restaurant details page (proposal Phase 1, Restaurant
 * Management): edit the restaurant's details and images, assign managers.
 */
export default function RestaurantAdminActions({ restaurant, onSaved }) {
  const [open, setOpen] = useState(null); // "edit" | "managers"
  return (
    <>
      <button className="share-btn" title="Edit details" onClick={() => setOpen("edit")}><FaEdit /></button>
      <button className="share-btn" title="Managers" onClick={() => setOpen("managers")}><FaUserTie /></button>
      {open === "edit" && <EditRestaurant restaurant={restaurant} onClose={() => setOpen(null)} onSaved={() => { setOpen(null); onSaved(); }} />}
      {open === "managers" && <Managers restaurantId={restaurant.id} onClose={() => setOpen(null)} />}
    </>
  );
}

const TEXT_FIELDS = [
  ["name", "Name", true], ["email", "Email", true], ["phone", "Phone", true],
  ["addressStreet", "Street"], ["addressNo", "No."], ["addressPostCode", "Post code"], ["addressCity", "City"], ["addressCountry", "Country"],
];

function EditRestaurant({ restaurant: r, onClose, onSaved }) {
  const a = r.address ?? {};
  const initial = {
    name: r.name ?? "", email: r.email ?? "", phone: r.phone ?? "", description: r.description ?? "", additionalInfo: r.additionalInfo ?? "",
    addressStreet: a.street ?? "", addressNo: a.No ?? "", addressPostCode: a.postCode ?? "", addressCity: a.city ?? "", addressCountry: a.country ?? "",
  };
  const [form, setForm] = useState(initial);
  const [images, setImages] = useState(Array.isArray(r.restaurantImages) ? r.restaurantImages : []);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "restaurant-images");
      const res = await axiosInstance.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setImages((list) => [...list, res.data.data.url]);
    } catch (e) {
      toast.error(e.response?.data?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    const body = Object.fromEntries(Object.entries(form).filter(([k, v]) => v !== initial[k]));
    if (JSON.stringify(images) !== JSON.stringify(r.restaurantImages ?? [])) body.restaurantImages = images;
    if (!Object.keys(body).length) return onClose();
    setBusy(true);
    try {
      await axiosInstance.put(`/admin/restaurant/${r.id}/profile`, body);
      toast.success("Restaurant updated");
      onSaved();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal wide title={`Edit restaurant — ${r.name}`} onClose={onClose}
      footer={<><button className="btn-plain" onClick={onClose}>Cancel</button><button className="ps-btn" disabled={busy || !form.name.trim()} onClick={save}>{busy ? "Saving…" : "Save"}</button></>}>
      <div className="row">
        {TEXT_FIELDS.map(([k, label, req]) => (
          <div className="col-md-6 fm-field" key={k}>
            <label className="fm-label" htmlFor={`re-${k}`}>{label}{req && " *"}</label>
            <input id={`re-${k}`} className="fm-input" value={form[k]} onChange={set(k)} />
          </div>
        ))}
      </div>
      <div className="fm-field"><label className="fm-label" htmlFor="re-description">Description</label><textarea id="re-description" className="fm-textarea" value={form.description} onChange={set("description")} /></div>
      <div className="fm-field"><label className="fm-label" htmlFor="re-info">Additional info</label><textarea id="re-info" className="fm-textarea" value={form.additionalInfo} onChange={set("additionalInfo")} /></div>
      <div className="fm-field">
        <label className="fm-label">Images</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {images.map((src) => (
            <div key={src} style={{ position: "relative" }}>
              <img src={src} alt="" style={{ width: 96, height: 72, objectFit: "cover", borderRadius: 8 }} />
              <button type="button" className="act-btn act-btn--danger" aria-label="Remove image" style={{ position: "absolute", top: 2, right: 2 }} onClick={() => setImages(images.filter((i) => i !== src))}><FaTimes /></button>
            </div>
          ))}
          <label className="btn-plain" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <FaPlus /> Add image
            <input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
          </label>
        </div>
        <p className="fm-hint">Removed images are deleted from the server when you save.</p>
      </div>
    </Modal>
  );
}

function Managers({ restaurantId, onClose }) {
  const [list, setList] = useState(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const url = `/admin/restaurant/${restaurantId}/managers`;

  useEffect(() => {
    axiosInstance.get(url).then((r) => setList(r.data.data)).catch(() => setList([]));
  }, [url]);

  const run = async (fn, okMsg) => {
    setBusy(true);
    try {
      setList((await fn()).data.data);
      toast.success(okMsg);
      return true;
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
      return false;
    } finally {
      setBusy(false);
    }
  };
  const add = async () => { if (await run(() => axiosInstance.post(url, { email }), "Manager assigned")) setEmail(""); };
  const remove = (m) => window.confirm(`Remove ${m.name || m.email} from this restaurant?`) && run(() => axiosInstance.delete(`${url}/${m.userId}`), "Manager removed");

  return (
    <Modal title="Managers of this restaurant" onClose={onClose}>
      {list === null ? <p className="fm-hint">Loading…</p> : list.length === 0 ? <p className="fm-hint">No managers assigned.</p> : (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px" }}>
          {list.map((m) => (
            <li key={m.userId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
              <span><strong>{m.name || "—"}</strong><br /><span className="fm-hint">{m.email}</span></span>
              <button className="act-btn act-btn--danger" title="Remove" disabled={busy} onClick={() => remove(m)}><FaTrash /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="fm-field">
        <label className="fm-label" htmlFor="mgr-email">Assign a manager by email</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input id="mgr-email" className="fm-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="manager@example.com" />
          <button className="ps-btn" disabled={busy || !email.trim()} onClick={add}>Assign</button>
        </div>
        <p className="fm-hint">The person needs a manager account (create one under Users). They then also appear in the owner's Managers list.</p>
      </div>
    </Modal>
  );
}
