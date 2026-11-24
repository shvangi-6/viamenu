import { useState } from 'react';
import {
  FaTrash,
  FaEye,
  FaTrashRestore,
  FaUserTimes,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaInfoCircle,
  FaUsers,
  FaClock
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import './TrashList.css';
import axiosInstance from '../../../utils/axiosInstance';
import LinkedData from '../../../components/common/LinkedData';
import PageShell from '../../../components/common/PageShell';
import StatsCard from '../../../components/common/StatsCard';
import FilterBar from '../../../components/common/FilterBar';
import DataTable from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import Pagination from '../../../components/common/Pagination';
import { useDataFetch, useDebounce } from '../../../hooks/useDataFetch';
import { useSortState } from '../../../hooks/useSortState';
import { userColumn } from '../userColumns';

export default function TrashList() {
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalLoading, setModalLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteBlocked, setDeleteBlocked] = useState(true);
  const search = useDebounce(searchTerm);
  const sort = useSortState('users-trash', 'deletedAt', 'desc');

  const params = {
    page: currentPage, limit: 10, sortBy: sort.sortBy, sortOrder: sort.sortOrder,
    ...(search && { search }), ...(roleFilter && { role: roleFilter }),
  };
  const { data: trashedUsers, loading, metadata, refetch } = useDataFetch('/admin/users/trash/list', 'users', params);

  const handleRestoreUser = async () => {
    if (!selectedUser) return;

    setModalLoading(true);

    try {
      await axiosInstance.patch(`/admin/users/trash/${selectedUser.id}/restore`);
      toast.success(`User "${selectedUser.username || selectedUser.email}" restored successfully!`);
      setShowRestoreModal(false);
      setSelectedUser(null);
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to restore user');
      console.error('Error restoring user:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!selectedUser) return;

    setDeleteLoading(true);

    try {
      await axiosInstance.delete(`/admin/users/trash/${selectedUser.id}/permanent`);
      toast.success(`User "${selectedUser.username || selectedUser.email}" permanently deleted!`);
      setShowPermanentDeleteModal(false);
      setSelectedUser(null);
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to permanently delete user');
      console.error('Error permanently deleting user:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleRestoreClick = (user) => {
    setSelectedUser(user);
    setShowRestoreModal(true);
  };

  const handlePermanentDeleteClick = (user) => {
    setSelectedUser(user);
    setShowPermanentDeleteModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Same role chips as every other User Management list.
  const getRoleBadge = (role) => <StatusBadge status={role} />;

  const daysInTrash = (d) => Math.floor((new Date() - new Date(d)) / (1000 * 60 * 60 * 24));

  const columns = [
    userColumn('User'),
    { key: 'phone', label: 'Phone', sort: 'phone' },
    { key: 'role', label: 'Role', sort: 'role', render: (v) => getRoleBadge(v) },
    {
      key: 'deletedAt',
      label: 'Deleted Date',
      sort: 'deletedAt',
      render: (v) => (
        <div className="nc-body">
          <span>{formatDate(v)}</span>
          <span className="nc-sub"><FaClock /> {formatRelativeTime(v)}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_v, user) => (
        <div className="act-row">
          <button className="act-btn act-btn--ghost" onClick={() => handleViewUser(user)} title="View Details">
            <FaEye />
          </button>
          <button className="act-btn act-btn--success" onClick={() => handleRestoreClick(user)} title="Restore User">
            <FaTrashRestore />
          </button>
          <button className="act-btn act-btn--danger" onClick={() => handlePermanentDeleteClick(user)} title="Permanently Delete">
            <FaUserTimes />
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageShell
      title="Trash List"
      subtitle="Deleted users — restore them or delete them permanently"
      stats={
        <>
          <StatsCard icon={FaTrash} label="Trashed Users" value={metadata.total_records} color="#ef4444" />
          <StatsCard icon={FaClock} label="Deleted (Last 7 days)" value={trashedUsers.filter((u) => daysInTrash(u.deletedAt) <= 7).length} color="#f59e0b" />
          <StatsCard icon={FaUsers} label="Deleted Owners" value={trashedUsers.filter((u) => u.role === 'owner').length} color="#3b82f6" />
        </>
      }
    >
      <FilterBar
        search={searchTerm}
        onSearch={(v) => { setSearchTerm(v); setCurrentPage(1); }}
        placeholder="Search by name, email or phone…"
        filters={[
          {
            key: 'role',
            value: roleFilter,
            placeholder: 'All Roles',
            onChange: (v) => { setRoleFilter(v); setCurrentPage(1); },
            options: [
              { value: 'owner', label: 'Owner' },
              { value: 'manager', label: 'Manager' },
              { value: 'guest', label: 'Guest' },
            ],
          },
        ]}
        onReset={() => { setSearchTerm(''); setRoleFilter(''); sort.resetSort(); setCurrentPage(1); }}
      />
      <DataTable onRowClick={(user) => handleViewUser(user)}
        columns={columns}
        data={trashedUsers}
        loading={loading}
        sort={sort}
        emptyText={searchTerm || roleFilter ? 'No trashed users found matching your criteria' : 'Trash is empty'}
      />
      <Pagination metadata={metadata} onPageChange={setCurrentPage} />

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <FaTrash className="me-2 text-danger" />
                  Deleted User Details
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowViewModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="user-details-view">
                  <div className="user-header">
                    <div className="user-avatar-large trash-avatar-large">
                      {(selectedUser.username || selectedUser.name || selectedUser.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info-large">
                      <h4 className="user-title">{selectedUser.username || selectedUser.name || 'N/A'}</h4>
                      <div className="user-badges">
                        {getRoleBadge(selectedUser.role)}
                        <span className="badge bg-danger badge-sm">
                          <FaTrash className="me-1" /> Deleted
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="details-grid">
                    <div className="detail-row">
                      <span className="detail-label">
                        <FaEnvelope className="me-2" />
                        Email:
                      </span>
                      <span className="detail-value">{selectedUser.email}</span>
                    </div>
                    {selectedUser.phone && (
                      <div className="detail-row">
                        <span className="detail-label">
                          <FaPhone className="me-2" />
                          Phone:
                        </span>
                        <span className="detail-value">{selectedUser.phone}</span>
                      </div>
                    )}
                    {selectedUser.companyName && (
                      <div className="detail-row">
                        <span className="detail-label">Company:</span>
                        <span className="detail-value">{selectedUser.companyName}</span>
                      </div>
                    )}
                    {selectedUser.country && (
                      <div className="detail-row">
                        <span className="detail-label">Country:</span>
                        <span className="detail-value">{selectedUser.country}</span>
                      </div>
                    )}
                    {selectedUser.gender && (
                      <div className="detail-row">
                        <span className="detail-label">Gender:</span>
                        <span className="detail-value">
                          {selectedUser.gender.charAt(0).toUpperCase() + selectedUser.gender.slice(1)}
                        </span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label">
                        <FaCalendarAlt className="me-2" />
                        Created:
                      </span>
                      <span className="detail-value">{formatDate(selectedUser.createdAt)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">
                        <FaTrash className="me-2 text-danger" />
                        Deleted:
                      </span>
                      <span className="detail-value">
                        {formatDate(selectedUser.deletedAt)}
                        <span className="relative-time-block">
                          ({formatRelativeTime(selectedUser.deletedAt)})
                        </span>
                      </span>
                    </div>
                    {selectedUser.deletedAt && (
                      <div className="detail-row highlight-row">
                        <span className="detail-label">Days in Trash:</span>
                        <span className="detail-value text-warning">
                          {Math.floor((new Date() - new Date(selectedUser.deletedAt)) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="warning-message">
                    <FaInfoCircle className="warning-icon" />
                    <p>This user has been deleted. You can restore them or permanently remove them from the system.</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => {
                    setShowViewModal(false);
                    handleRestoreClick(selectedUser);
                  }}
                >
                  <FaTrashRestore className="me-2" />
                  Restore User
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    setShowViewModal(false);
                    handlePermanentDeleteClick(selectedUser);
                  }}
                >
                  <FaUserTimes className="me-2" />
                  Permanent Delete
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-success">
                  <FaTrashRestore className="me-2" />
                  Restore User
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRestoreModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="restore-confirmation">
                  <p className="confirmation-text">
                    Are you sure you want to restore <strong>"{selectedUser.username || selectedUser.email}"</strong>?
                  </p>
                  <p className="confirmation-subtext">
                    This user will be restored to active users list and will be able to access the system again.
                  </p>
                  <div className="user-preview">
                    <div className="preview-item">
                      <strong>Email:</strong> {selectedUser.email}
                    </div>
                    {selectedUser.username && (
                      <div className="preview-item">
                        <strong>Username:</strong> {selectedUser.username}
                      </div>
                    )}
                    {selectedUser.companyName && (
                      <div className="preview-item">
                        <strong>Company:</strong> {selectedUser.companyName}
                      </div>
                    )}
                    <div className="preview-item">
                      <strong>Deleted on:</strong> {formatDate(selectedUser.deletedAt)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary cancel-btn"
                  onClick={() => setShowRestoreModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success restore-confirm-btn"
                  onClick={handleRestoreUser}
                  disabled={modalLoading}
                >
                  {modalLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Restoring...
                    </>
                  ) : (
                    'Restore'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {showPermanentDeleteModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger">
                  <FaUserTimes className="me-2" />
                  Permanently Delete User
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPermanentDeleteModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="permanent-delete-confirmation">
                  <p className="confirmation-text text-danger">
                    ⚠️ This action cannot be undone!
                  </p>
                  <p className="confirmation-text">
                    Are you sure you want to permanently delete <strong>"{selectedUser.username || selectedUser.email}"</strong>?
                  </p>
                  <p className="confirmation-subtext">
                    This will permanently remove all data associated with this user from the system. This action is irreversible.
                  </p>
                  <LinkedData url={`/admin/users/${selectedUser.id}/links`} onBlockedChange={setDeleteBlocked} />
                  <div className="user-preview">
                    <div className="preview-item">
                      <strong>Email:</strong> {selectedUser.email}
                    </div>
                    {selectedUser.username && (
                      <div className="preview-item">
                        <strong>Username:</strong> {selectedUser.username}
                      </div>
                    )}
                    <div className="preview-item">
                      <strong>Deleted on:</strong> {formatDate(selectedUser.deletedAt)}
                    </div>
                    <div className="preview-item">
                      <strong>Days in trash:</strong> {Math.floor((new Date() - new Date(selectedUser.deletedAt)) / (1000 * 60 * 60 * 24))} days
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary cancel-btn"
                  onClick={() => setShowPermanentDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger permanent-delete-confirm-btn"
                  onClick={handlePermanentDelete}
                  disabled={deleteLoading || deleteBlocked}
                >
                  {deleteLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Deleting Permanently...
                    </>
                  ) : (
                    'Permanently Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
