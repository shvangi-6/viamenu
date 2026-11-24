import React, { useState, useEffect } from 'react';
import { rowClick } from "../../utils/rowClick";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaFilter,
  FaCheckCircle,
  FaTimesCircle,
  FaSort,
  FaEye,
  FaTimes,
  FaTag,
  FaInfoCircle,
  FaUpload
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Switch from 'react-switch';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Tags.css';
import axiosInstance from '../../utils/axiosInstance';
import { getFileUrl } from '../../utils/getFileUrl';

export default function Tags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [currentTag, setCurrentTag] = useState({
    name: '',
    icon: null,
    iconPreview: null,
    iconUrl: null,
    isActive: true
  });
  const [tagToDelete, setTagToDelete] = useState(null);
  const [viewTag, setViewTag] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [perPage] = useState(10);
  const [modalLoading, setModalLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchTags();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchTags();
  }, [currentPage, statusFilter, sortBy, sortOrder]);

  const fetchTags = async () => {
    try {
      setLoading(true);

      const response = await axiosInstance.get(`/admin/tags/list`, {
        params: {
          page: currentPage,
          limit: perPage,
          search: searchTerm,
          status: statusFilter !== "all" ? statusFilter : undefined,
          sortBy,
          sortOrder
        },
      });

      if (response.data.success) {
        // Handle case when data is null (no records found)
        if (response.data.data === null) {
          setTags([]);
          setTotalPages(1);
          setTotalRecords(0);
        } else {
          setTags(response.data.data.tags || []);
          setTotalPages(response.data.data.total_page || 1);
          setTotalRecords(response.data.data.total_records || 0);
        }
      } else {
        setTags([]);
        toast.error(response.data.message || 'Failed to fetch tags');
      }
    } catch (error) {
      setTags([]);
      // Only show error toast if it's not a "no results" scenario
      if (error.response?.data?.message !== 'No tags found') {
        toast.error(error.response?.data?.message || 'Failed to fetch tags');
      }
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadIcon = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'icons');

    try {
      const response = await axiosInstance.post('/admin/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      if (response.data.success && response.data.data.url) {
        return response.data.data.url;
      } else {
        throw new Error('Upload failed: No URL returned');
      }
    } catch (error) {
      console.error('Icon upload error:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload icon');
    }
  };

  const handleIconChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG, WEBP, GIF)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }

      // Set preview immediately
      setCurrentTag({
        ...currentTag,
        icon: file,
        iconPreview: URL.createObjectURL(file),
        iconUrl: null
      });

      // Start upload immediately
      setIsUploading(true);
      setUploadProgress(0);
      
      try {
        const uploadedUrl = await uploadIcon(file);
        setCurrentTag(prev => ({
          ...prev,
          iconUrl: uploadedUrl
        }));
        // toast.success('Icon uploaded successfully!');
      } catch (error) {
        toast.error(error.message || 'Failed to upload icon');
        // Clear the icon selection if upload fails
        setCurrentTag(prev => ({
          ...prev,
          icon: null,
          iconPreview: null,
          iconUrl: null
        }));
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentTag.name.trim()) {
      toast.error('Tag name is required');
      return;
    }

    setModalLoading(true);

    try {
      // Use the uploaded icon URL if available, otherwise use existing icon from editing
      let iconUrl = currentTag.iconUrl;
      
      // If no iconUrl and we're editing, keep the existing icon
      if (!iconUrl && editingTag && editingTag.icon) {
        iconUrl = editingTag.icon;
      }

      // Prepare the data for tag creation/update
      const tagData = {
        name: currentTag.name.trim(),
        ...(iconUrl && { icon: iconUrl }),
        ...(editingTag && { isActive: currentTag.isActive })
      };

      let response;
      if (editingTag) {
        // Update existing tag
        response = await axiosInstance.put(
          `/admin/tags/update/${editingTag.id}`,
          tagData
        );
        toast.success("Tag updated successfully!");
      } else {
        // Create new tag
        response = await axiosInstance.post("/admin/tags/create", tagData);
        toast.success("Tag created successfully!");
      }

      setShowModal(false);
      resetForm();
      fetchTags();
    } catch (error) {
      console.error('Tag operation error:', error);
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!tagToDelete) return;

    setDeleteLoading(true);
    try {
      const response = await axiosInstance.delete(
        `/admin/tags/delete/${tagToDelete.id}`
      );

      if (response.status === 200) {
        toast.success('Tag deleted successfully!');
        setShowDeleteModal(false);
        setTagToDelete(null);
        fetchTags();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete tag');
      console.error('Delete error:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    setCurrentTag({
      name: tag.name,
      iconPreview: tag.icon || null,
      icon: null,
      iconUrl: tag.icon || null,
      isActive: tag.isActive === true
    });
    setShowModal(true);
  };

  const handleView = (tag) => {
    setViewTag(tag);
    setShowViewModal(true);
  };

  const handleAddNew = () => {
    setEditingTag(null);
    setCurrentTag({
      name: '',
      icon: null,
      iconPreview: null,
      iconUrl: null,
      isActive: true
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingTag(null);
    setCurrentTag({
      name: '',
      icon: null,
      iconPreview: null,
      iconUrl: null,
      isActive: true
    });
    setUploadProgress(0);
    setIsUploading(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleStatusToggle = async (tag) => {
    try {
      const tagData = {
        name: tag.name,
        icon: tag.icon,
        isActive: !tag.isActive
      };

      await axiosInstance.put(`/admin/tags/update/${tag.id}`, tagData);

      toast.success("Status updated successfully!");
      fetchTags();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive === true ? (
      <span className="badge bg-success badge-sm">
        <FaCheckCircle className="me-1" /> Active
      </span>
    ) : (
      <span className="badge bg-secondary badge-sm">
        <FaTimesCircle className="me-1" /> Inactive
      </span>
    );
  };

  return (
    <div className="tags-page">

      <div className="page-header">
        <div className="header-content">
          <div>
            <h1 className="page-title">
              <FaTag className="me-2" />
              Tags
            </h1>
            <p className="page-subtitle">Manage different tags for restaurants</p>
          </div>

          <div className="search-box-2">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <FaTimes
                className="clear-icon"
                onClick={() => setSearchTerm('')}
              />
            )}
          </div>

          <div className="filter-controls">
            <div className="filter-group">
              <FaFilter className="filter-icon" />
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <button
            className="btn add-btn"
            onClick={handleAddNew}
          >
            <FaPlus className="me-2" /> Add Tag
          </button>
        </div>
      </div>

      <div className="main-card">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading tags...</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th
                      className="sortable-header"
                      onClick={() => handleSort('name')}
                    >
                      <div className="header-content">
                        Name
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>Icon</th>
                    <th>Type</th>
                    <th
                      className="sortable-header"
                      onClick={() => handleSort('isActive')}
                    >
                      <div className="header-content">
                        Status
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th
                      className="sortable-header"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="header-content">
                        Created Date
                        <FaSort className="sort-icon" />
                      </div>
                    </th>
                    <th>Actions</th>
                   </tr>
                </thead>
                <tbody>
                  {tags.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-state">
                        <FaSearch className="empty-icon" />
                        <p className="empty-text">
                          {searchTerm || statusFilter !== 'all' 
                            ? 'No tags found matching your criteria'
                            : 'No tags found'}
                        </p>
                        <p className="empty-subtext">
                          {searchTerm || statusFilter !== 'all' 
                            ? 'Try adjusting your search or filters'
                            : 'Click the "Add Tag" button to create your first tag'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    tags.map((tag) => (
                      <tr key={tag.id} className="table-row dt-row--clickable" onClick={rowClick(() => handleView(tag))}>
                        <td>
                          <div className="type-info">
                            <div className="type-avatar">
                              {tag.icon ? (
                                <img
                                  src={getFileUrl(tag.icon)}
                                  alt={tag.name}
                                  style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }}
                                />
                              ) : (
                                <FaTag />
                              )}
                            </div>
                            <div>
                              <p className="type-name">{tag.name}</p>
                              <small className="type-id">
                                {tag.originalName && tag.originalName !== tag.name && (
                                  <>Original: {tag.originalName}<br /></>
                                )}
                                ID: {tag.id}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          {tag.icon ? (
                            <a href={getFileUrl(tag.icon)} target="_blank" rel="noopener noreferrer">
                              <img
                                src={getFileUrl(tag.icon)}
                                alt="icon"
                                style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                              />
                            </a>
                          ) : (
                            <span className="text-muted">No icon</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${tag.type === 'global' ? 'bg-info' : 'bg-warning'}`}>
                            {tag.type || 'global'}
                          </span>
                        </td>
                        <td>
                          <div className="status-cell">
                            <Switch
                              onChange={() => handleStatusToggle(tag)}
                              checked={tag.isActive === true}
                              className="status-toggle"
                              onColor="#28a745"
                              offColor="#6c757d"
                              height={24}
                              width={48}
                              handleDiameter={20}
                            />
                            <span className="tag-status-badge">
                              {getStatusBadge(tag.isActive)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="date-cell">
                            {formatDate(tag.createdAt)}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn btn-sm btn-outline-info view-btn"
                              onClick={() => handleView(tag)}
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-primary edit-btn"
                              onClick={() => handleEdit(tag)}
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger delete-btn"
                              onClick={() => {
                                setTagToDelete(tag);
                                setShowDeleteModal(true);
                              }}
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && tags.length > 0 && (
              <div className="pagination-container">
                <nav>
                  <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = index + 1;
                      } else if (currentPage <= 3) {
                        pageNum = index + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + index;
                      } else {
                        pageNum = currentPage - 2 + index;
                      }
                      return (
                        <li
                          key={index}
                          className={`page-item ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        </li>
                      );
                    })}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
                <div className="pagination-info">
                  Showing {tags.length} of {totalRecords} records
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <FaTag className="me-2" />
                  {editingTag ? 'Edit Tag' : 'Add New Tag'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Tag Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={currentTag.name}
                      onChange={(e) => setCurrentTag({ ...currentTag, name: e.target.value })}
                      placeholder="e.g., Vegan, Spicy, Popular"
                      required
                      autoFocus
                      disabled={isUploading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tag Icon</label>
                    <div className="icon-upload-area">
                      {/* Preview Section */}
                      {(currentTag.iconPreview || currentTag.iconUrl) && (
                        <div className="icon-preview-container mb-3">
                          <div 
                            className="icon-preview-wrapper"
                            style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}
                            onClick={() => setShowFullPreview(true)}
                          >
                            <img
                              src={getFileUrl(currentTag.iconPreview || currentTag.iconUrl)}
                              alt="Icon Preview"
                              className="icon-preview-image"
                              style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '12px',
                                objectFit: 'cover',
                                border: '2px solid #dee2e6',
                                padding: '4px',
                                backgroundColor: '#f8f9fa'
                              }}
                            />
                            <div 
                              className="preview-hover-overlay"
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                borderRadius: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0,
                                transition: 'opacity 0.3s',
                                color: 'white'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                            >
                              <FaEye size={24} />
                              <span className="small mt-1">Click to enlarge</span>
                            </div>
                          </div>
                          {!currentTag.iconPreview && currentTag.iconUrl && !isUploading && (
                            <div className="preview-badge mt-1">
                              <small className="text-success">✓ Uploaded</small>
                            </div>
                          )}
                        </div>
                      )}

                      {/* No Icon State */}
                      {!currentTag.iconPreview && !currentTag.iconUrl && (
                        <div className="icon-placeholder mb-3">
                          <div 
                            className="placeholder-content"
                            style={{
                              width: '120px',
                              height: '120px',
                              border: '2px dashed #dee2e6',
                              borderRadius: '12px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#f8f9fa'
                            }}
                          >
                            <FaTag size={40} className="text-muted" />
                            <p className="text-muted small mt-2 mb-0">No icon selected</p>
                          </div>
                        </div>
                      )}

                      {/* File Input */}
                      <input
                        type="file"
                        className="form-control"
                        id="icon-upload"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleIconChange}
                        disabled={isUploading}
                      />
                      <small className="text-muted d-block mt-2">
                        {editingTag 
                          ? 'Leave empty to keep existing icon. Max size: 5MB. Supported formats: JPEG, PNG, WEBP, GIF'
                          : 'Max size: 5MB. Supported formats: JPEG, PNG, WEBP, GIF'}
                      </small>
                    </div>
                  </div>

                  {isUploading && (
                    <div className="upload-progress mt-3">
                      <div className="progress">
                        <div
                          className="progress-bar progress-bar-striped progress-bar-animated"
                          role="progressbar"
                          style={{ width: `${uploadProgress}%` }}
                        >
                          {uploadProgress}%
                        </div>
                      </div>
                      <small className="text-info d-block mt-1 text-center">
                        Uploading icon...
                      </small>
                    </div>
                  )}

                  {editingTag && (
                    <div className="form-group mt-3">
                      <label className="form-label d-block mb-2">Status</label>
                      <div className="status-toggle-group">
                        <Switch
                          onChange={(checked) => setCurrentTag({ ...currentTag, isActive: checked })}
                          checked={currentTag.isActive}
                          className="modal-toggle"
                          onColor="#28a745"
                          offColor="#6c757d"
                          height={24}
                          width={48}
                          handleDiameter={20}
                          disabled={isUploading}
                        />
                        <span className="toggle-label ms-2">
                          {currentTag.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary cancel-btn"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    disabled={modalLoading || isUploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary save-btn"
                    disabled={modalLoading || isUploading || !currentTag.name.trim()}
                  >
                    {modalLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        {editingTag ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingTag ? 'Update Tag' : 'Create Tag'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Full Preview Modal */}
      {showFullPreview && (currentTag.iconPreview || currentTag.iconUrl) && (
        <div className="modal-overlay" onClick={() => setShowFullPreview(false)}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Icon Preview</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowFullPreview(false)}
                />
              </div>
              <div className="modal-body text-center">
                <img
                  src={getFileUrl(currentTag.iconPreview || currentTag.iconUrl)}
                  alt="Full Size Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '400px',
                    objectFit: 'contain',
                    borderRadius: '8px'
                  }}
                />
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowFullPreview(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && tagToDelete && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger">
                  <FaTrash className="me-2" />
                  Delete Tag
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDeleteModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="delete-confirmation">
                  <p className="confirmation-text">
                    Are you sure you want to delete <strong>"{tagToDelete.name}"</strong>?
                  </p>
                  <p className="confirmation-subtext">
                    This action cannot be undone and will permanently remove this tag.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary cancel-btn"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger delete-confirm-btn"
                  onClick={handleDelete}
                  disabled={deleteLoading}
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

      {/* View Details Modal */}
      {showViewModal && viewTag && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <FaTag className="me-2" />
                  Tag Details
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowViewModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="type-details-view">
                  <div className="type-header">
                    <div className="type-avatar-large">
                      {viewTag.icon ? (
                        <img
                          src={getFileUrl(viewTag.icon)}
                          alt={viewTag.name}
                          style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }}
                        />
                      ) : (
                        <FaTag />
                      )}
                    </div>
                    <div className="type-info-large">
                      <h4 className="type-title">{viewTag.name}</h4>
                      {getStatusBadge(viewTag.isActive)}
                    </div>
                  </div>

                  <div className="details-grid">
                    {viewTag.originalName && viewTag.originalName !== viewTag.name && (
                      <div className="detail-row">
                        <span className="detail-label">Original Name:</span>
                        <span className="detail-value">{viewTag.originalName}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label">Type:</span>
                      <span className="detail-value">{viewTag.type || 'global'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Icon URL:</span>
                      <span className="detail-value">
                        {viewTag.icon ? (
                          <a href={getFileUrl(viewTag.icon)} target="_blank" rel="noopener noreferrer">
                            View Icon
                          </a>
                        ) : 'No icon'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Status:</span>
                      <span className="detail-value">
                        {viewTag.isActive === true ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Created:</span>
                      <span className="detail-value">{formatDate(viewTag.createdAt)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Last Updated:</span>
                      <span className="detail-value">{formatDate(viewTag.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                {/* <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewTag);
                  }}
                >
                  Edit Tag
                </button> */}
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
    </div>
  );
}