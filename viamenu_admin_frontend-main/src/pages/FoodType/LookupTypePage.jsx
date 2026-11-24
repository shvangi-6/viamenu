import { useState } from 'react';
import { FaEdit, FaTrash, FaPlus, FaEye, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Switch from 'react-switch';
import 'bootstrap/dist/css/bootstrap.min.css';
import PageShell from '../../components/common/PageShell';
import StatsCard from '../../components/common/StatsCard';
import FilterBar from '../../components/common/FilterBar';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import { useDataFetch, useDebounce } from '../../hooks/useDataFetch';
import { useSortState } from '../../hooks/useSortState';
import axiosInstance from '../../utils/axiosInstance';
import { fmtDate } from '../../utils/fmtDate';
import './LookupTypePage.css';

/**
 * One page for the six Food Catalog lookup tables (restaurant / service /
 * business / dish / diet types and cuisines) — they were six copies of the
 * same 700-line file. Each route passes its endpoint and labels.
 *
 * nameKey: the request field carrying the name — "type" everywhere except
 * the cuisine API, which expects "cuisineName".
 */
export default function LookupTypePage({ endpoint, nameKey = 'type', title, singular, subtitle, icon: Icon, namePlaceholder, sortKey }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);
  const sort = useSortState(sortKey);

  const params = {
    page, limit: 10, sortBy: sort.sortBy, sortOrder: sort.sortOrder,
    ...(debouncedSearch && { search: debouncedSearch }), ...(statusFilter && { status: statusFilter }),
  };
  const { data: types, loading, metadata, refetch } = useDataFetch(endpoint, 'types', params);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', status: true });
  const [toDelete, setToDelete] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const lower = singular.toLowerCase();

  const openAdd = () => { setEditing(null); setForm({ name: '', description: '', status: true }); setShowModal(true); };
  const openEdit = (t) => { setEditing(t); setForm({ name: t.name, description: t.description || '', status: t.status === 'active' }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      if (editing) {
        await axiosInstance.put(`${endpoint}/${editing.id}`, {
          [nameKey]: form.name,
          description: form.description,
          status: form.status ? 'active' : 'inactive',
        });
        toast.success(`${singular} updated successfully!`);
      } else {
        await axiosInstance.post(endpoint, { [nameKey]: form.name, description: form.description });
        toast.success(`${singular} created successfully!`);
      }
      closeModal();
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(`${endpoint}/${toDelete.id}`);
      toast.success(`${singular} deleted successfully!`);
      setToDelete(null);
      refetch();
    } catch (error) {
      // 409 when restaurants still use it — the message says how many.
      toast.error(error.response?.data?.message || `Failed to delete ${lower}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleView = async (t) => {
    try {
      const res = await axiosInstance.get(`${endpoint}/${t.id}`);
      if (res.data.success && res.data.data) setViewing(res.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to fetch ${lower} details`);
    }
  };

  const handleStatusToggle = async (t) => {
    const newStatus = t.status === 'active' ? 'inactive' : 'active';
    try {
      await axiosInstance.put(`${endpoint}/${t.id}`, { [nameKey]: t.name, status: newStatus });
      toast.success(`Status changed to ${newStatus}`);
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const statusBadge = (status) =>
    status === 'active' ? (
      <span className="badge bg-success badge-sm"><FaCheckCircle className="me-1" /> Active</span>
    ) : (
      <span className="badge bg-secondary badge-sm"><FaTimesCircle className="me-1" /> Inactive</span>
    );

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sort: 'name',
      render: (_v, t) => (
        <div className="nc">
          <div className="av av--md av--square" style={{ background: '#2c8769' }}>{t.name.charAt(0).toUpperCase()}</div>
          <div className="nc-body">
            <span className="nc-name">{t.name}</span>
            <span className="nc-id">ID: {t.id}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (v) => v ? <span className="description-text" title={v}>{v}</span> : <span className="nc-sub">No description</span>,
    },
    {
      key: 'status',
      label: 'Active Status',
      sort: 'status',
      render: (_v, t) => (
        <Switch
          onChange={() => handleStatusToggle(t)}
          checked={t.status === 'active'}
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
    { key: 'createdAt', label: 'Created', sort: 'createdAt', render: (v) => fmtDate(v) },
    {
      key: 'actions',
      label: 'Actions',
      render: (_v, t) => (
        <div className="act-row">
          <button className="act-btn act-btn--ghost" onClick={() => handleView(t)} title="View Details"><FaEye /></button>
          <button className="act-btn act-btn--ghost" onClick={() => openEdit(t)} title="Edit"><FaEdit /></button>
          <button className="act-btn act-btn--danger" onClick={() => setToDelete(t)} title="Delete"><FaTrash /></button>
        </div>
      ),
    },
  ];

  return (
    <PageShell
      title={title}
      subtitle={subtitle}
      actions={
        <button className="ps-btn" onClick={openAdd}>
          <FaPlus /> Add {singular}
        </button>
      }
      stats={<StatsCard icon={Icon} label={`Total ${title}`} value={metadata.total_records} color="#2c8769" />}
    >
      <FilterBar
        search={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        placeholder={`Search ${title.toLowerCase()}…`}
        filters={[
          {
            key: 'status',
            value: statusFilter,
            placeholder: 'All Status',
            onChange: (v) => { setStatusFilter(v); setPage(1); },
            options: [
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ],
          },
        ]}
        onReset={() => { setSearch(''); setStatusFilter(''); sort.resetSort(); setPage(1); }}
      />
      <DataTable onRowClick={(t) => handleView(t)}
        columns={columns}
        data={types}
        loading={loading}
        sort={sort}
        emptyText={search || statusFilter ? `No ${title.toLowerCase()} found matching your criteria` : `No ${title.toLowerCase()} yet — click "Add ${singular}"`}
      />
      <Pagination metadata={metadata} onPageChange={setPage} />

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <Icon className="me-2" />
                  {editing ? `Edit ${singular}` : `Add ${singular}`}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">{singular} Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder={namePlaceholder}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description (Optional)</label>
                    <textarea
                      className="form-control"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder={`Brief description of the ${lower}`}
                      rows="3"
                      maxLength={500}
                    />
                  </div>

                  {editing && (
                    <div className="form-group">
                      <label className="form-label d-block mb-2">Status</label>
                      <div className="status-toggle-group">
                        <Switch
                          onChange={(checked) => setForm({ ...form, status: checked })}
                          checked={form.status}
                          className="modal-toggle"
                          onColor="#28a745"
                          offColor="#6c757d"
                          height={24}
                          width={48}
                          handleDiameter={20}
                        />
                        <span className="toggle-label">{form.status ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary cancel-btn" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary save-btn" disabled={modalLoading}>
                    {modalLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        {editing ? 'Updating...' : 'Creating...'}
                      </>
                    ) : editing ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {toDelete && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger">
                  <FaTrash className="me-2" />
                  Delete {singular}
                </h5>
                <button type="button" className="btn-close" onClick={() => setToDelete(null)} />
              </div>
              <div className="modal-body">
                <div className="delete-confirmation">
                  <p className="confirmation-text">
                    Are you sure you want to delete <strong>"{toDelete.name}"</strong>?
                  </p>
                  <p className="confirmation-subtext">
                    This cannot be undone. A {lower} that restaurants still use can't be deleted — deactivate it instead.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary cancel-btn" onClick={() => setToDelete(null)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger delete-confirm-btn" onClick={handleDelete} disabled={deleteLoading}>
                  {deleteLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Deleting...
                    </>
                  ) : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <Icon className="me-2" />
                  {singular} Details
                </h5>
                <button type="button" className="btn-close" onClick={() => setViewing(null)} />
              </div>
              <div className="modal-body">
                <div className="type-details-view">
                  <div className="type-header">
                    <div className="type-avatar-large">{viewing.name.charAt(0).toUpperCase()}</div>
                    <div className="type-info-large">
                      <h4 className="type-title">{viewing.name}</h4>
                      {statusBadge(viewing.status)}
                    </div>
                  </div>

                  <div className="details-grid">
                    <div className="detail-row">
                      <span className="detail-label">ID:</span>
                      <span className="detail-value nc-id">{viewing.id}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Description:</span>
                      <span className="detail-value">{viewing.description || 'No description'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Status:</span>
                      <span className="detail-value">{viewing.status === 'active' ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Created:</span>
                      <span className="detail-value">{formatDate(viewing.createdAt)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Last Updated:</span>
                      <span className="detail-value">{formatDate(viewing.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setViewing(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
