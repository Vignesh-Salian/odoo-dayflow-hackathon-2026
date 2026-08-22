import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AttendanceAPI } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Table } from '../components/Table';
import { Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Clock, CheckCircle2, AlertCircle, RefreshCw, Calendar } from 'lucide-react';

export const AttendancePage = () => {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const [statusRes, logsRes] = await Promise.all([
        AttendanceAPI.getStatus(),
        isAdmin ? AttendanceAPI.getCompanyLogs() : AttendanceAPI.getMyLogs(),
      ]);
      if (statusRes.success) setStatus(statusRes.data);
      if (logsRes.success) setLogs(logsRes.data || []);
    } catch (err) {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [isAdmin]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await AttendanceAPI.checkIn();
      if (res.success) {
        toast.success(res.message);
        fetchAttendance();
      }
    } catch (err) {
      toast.error(err.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const res = await AttendanceAPI.checkOut();
      if (res.success) {
        toast.success(res.message);
        fetchAttendance();
      }
    } catch (err) {
      toast.error(err.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const tableColumns = [
    {
      header: 'Date',
      accessor: 'date',
      cellClassName: 'font-mono text-xs font-semibold text-slate-900',
    },
    {
      header: 'Employee Name',
      accessor: 'employee_name',
      cellClassName: 'font-medium text-slate-800',
    },
    {
      header: 'Check In',
      accessor: 'check_in',
      render: (row) => (
        <span className="font-mono text-xs text-slate-700">
          {row.check_in || '—'}
        </span>
      ),
    },
    {
      header: 'Check Out',
      accessor: 'check_out',
      render: (row) => (
        <span className="font-mono text-xs text-slate-700">
          {row.check_out || '—'}
        </span>
      ),
    },
    {
      header: 'Total Work Hours',
      accessor: 'total_hours',
      render: (row) => (
        <span className="font-semibold text-indigo-700 text-xs">
          {row.total_hours} hrs
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <Badge
          variant={
            row.status === 'Present'
              ? 'success'
              : row.status === 'Half-day'
              ? 'warning'
              : row.status === 'Leave'
              ? 'purple'
              : 'danger'
          }
        >
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Attendance Tracking</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin ? 'Company-wide attendance records and daily clock-in compliance' : 'Manage your daily work hours and check-in status'}
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchAttendance} isLoading={loading}>
          Refresh Logs
        </Button>
      </div>

      {/* Daily Check-In/Out Timer Card for Employee */}
      {status?.has_profile && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                <Clock className="w-8 h-8 text-indigo-300 animate-pulse" />
              </div>
              <div>
                <p className="text-xs text-indigo-200 font-medium uppercase tracking-wider">Today's Clock Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-2xl font-bold">{status.status}</h3>
                  <Badge variant={status.is_checked_in ? 'success' : 'default'}>
                    {status.is_checked_in ? 'ACTIVE CHECK-IN' : status.is_checked_out ? 'CHECKED OUT' : 'NOT CLOCKED IN'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  In: {status.check_in_time || '—'} | Out: {status.check_out_time || '—'} | Total: {status.total_hours} hrs
                </p>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              {!status.is_checked_in && (
                <Button
                  className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3"
                  isLoading={actionLoading}
                  onClick={handleCheckIn}
                  icon={CheckCircle2}
                >
                  Check In Now
                </Button>
              )}
              {status.is_checked_in && (
                <Button
                  variant="danger"
                  className="w-full md:w-auto font-bold px-6 py-3"
                  isLoading={actionLoading}
                  onClick={handleCheckOut}
                >
                  Check Out Now
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attendance Logs Table */}
      <Card
        title={isAdmin ? 'Company Attendance Logs' : 'My Attendance Logs'}
        subtitle="Persistent attendance history stored in PostgreSQL"
      >
        {loading && logs.length === 0 ? (
          <LoadingSpinner label="Loading attendance history..." />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No attendance records"
            description="Perform a check-in to generate your first attendance log."
            actionLabel="Check In Now"
            onAction={handleCheckIn}
          />
        ) : (
          <Table columns={tableColumns} data={logs} />
        )}
      </Card>
    </div>
  );
};
