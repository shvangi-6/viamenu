import { useState } from "react";
import { FaTags, FaTimes, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import Switch from "react-switch";
import { toast } from "react-toastify";
import PageShell from "../../components/common/PageShell";
import StatsCard from "../../components/common/StatsCard";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import { useDataFetch, useDebounce } from "../../hooks/useDataFetch";
import { useSortState } from "../../hooks/useSortState";
import axiosInstance from "../../utils/axiosInstance";
import { getFileUrl } from "../../utils/getFileUrl";
import { fmtDate } from "../../utils/fmtDate";
import { tagNameColumn } from "./tagColumns";
import "./GlobalTags.css";

export default function GlobalTags() {
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebounce(searchInput);
  const sort = useSortState("tags-global", "name", "asc");

  const params = { page, limit: 10, type: "global", sortBy: sort.sortBy, sortOrder: sort.sortOrder, ...(search && { search }) };
  const { data: tags, loading, metadata, refetch } = useDataFetch("/admin/tags/list", "tags", params);

  // ── Add / Edit Global Tag modal ───────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [iconUrl, setIconUrl] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  // ── Delete + inline status toggle ─────────────────────────────────────
  const [tagToDelete, setTagToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axiosInstance.delete(`/admin/tags/delete/${tagToDelete.id}`);
      toast.success("Global tag deleted");
      setTagToDelete(null);
      refetch();
    } catch (err) {
      // 409 when owners or dishes still use it — the message says so.
      toast.error(err.response?.data?.message || "Failed to delete tag");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (tag) => {
    setTogglingId(tag.id);
    try {
      await axiosInstance.put(`/admin/tags/update/${tag.id}`, { isActive: !tag.isActive });
      toast.success(`Tag ${tag.isActive ? "deactivated" : "activated"}`);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const columns = [
    tagNameColumn,
    {
      key: "isActive",
      label: "Active Status",
      sort: "isActive",
      render: (_v, t) => (
        <Switch
          onChange={() => handleToggleActive(t)}
          checked={!!t.isActive}
          disabled={togglingId === t.id}
          onColor="#2c8769"
          offColor="#cbd5e1"
          height={22}
          width={44}
          handleDiameter={18}
          uncheckedIcon={false}
          checkedIcon={false}
        />
      ),
    },
    { key: "createdAt", label: "Created", sort: "createdAt", render: (v) => fmtDate(v) },
    {
      key: "actions",
      label: "Actions",
      render: (_v, t) => (
        <div className="act-row">
          <button className="act-btn act-btn--ghost" onClick={() => handleEdit(t)} title="Edit tag">
            <FaEdit />
          </button>
          <button className="act-btn act-btn--danger" onClick={() => setTagToDelete(t)} title="Delete tag">
            <FaTrash />
          </button>
        </div>
      ),
    },
  ];

  const resetForm = () => {
    setEditingTag(null);
    setName("");
    setIsActive(true);
    setIconUrl(null);
    setIconPreview(null);
    setUploadProgress(0);
    setUploading(false);
  };

  const openModal = () => { resetForm(); setShowModal(true); };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    setName(tag.name || "");
    setIsActive(tag.isActive === true);
    setIconUrl(tag.icon || null);
    setIconPreview(null);
    setUploadProgress(0);
    setUploading(false);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving || uploading) return;
    setShowModal(false);
    resetForm();
  };

  const handleIconChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPEG, PNG, WEBP, GIF)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    setIconPreview(URL.createObjectURL(file));
    setIconUrl(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "icons");
      const res = await axiosInstance.post("/admin/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (p) => setUploadProgress(Math.round((p.loaded * 100) / p.total)),
      });
      if (res.data.success && res.data.data?.url) {
        setIconUrl(res.data.data.url);
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload icon");
      setIconPreview(null);
      setIconUrl(null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Tag name must be at least 2 characters");
      return;
    }
    setSaving(true);
    try {
      if (editingTag) {
        await axiosInstance.put(`/admin/tags/update/${editingTag.id}`, {
          name: name.trim(),
          isActive,
          ...(iconUrl && { icon: iconUrl }),
        });
        toast.success("Global tag updated successfully!");
      } else {
        await axiosInstance.post("/admin/tags/create", {
          name: name.trim(),
          ...(iconUrl && { icon: iconUrl }),
        });
        toast.success("Global tag created successfully!");
        setPage(1);
      }
      setShowModal(false);
      resetForm();
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save tag");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title="Global Tags"
      subtitle={`${metadata.total_records} global tags in the system`}
      actions={
        <button className="ps-btn" onClick={openModal}>
          <FaPlus /> Add Global Tag
        </button>
      }
      stats={
        <>
          <StatsCard icon={FaTags} label="Global Tags"   value={metadata.total_records} color="#2c8769" />
          <StatsCard icon={FaTags} label="Active (page)" value={tags.filter((t) => t.isActive).length} color="#3b82f6" />
        </>
      }
    >
      <FilterBar
        search={searchInput}
        onSearch={(v) => { setSearchInput(v); setPage(1); }}
        placeholder="Search tags…"
        onReset={() => { setSearchInput(""); sort.resetSort(); setPage(1); }}
      />
      <DataTable onRowClick={(t) => handleEdit(t)} columns={columns} data={tags} loading={loading} sort={sort} emptyText="No global tags found" />
      <Pagination metadata={metadata} onPageChange={setPage} />

      {/* Delete confirmation */}
      {tagToDelete && (
        <div className="gt-modal-overlay" onClick={() => !deleting && setTagToDelete(null)}>
          <div className="gt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gt-modal-header">
              <h3 className="gt-modal-title"><FaTrash /> Delete Global Tag</h3>
              <button className="gt-modal-close" onClick={() => setTagToDelete(null)} disabled={deleting}>
                <FaTimes />
              </button>
            </div>
            <div className="gt-modal-body">
              <p>Delete <strong>"{tagToDelete.name}"</strong>? This cannot be undone.</p>
              <p className="gt-upload-hint">
                A tag that owners have added or that is used on dishes can't be deleted — deactivate it instead.
              </p>
            </div>
            <div className="gt-modal-footer">
              <button type="button" className="gt-btn" onClick={() => setTagToDelete(null)} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="gt-btn gt-btn--danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Global Tag modal */}
      {showModal && (
        <div className="gt-modal-overlay" onClick={closeModal}>
          <div className="gt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gt-modal-header">
              <h3 className="gt-modal-title">
                {editingTag ? <FaEdit /> : <FaTags />} {editingTag ? "Edit Global Tag" : "Add Global Tag"}
              </h3>
              <button className="gt-modal-close" onClick={closeModal} disabled={saving || uploading}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="gt-modal-body">
                <div className="gt-field">
                  <label className="gt-label">Tag Name *</label>
                  <input
                    className="gt-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Vegan, Spicy, Popular"
                    autoFocus
                    disabled={uploading}
                  />
                </div>

                <div className="gt-field">
                  <label className="gt-label">Tag Icon</label>
                  <div className="gt-icon-upload">
                    {(iconPreview || iconUrl) ? (
                      <img src={getFileUrl(iconPreview || iconUrl)} alt="preview" className="gt-icon-preview" />
                    ) : (
                      <div className="gt-icon-preview gt-icon-preview--empty"><FaTags /></div>
                    )}
                    <div className="gt-icon-upload-info">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleIconChange}
                        disabled={uploading}
                      />
                      {uploading ? (
                        <div className="gt-progress">
                          <div className="gt-progress-bar" style={{ width: `${uploadProgress}%` }} />
                          <span className="gt-progress-text">Uploading… {uploadProgress}%</span>
                        </div>
                      ) : iconUrl ? (
                        <small className="gt-upload-ok">✓ Uploaded</small>
                      ) : (
                        <small className="gt-upload-hint">Optional. Max 5MB · JPEG, PNG, WEBP, GIF</small>
                      )}
                    </div>
                  </div>
                </div>

                {editingTag && (
                  <div className="gt-field">
                    <label className="gt-label">Status</label>
                    <div className="gt-toggle-row">
                      <Switch
                        onChange={(checked) => setIsActive(checked)}
                        checked={isActive}
                        onColor="#2c8769"
                        offColor="#cbd5e1"
                        height={22}
                        width={44}
                        handleDiameter={18}
                        uncheckedIcon={false}
                        checkedIcon={false}
                        disabled={saving}
                      />
                      <span className="gt-toggle-label">{isActive ? "Active" : "Inactive"}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="gt-modal-footer">
                <button type="button" className="gt-btn" onClick={closeModal} disabled={saving || uploading}>
                  Cancel
                </button>
                <button type="submit" className="gt-btn gt-btn--primary" disabled={saving || uploading || name.trim().length < 2}>
                  {saving
                    ? (editingTag ? "Saving…" : "Creating…")
                    : (editingTag ? "Save Changes" : "Create Tag")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
