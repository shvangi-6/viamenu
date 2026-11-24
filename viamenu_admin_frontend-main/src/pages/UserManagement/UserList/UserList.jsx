import React, { useState } from 'react';
import {
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaUsers,
  FaInfoCircle,
  FaUserCheck,
  FaUserTimes,
  FaEnvelope,
  FaPhone,
  FaGlobe,
  FaVenusMars,
  FaBuilding,
  FaCalendarAlt,
  FaLockOpen,
  FaLock,
  FaEdit,
  FaUserPlus,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import PageShell from '../../../components/common/PageShell';
import StatsCard from '../../../components/common/StatsCard';
import FilterBar from '../../../components/common/FilterBar';
import DataTable from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import Pagination from '../../../components/common/Pagination';
import { useDataFetch, useDebounce } from '../../../hooks/useDataFetch';
import { useSortState } from '../../../hooks/useSortState';
import { userColumn } from '../userColumns';
import { fmtDate } from '../../../utils/fmtDate';
import axiosInstance from '../../../utils/axiosInstance';
import LinkedData from '../../../components/common/LinkedData';
import RecordModal from '../../../components/common/RecordModal';
import './UserList.css';

// `role` pins the list to one role — the sidebar's Guests page is this list with role="guest".
const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'manager', label: 'Manager' },
  { value: 'guest', label: 'Guest' },
];

export default function UserList({ role: fixedRole }) {
  const [showViewModal, setShowViewModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalLoading, setModalLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 500);
  const sort = useSortState(fixedRole ? `users-${fixedRole}` : 'users');

  const params = {
    page: currentPage,
    limit: 10,
    role: fixedRole || roleFilter,
    search: debouncedSearch,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
  };

  const { data: users, loading, metadata, refetch } = useDataFetch('/admin/users', 'users', params);
  const [editUser, setEditUser] = useState(null); // 'new' | user

  const fetchUserDetails = async (id) => {
    try {
      const response = await axiosInstance.get(`/admin/users/${id}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch user details');
    }
    return null;
  };

  const handleBlockUser = async () => {
    if (!selectedUser) return;
    setModalLoading(true);
    try {
      const newBlockStatus = !selectedUser.isBlocked;
      await axiosInstance.patch(`/admin/users/${selectedUser.id}/block`, {
        isBlocked: newBlockStatus,
        reason: newBlockStatus ? blockReason : '',
      });
      toast.success(`User ${newBlockStatus ? 'blocked' : 'unblocked'} successfully!`);
      setShowBlockModal(false);
      setBlockReason('');
      setSelectedUser(null);
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    } finally {
      setModalLoading(false);
    }
  };

  const [deleteBlocked, setDeleteBlocked] = useState(true);

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(`/admin/users/${selectedUser.id}`);
      toast.success('User moved to trash successfully!');
      setShowDeleteModal(false);
      setSelectedUser(null);
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewUser = async (user) => {
    const detailedUser = await fetchUserDetails(user.id);
    if (detailedUser) {
      setSelectedUser(detailedUser);
      setShowViewModal(true);
    }
  };

  const handleBlockClick = (user) => {
    setSelectedUser(user);
    setBlockReason(user.blockReason || '');
    setShowBlockModal(true);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };


  const activeCount  = users.filter((u) => !u.isBlocked && !u.isDeleted).length;
  const blockedCount = users.filter((u) => u.isBlocked && !u.isDeleted).length;
  const deletedCount = users.filter((u) => u.isDeleted).length;

  const columns = [
    userColumn('User'),
    { key: 'phone', label: 'Phone', sort: 'phone' },
    {
      key: 'role',
      label: 'Role',
      sort: 'role',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'isBlocked',
      label: 'Status',
      sort: 'isBlocked',
      render: (_val, user) => (
        <div className="status-cell">
          <StatusBadge status={user.isDeleted ? 'deleted' : user.isBlocked ? 'blocked' : 'active'} />
          {user.isBlocked && user.blockReason && (
            <FaInfoCircle className="info-icon" title={`Block reason: ${user.blockReason}`} />
          )}
        </div>
      ),
    },
    {
      key: 'isRegistered',
      label: 'Registration',
      sort: 'isRegistered',
      render: (_val, user) =>
        user.isRegistered ? (
          <StatusBadge status="complete" />
        ) : (
          <StatusBadge status="incomplete" label={`Step ${user.registrationStep}/5`} />
        ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      sort: 'createdAt',
      render: (val) => fmtDate(val),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_val, user) => (
        <div className="action-buttons">
          <button className="act-btn act-btn--ghost" onClick={() => handleViewUser(user)} title="View Details">
            <FaEye />
          </button>
          {!user.isDeleted && (
            <>
              <button className="act-btn act-btn--ghost" onClick={() => setEditUser(user)} title="Edit User">
                <FaEdit />
              </button>
              <button
                className={`act-btn ${user.isBlocked ? 'act-btn--success' : 'act-btn--danger'}`}
                onClick={() => handleBlockClick(user)}
                title={user.isBlocked ? 'Unblock User' : 'Block User'}
              >
                {user.isBlocked ? <FaLockOpen /> : <FaLock />}
              </button>
              <button className="act-btn act-btn--danger" onClick={() => handleDeleteClick(user)} title="Delete User">
                <FaTrash />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageShell
        title={fixedRole === 'guest' ? 'Guests' : 'User Management'}
        subtitle={fixedRole === 'guest' ? 'Users registered with the Guest role' : 'Manage all registered users and their accounts'}
        actions={<button className="ps-btn" onClick={() => setEditUser('new')}><FaUserPlus /> Add user</button>}
        stats={
          <>
            <StatsCard icon={FaUsers}      label="Total Users"   value={metadata.total_records} color="#2c8769" />
            <StatsCard icon={FaUserCheck}  label="Active Users"  value={activeCount}  color="#22c55e" />
            <StatsCard icon={FaUserTimes}  label="Blocked Users" value={blockedCount} color="#ef4444" />
            <StatsCard icon={FaTrash}      label="Deleted Users" value={deletedCount} color="#94a3b8" />
          </>
        }
      >
        <FilterBar
          search={search}
          onSearch={(v) => { setSearch(v); setCurrentPage(1); }}
          placeholder="Search by username, email, or phone…"
          filters={fixedRole ? [] : [
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
          onReset={() => { setSearch(''); setRoleFilter(''); setCurrentPage(1); }}
        />

        <DataTable onRowClick={(user) => handleViewUser(user)}
          columns={columns}
          data={users}
          loading={loading}
          sort={sort}
          emptyText={search || roleFilter ? 'No users found matching your criteria' : 'No users found'}
        />

        <Pagination metadata={metadata} onPageChange={setCurrentPage} />
      </PageShell>

      {editUser && (
        <RecordModal
          title={editUser === 'new' ? 'Add user' : `Edit user — ${editUser.email}`}
          method={editUser === 'new' ? 'post' : 'put'}
          url={editUser === 'new' ? '/admin/users' : `/admin/users/${editUser.id}`}
          saveLabel={editUser === 'new' ? 'Create user' : 'Save'}
          initial={editUser === 'new' ? { role: fixedRole || 'owner' } : { ...editUser, name: editUser.name ?? '', phone: editUser.phone ?? '', companyName: editUser.companyName ?? '' }}
          fields={[
            ...(editUser === 'new' ? [{ key: 'email', label: 'Email', type: 'email', required: true }] : []),
            { key: 'name', label: 'Name', required: editUser === 'new' },
            { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+49 …' },
            { key: 'role', label: 'Role', type: 'select', options: ROLE_OPTIONS, hint: 'An owner who still owns restaurants keeps the owner role.' },
            { key: 'companyName', label: 'Company' },
            {
              key: 'password',
              label: editUser === 'new' ? 'Password' : 'New password (optional)',
              type: 'password',
              required: editUser === 'new',
              hint: '8–15 characters with upper and lower case, a number and a special character. Give it to the user; they can change it in the app.',
            },
          ]}
          onClose={() => setEditUser(null)}
          onSaved={() => { setEditUser(null); refetch(); }}
        />
      )}

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <FaUsers className="me-2" />
                  User Details
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowViewModal(false)} />
              </div>
              <div className="modal-body">
                <div className="user-details-view">
                  <div className="user-header">
                    <div className="user-avatar-large">
                      {(selectedUser.username || selectedUser.name || selectedUser.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info-large">
                      <h4 className="user-title">{selectedUser.username || selectedUser.name || 'N/A'}</h4>
                      <div className="user-badges">
                        <StatusBadge status={selectedUser.role} />
                        <StatusBadge status={selectedUser.isDeleted ? 'deleted' : selectedUser.isBlocked ? 'blocked' : 'active'} />
                        <StatusBadge status={selectedUser.isRegistered ? 'complete' : 'incomplete'} label={selectedUser.isRegistered ? undefined : `Step ${selectedUser.registrationStep}/5`} />
                      </div>
                    </div>
                  </div>

                  <div className="details-grid">
                    <div className="detail-row">
                      <span className="detail-label"><FaEnvelope className="me-2" />Email:</span>
                      <span className="detail-value">{selectedUser.email}</span>
                    </div>
                    {selectedUser.phone && (
                      <div className="detail-row">
                        <span className="detail-label"><FaPhone className="me-2" />Phone:</span>
                        <span className="detail-value">{selectedUser.phone}</span>
                      </div>
                    )}
                    {selectedUser.country && (
                      <div className="detail-row">
                        <span className="detail-label"><FaGlobe className="me-2" />Country:</span>
                        <span className="detail-value">{selectedUser.country}</span>
                      </div>
                    )}
                    {selectedUser.gender && (
                      <div className="detail-row">
                        <span className="detail-label"><FaVenusMars className="me-2" />Gender:</span>
                        <span className="detail-value">
                          {selectedUser.gender.charAt(0).toUpperCase() + selectedUser.gender.slice(1)}
                        </span>
                      </div>
                    )}
                    {selectedUser.companyName && (
                      <div className="detail-row">
                        <span className="detail-label"><FaBuilding className="me-2" />Company:</span>
                        <span className="detail-value">{selectedUser.companyName}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label"><FaCalendarAlt className="me-2" />Email Verified:</span>
                      <span className="detail-value">
                        {selectedUser.isEmailVerified ? (
                          <FaCheckCircle className="text-success" />
                        ) : (
                          <FaTimesCircle className="text-danger" />
                        )}
                      </span>
                    </div>
                    {selectedUser.isBlocked && selectedUser.blockReason && (
                      <div className="detail-row">
                        <span className="detail-label">Block Reason:</span>
                        <span className="detail-value text-warning">{selectedUser.blockReason}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label">Created:</span>
                      <span className="detail-value">{formatDate(selectedUser.createdAt)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Last Updated:</span>
                      <span className="detail-value">{formatDate(selectedUser.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                {!selectedUser.isDeleted && (
                  <button
                    type="button"
                    className={`btn ${selectedUser.isBlocked ? 'btn-success' : 'btn-warning'}`}
                    onClick={() => { setShowViewModal(false); handleBlockClick(selectedUser); }}
                  >
                    {selectedUser.isBlocked ? <FaUserCheck className="me-2" /> : <FaUserTimes className="me-2" />}
                    {selectedUser.isBlocked ? 'Unblock User' : 'Block User'}
                  </button>
                )}
                <button type="button" className="btn btn-secondary" onClick={() => setShowViewModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block/Unblock Modal */}
      {showBlockModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className={`modal-title ${selectedUser.isBlocked ? 'text-success' : 'text-warning'}`}>
                  {selectedUser.isBlocked ? <FaUserCheck className="me-2" /> : <FaUserTimes className="me-2" />}
                  {selectedUser.isBlocked ? 'Unblock User' : 'Block User'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowBlockModal(false)} />
              </div>
              <div className="modal-body">
                <div className="block-confirmation">
                  <p className="confirmation-text">
                    Are you sure you want to {selectedUser.isBlocked ? 'unblock' : 'block'}
                    <strong> "{selectedUser.username || selectedUser.email}"</strong>?
                  </p>
                  {!selectedUser.isBlocked && (
                    <div className="form-group mt-3">
                      <label className="form-label">Reason for blocking (Optional)</label>
                      <textarea
                        className="form-control"
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        placeholder="Enter reason for blocking this user..."
                        rows="3"
                      />
                    </div>
                  )}
                  {selectedUser.isBlocked && selectedUser.blockReason && (
                    <div className="alert alert-info mt-3">
                      <strong>Previous block reason:</strong> {selectedUser.blockReason}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary cancel-btn"
                  onClick={() => { setShowBlockModal(false); setBlockReason(''); }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn ${selectedUser.isBlocked ? 'btn-success' : 'btn-warning'} confirm-btn`}
                  onClick={handleBlockUser}
                  disabled={modalLoading}
                >
                  {modalLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      {selectedUser.isBlocked ? 'Unblocking...' : 'Blocking...'}
                    </>
                  ) : (
                    selectedUser.isBlocked ? 'Unblock' : 'Block'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger">
                  <FaTrash className="me-2" />
                  Deleted User will be moved to Trash
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)} />
              </div>
              <div className="modal-body">
                <div className="delete-confirmation">
                  <p className="confirmation-text">
                    Are you sure you want to move user <strong>"{selectedUser.username || selectedUser.email}"</strong> to trash?
                  </p>
                  <p className="confirmation-subtext">
                    The user will be moved to the trash and can be restored later.
                  </p>
                  <LinkedData url={`/admin/users/${selectedUser.id}/links`} onBlockedChange={setDeleteBlocked} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary cancel-btn" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger delete-confirm-btn"
                  onClick={handleDeleteUser}
                  disabled={deleteLoading || deleteBlocked}
                >
                  {deleteLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
