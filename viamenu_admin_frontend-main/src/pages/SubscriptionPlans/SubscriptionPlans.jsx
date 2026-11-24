import { useState } from 'react';
import {
    FaEdit,
    FaTrash,
    FaPlus,
    FaEye,
    FaCheckCircle,
    FaTimesCircle,
    FaCreditCard,
    FaCalendarAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Switch from 'react-switch';
import 'bootstrap/dist/css/bootstrap.min.css';
import './SubscriptionPlans.css';
import axiosInstance from '../../utils/axiosInstance';
import LinkedData from '../../components/common/LinkedData';
import { fmtDate } from '../../utils/fmtDate';
import PriceInput from '../../components/common/PriceInput';
import { parseGermanPrice, formatGermanPrice } from '../../utils/germanPrice';
import { useSortState } from '../../hooks/useSortState';
import { useDataFetch, useDebounce } from '../../hooks/useDataFetch';
import PageShell from '../../components/common/PageShell';
import StatsCard from '../../components/common/StatsCard';
import FilterBar from '../../components/common/FilterBar';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';

export default function SubscriptionPlans() {
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteBlocked, setDeleteBlocked] = useState(true);
    const [showViewModal, setShowViewModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [currentPlan, setCurrentPlan] = useState({
        planName: '',
        price: '',
        validity: 'month',
        benefits: '',
        planIdAndroid: '',
        planIdIOS: '',
        status: true
    });
    const [planToDelete, setPlanToDelete] = useState(null);
    const [viewPlan, setViewPlan] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [modalLoading, setModalLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [statusToggleLoading, setStatusToggleLoading] = useState(null);
    const search = useDebounce(searchTerm);
    const sort = useSortState('subscription-plans');

    const params = {
        page: currentPage, limit: 10, sortBy: sort.sortBy, sortOrder: sort.sortOrder,
        ...(search && { search }), ...(statusFilter && { status: statusFilter }),
    };
    const { data: subscriptionPlans, loading, metadata, refetch } = useDataFetch('/admin/subscription', 'plans', params);

    const fetchPlanDetails = async (id) => {
        try {
            const response = await axiosInstance.get(`/admin/subscription/${id}`);
            if (response.data.success && response.data.data) {
                return response.data.data;
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch plan details');
            console.error('Error fetching plan details:', error);
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setModalLoading(true);

        // Validation
        if (!currentPlan.planName.trim()) {
            toast.error('Plan name is required');
            setModalLoading(false);
            return;
        }
        const priceNum = parseGermanPrice(currentPlan.price);
        if (priceNum === null || priceNum < 0) {
            toast.error('Valid price is required (format: 1,50)');
            setModalLoading(false);
            return;
        }
        if (!currentPlan.validity) {
            toast.error('Validity period is required');
            setModalLoading(false);
            return;
        }
        if (!currentPlan.benefits.trim() || !currentPlan.planIdAndroid.trim() || !currentPlan.planIdIOS.trim()) {
            toast.error('Benefits, Android Plan ID and iOS Plan ID are required');
            setModalLoading(false);
            return;
        }

        try {
            const planData = {
                planName: currentPlan.planName,
                price: priceNum,
                validity: currentPlan.validity,
                benefits: currentPlan.benefits || '',
                planIdAndroid: currentPlan.planIdAndroid || '',
                planIdIOS: currentPlan.planIdIOS || ''
            };

            if (editingPlan) {
                // Add status for update
                const updateData = {
                    ...planData,
                    status: currentPlan.status
                };
                await axiosInstance.put(`/admin/subscription/${editingPlan.id}`, updateData);
                toast.success('Subscription plan updated successfully!');
            } else {
                await axiosInstance.post('/admin/subscription', planData);
                toast.success('Subscription plan created successfully!');
            }

            setShowModal(false);
            resetForm();
            refetch();
        } catch (error) {
            console.error('Submit error:', error);
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setModalLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!planToDelete) return;

        setDeleteLoading(true);

        try {
            await axiosInstance.delete(`/admin/subscription/${planToDelete.id}`);
            toast.success('Subscription plan deleted successfully!');
            setShowDeleteModal(false);
            setPlanToDelete(null);
            refetch();
        } catch (error) {
            console.error('Delete error:', error);
            toast.error(error.response?.data?.message || 'Failed to delete subscription plan');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleToggleStatus = async (plan) => {
        setStatusToggleLoading(plan.id);
        try {
            await axiosInstance.patch(`/admin/subscription/${plan.id}/toggle-status`);
            toast.success(`Plan ${plan.status ? 'deactivated' : 'activated'} successfully!`);
            refetch();
        } catch (error) {
            console.error('Toggle status error:', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        } finally {
            setStatusToggleLoading(null);
        }
    };

    const handleEdit = (plan) => {
        setEditingPlan(plan);
        setCurrentPlan({
            planName: plan.planName,
            price: formatGermanPrice(plan.price),
            validity: plan.validity,
            benefits: plan.benefits || '',
            planIdAndroid: plan.planIdAndroid || '',
            planIdIOS: plan.planIdIOS || '',
            status: plan.status === true || plan.status === 'active'
        });
        setShowModal(true);
    };

    const handleView = async (plan) => {
        const detailedPlan = await fetchPlanDetails(plan.id);
        if (detailedPlan) {
            setViewPlan(detailedPlan);
            setShowViewModal(true);
        }
    };

    const handleAddNew = () => {
        setEditingPlan(null);
        setCurrentPlan({
            planName: '',
            price: '',
            validity: 'month',
            benefits: '',
            planIdAndroid: '',
            planIdIOS: '',
            status: true
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingPlan(null);
        setCurrentPlan({
            planName: '',
            price: '',
            validity: 'month',
            benefits: '',
            planIdAndroid: '',
            planIdIOS: '',
            status: true
        });
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

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    };

    const getStatusBadge = (status) => {
        return status === true || status === 'active' ? (
            <span className="badge bg-success badge-sm">
                <FaCheckCircle className="me-1" /> Active
            </span>
        ) : (
            <span className="badge bg-secondary badge-sm">
                <FaTimesCircle className="me-1" /> Inactive
            </span>
        );
    };

    const getValidityBadge = (validity) => {
        const validityMap = {
            'month': 'Monthly',
            'year': 'Yearly',
            'week': 'Weekly',
            'day': 'Daily'
        };
        return validityMap[validity] || validity;
    };

    const columns = [
        {
            key: 'planName',
            label: 'Plan Name',
            sort: 'planName',
            render: (_v, plan) => (
                <div className="nc">
                    <div className="av av--md av--square" style={{ background: '#2c8769' }}>
                        {plan.planName?.charAt(0).toUpperCase() || 'P'}
                    </div>
                    <div className="nc-body">
                        <span className="nc-name">{plan.planName}</span>
                        <span className="nc-id">ID: {plan.id}</span>
                    </div>
                </div>
            ),
        },
        { key: 'price', label: 'Price', sort: 'price', render: (v) => <span className="price">{formatPrice(v)}</span> },
        {
            key: 'validity',
            label: 'Validity',
            sort: 'validity',
            render: (v) => <span><FaCalendarAlt style={{ color: 'var(--c-muted)', marginRight: 6 }} />{getValidityBadge(v)}</span>,
        },
        {
            key: 'benefits',
            label: 'Benefits',
            render: (v) => v ? <span className="description-text" title={v}>{v}</span> : <span className="nc-sub">No benefits</span>,
        },
        {
            key: 'status',
            label: 'Active Status',
            sort: 'status',
            render: (_v, plan) => (
                <Switch
                    onChange={() => handleToggleStatus(plan)}
                    checked={plan.status === 'active' || plan.status === true}
                    disabled={statusToggleLoading === plan.id}
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
            render: (_v, plan) => (
                <div className="act-row">
                    <button className="act-btn act-btn--ghost" onClick={() => handleView(plan)} title="View Details"><FaEye /></button>
                    <button className="act-btn act-btn--ghost" onClick={() => handleEdit(plan)} title="Edit Plan"><FaEdit /></button>
                    <button
                        className="act-btn act-btn--danger"
                        onClick={() => { setPlanToDelete(plan); setShowDeleteModal(true); }}
                        title="Delete Plan"
                    >
                        <FaTrash />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <PageShell
            title="Subscription Plans"
            subtitle="Manage subscription plans and pricing"
            actions={
                <button className="ps-btn" onClick={handleAddNew}>
                    <FaPlus /> Add Plan
                </button>
            }
            stats={<StatsCard icon={FaCreditCard} label="Total Plans" value={metadata.total_records} color="#2c8769" />}
        >
            <FilterBar
                search={searchTerm}
                onSearch={(v) => { setSearchTerm(v); setCurrentPage(1); }}
                placeholder="Search plans…"
                filters={[
                    {
                        key: 'status',
                        value: statusFilter,
                        placeholder: 'All Status',
                        onChange: (v) => { setStatusFilter(v); setCurrentPage(1); },
                        options: [
                            { value: 'true', label: 'Active' },
                            { value: 'false', label: 'Inactive' },
                        ],
                    },
                ]}
                onReset={() => { setSearchTerm(''); setStatusFilter(''); sort.resetSort(); setCurrentPage(1); }}
            />
            <DataTable onRowClick={(plan) => handleView(plan)}
                columns={columns}
                data={subscriptionPlans}
                loading={loading}
                sort={sort}
                emptyText={searchTerm || statusFilter ? 'No subscription plans found matching your criteria' : 'No subscription plans yet — click "Add Plan"'}
            />
            <Pagination metadata={metadata} onPageChange={setCurrentPage} />

            {/* Add/Edit Modal - Same as before */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <FaCreditCard className="me-2" />
                                    {editingPlan ? 'Edit Subscription Plan' : 'Add Subscription Plan'}
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
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Plan Name *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={currentPlan.planName}
                                                onChange={(e) => setCurrentPlan({ ...currentPlan, planName: e.target.value })}
                                                placeholder="e.g., Basic Plan, Premium Plan"
                                                required
                                                autoFocus
                                            />
                                        </div>

                                        <PriceInput
                                            label="Price (USD) *"
                                            value={currentPlan.price}
                                            onChange={(v) => setCurrentPlan({ ...currentPlan, price: v })}
                                            required
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Validity Period *</label>
                                            <select
                                                className="form-control"
                                                value={currentPlan.validity}
                                                onChange={(e) => setCurrentPlan({ ...currentPlan, validity: e.target.value })}
                                                required
                                            >
                                                <option value="month">Monthly</option>
                                                <option value="year">Yearly</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Benefits *</label>
                                            <textarea
                                                className="form-control"
                                                value={currentPlan.benefits}
                                                onChange={(e) => setCurrentPlan({ ...currentPlan, benefits: e.target.value })}
                                                placeholder="List the benefits of this plan (one per line or comma separated)"
                                                rows="3"
                                                maxLength={500}
                                                required
                                            />
                                            <small className="form-text text-muted">Describe what's included in this plan</small>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Android Plan ID *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={currentPlan.planIdAndroid}
                                                onChange={(e) => setCurrentPlan({ ...currentPlan, planIdAndroid: e.target.value })}
                                                placeholder="io.android.planid"
                                                required
                                            />
                                            <small className="form-text text-muted">Google Play subscription product ID</small>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">iOS Plan ID *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={currentPlan.planIdIOS}
                                                onChange={(e) => setCurrentPlan({ ...currentPlan, planIdIOS: e.target.value })}
                                                placeholder="io.ios.planid"
                                                required
                                            />
                                            <small className="form-text text-muted">App Store subscription product ID</small>
                                        </div>
                                    </div>

                                    {editingPlan && (
                                        <div className="form-group">
                                            <label className="form-label d-block mb-2">Status</label>
                                            <div className="status-toggle-group">
                                                <Switch
                                                    onChange={(checked) => setCurrentPlan({ ...currentPlan, status: checked })}
                                                    checked={currentPlan.status}
                                                    className="modal-toggle"
                                                    onColor="#28a745"
                                                    offColor="#6c757d"
                                                    height={24}
                                                    width={48}
                                                    handleDiameter={20}
                                                />
                                                <span className="toggle-label">
                                                    {currentPlan.status ? 'Active' : 'Inactive'}
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
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary save-btn"
                                        disabled={modalLoading}
                                    >
                                        {modalLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                {editingPlan ? 'Updating...' : 'Creating...'}
                                            </>
                                        ) : (
                                            editingPlan ? 'Update' : 'Create'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && planToDelete && (
                <div className="modal-overlay">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title text-danger">
                                    <FaTrash className="me-2" />
                                    Delete Subscription Plan
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
                                        Are you sure you want to delete <strong>"{planToDelete.planName}"</strong>?
                                    </p>
                                    <p className="confirmation-subtext">
                                        This action cannot be undone and will permanently remove this subscription plan.
                                    </p>
                                    <LinkedData url={`/admin/subscription/${planToDelete.id}/links`} onBlockedChange={setDeleteBlocked} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary cancel-btn"
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger delete-confirm-btn"
                                    onClick={handleDelete}
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

            {/* View Details Modal */}
            {showViewModal && viewPlan && (
                <div className="modal-overlay">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <FaCreditCard className="me-2" />
                                    Plan Details
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowViewModal(false)}
                                />
                            </div>
                            <div className="modal-body">
                                <div className="plan-details-view">
                                    <div className="plan-header">
                                        <div className="plan-avatar-large">
                                            {viewPlan.planName?.charAt(0).toUpperCase() || 'P'}
                                        </div>
                                        <div className="plan-info-large">
                                            <h4 className="plan-title">{viewPlan.planName}</h4>
                                            {getStatusBadge(viewPlan.status)}
                                        </div>
                                    </div>

                                    <div className="price-card">
                                        <div className="price-amount-large">
                                            {formatPrice(viewPlan.price)}
                                        </div>
                                        <div className="price-period">
                                            per {getValidityBadge(viewPlan.validity).toLowerCase()}
                                        </div>
                                    </div>

                                    <div className="details-grid">
                                        <div className="detail-row">
                                            <span className="detail-label">Validity:</span>
                                            <span className="detail-value">{getValidityBadge(viewPlan.validity)}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Benefits:</span>
                                            <span className="detail-value">{viewPlan.benefits || 'No benefits listed'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Android Plan ID:</span>
                                            <span className="detail-value">{viewPlan.planIdAndroid || 'Not set'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">iOS Plan ID:</span>
                                            <span className="detail-value">{viewPlan.planIdIOS || 'Not set'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Status:</span>
                                            <span className="detail-value">
                                                {viewPlan.status ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Created:</span>
                                            <span className="detail-value">{formatDate(viewPlan.createdAt)}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Last Updated:</span>
                                            <span className="detail-value">{formatDate(viewPlan.updatedAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
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
        </PageShell>
    );
}
