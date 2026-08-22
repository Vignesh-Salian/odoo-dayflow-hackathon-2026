import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LeaveAPI } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { Table } from '../components/Table';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Plus, CalendarDays, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

export const LeavePage = () => {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [allocations, setAllocations] = useState([]);
  const [types, setTypes] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Review Modal state for Admin
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminComment, setAdminComment] = useState('');

  const [formData, setFormData] = useState({
    leave_type_id: 1,
    start_date: '',
    end_date: '',
    remarks: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [typesRes, allocsRes, reqsRes] = await Promise.all([
        LeaveAPI.getTypes(),
        LeaveAPI.getAllocations(),
        isAdmin ? LeaveAPI.getAdminRequests() : LeaveAPI.getMyRequests(),
      ]);

      if (typesRes.success) setTypes(typesRes.data || []);
      if (allocsRes.success) setAllocations(allocsRes.data || []);
      if (reqsRes.success) setRequests(reqsRes.data || []);
    } catch (err) {
      toast.error('Failed to load leave records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date) {
      toast.error('Please select valid start and end dates');
      return;
    }
    setSubmitting(true);
    try {
      const res = await LeaveAPI.submitRequest(formData);
      if (res.success) {
        toast.success(res.message);
        setIsModalOpen(false);
        setFormData({ leave_type_id: types[0]?.id || 1, start_date: '', end_date: '', remarks: '' });
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Error submitting leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewAction = async (status) => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      const res = await LeaveAPI.reviewRequest(selectedRequest.id, {
        status,
        admin_comment: adminComment,
      });
      if (res.success) {
        toast.success(res.message);
        setReviewModalOpen(false);
        setSelectedRequest(null);
        setAdminComment('');
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Review action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const tableColumns = [
    {
      header: 'ID',
      accessor: 'id',
      cellClassName: 'font-mono text-xs text-slate-500 w-12',
    },
    {
      header: 'Employee Name',
      accessor: 'employee_name',
      cellClassName: 'font-semibold text-slate-900',
    },
    {
      header: 'Leave Type',
      accessor: 'leave_type_name',
      render: (row) => <Badge variant="info">{row.leave_type_name}</Badge>,
    },
    {
      header: 'Duration',
      accessor: 'start_date',
      render: (row) => (
        <span className="text-xs font-mono text-slate-700">
          {row.start_date} to {row.end_date} ({row.total_days} day{row.total_days > 1 ? 's' : ''})
        </span>
      ),
    },
    {
      header: 'Remarks',
      accessor: 'remarks',
      cellClassName: 'text-xs text-slate-500 max-w-xs truncate',
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <Badge
          variant={
            row.status === 'Approved'
              ? 'success'
              : row.status === 'Rejected'
              ? 'danger'
              : 'warning'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Action',
      accessor: 'actions',
      render: (row) =>
        isAdmin && row.status === 'Pending' ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedRequest(row);
              setAdminComment('');
              setReviewModalOpen(true);
            }}
          >
            Review Request
          </Button>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Time-Off & Leave Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin ? 'Review workforce leave applications and approval workflows' : 'Check your leave allocations and submit time-off requests'}
          </p>
        </div>
        {!isAdmin && (
          <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
            Apply for Time Off
          </Button>
        )}
      </div>

      {/* Allocation Cards for Employee */}
      {!isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {allocations.map((alloc, idx) => (
            <StatCard
              key={idx}
              title={alloc.leave_type_name}
              value={`${alloc.remaining_days} Days`}
              change={`Used: ${alloc.used_days} / Total: ${alloc.total_allocated}`}
              icon={CalendarDays}
              iconColor="text-indigo-600 bg-indigo-50"
            />
          ))}
        </div>
      )}

      {/* Requests Table */}
      <Card
        title={isAdmin ? 'Pending & Processed Leave Applications' : 'My Time-Off Requests'}
        subtitle="Live state transitions (Pending -> Approved / Rejected) stored in PostgreSQL"
      >
        {loading && requests.length === 0 ? (
          <LoadingSpinner label="Loading leave requests..." />
        ) : requests.length === 0 ? (
          <EmptyState
            title="No leave applications found"
            description={!isAdmin ? "Click 'Apply for Time Off' to submit a leave request." : 'No leave applications submitted yet.'}
            actionLabel={!isAdmin ? 'Apply for Time Off' : undefined}
            onAction={!isAdmin ? () => setIsModalOpen(true) : undefined}
          />
        ) : (
          <Table columns={tableColumns} data={requests} />
        )}
      </Card>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Apply for Time Off"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button isLoading={submitting} onClick={handleApply}>
              Submit Request
            </Button>
          </>
        }
      >
        <form onSubmit={handleApply} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Leave Type</label>
            <select
              value={formData.leave_type_id}
              onChange={(e) => setFormData({ ...formData, leave_type_id: parseInt(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Max {t.max_days_per_year} days/yr)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              required
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              required
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Remarks / Reason</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Provide context or reason for leave request..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20"
            />
          </div>
        </form>
      </Modal>

      {/* Admin Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Review Leave Application"
        footer={
          <>
            <Button variant="danger" isLoading={submitting} icon={XCircle} onClick={() => handleReviewAction('Rejected')}>
              Reject Request
            </Button>
            <Button variant="primary" isLoading={submitting} icon={CheckCircle2} onClick={() => handleReviewAction('Approved')}>
              Approve Request
            </Button>
          </>
        }
      >
        {selectedRequest && (
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <p><span className="font-semibold text-slate-700">Applicant:</span> {selectedRequest.employee_name}</p>
              <p><span className="font-semibold text-slate-700">Leave Type:</span> {selectedRequest.leave_type_name}</p>
              <p><span className="font-semibold text-slate-700">Dates:</span> {selectedRequest.start_date} to {selectedRequest.end_date} ({selectedRequest.total_days} days)</p>
              {selectedRequest.remarks && <p><span className="font-semibold text-slate-700">Remarks:</span> {selectedRequest.remarks}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reviewer Comment (Optional)</label>
              <textarea
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                placeholder="e.g. Approved. Please hand over pending tasks."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
