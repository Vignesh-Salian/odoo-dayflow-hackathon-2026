import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { EmployeeAPI } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Table } from '../components/Table';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Plus, Search, Filter, User, Building, MapPin, Briefcase, Mail, Phone } from 'lucide-react';

export const EmployeesPage = () => {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: 'Dayflow@2026',
    department: 'Engineering',
    job_title: 'Software Engineer',
    monthly_wage: 50000.0,
    phone: '',
    role: 'employee',
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const res = await EmployeeAPI.list({ search, department: department || undefined });
        if (res.success) setEmployees(res.data || []);
      } else if (user?.employee_id) {
        const res = await EmployeeAPI.get(user.employee_id);
        if (res.success) setEmployees([res.data]);
      }
    } catch (err) {
      toast.error('Failed to load employee profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, department, isAdmin]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    try {
      const res = await EmployeeAPI.create(formData);
      if (res.success) {
        toast.success(res.message);
        setIsCreateOpen(false);
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          password: 'Dayflow@2026',
          department: 'Engineering',
          job_title: 'Software Engineer',
          monthly_wage: 50000.0,
          phone: '',
          role: 'employee',
        });
        fetchEmployees();
      }
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        const errs = {};
        err.errors.forEach((e) => (errs[e.field] = e.message));
        setFieldErrors(errs);
      }
      toast.error(err.message || 'Error creating employee');
    } finally {
      setSubmitting(false);
    }
  };

  const tableColumns = [
    {
      header: 'Code',
      accessor: 'employee_code',
      cellClassName: 'font-mono text-xs text-indigo-700 font-semibold',
    },
    {
      header: 'Employee Name',
      accessor: 'first_name',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.first_name} {row.last_name}</p>
          <p className="text-xs text-slate-400">{row.email}</p>
        </div>
      ),
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (row) => <Badge variant="info">{row.department}</Badge>,
    },
    {
      header: 'Job Title',
      accessor: 'job_title',
      cellClassName: 'text-xs text-slate-700 font-medium',
    },
    {
      header: 'Location',
      accessor: 'location',
      cellClassName: 'text-xs text-slate-500',
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (row) => (
        <Badge variant={row.role === 'admin' ? 'purple' : 'default'} className="uppercase text-[10px]">
          {row.role}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {isAdmin ? 'Employee Directory & Onboarding' : 'My HR Profile'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin ? 'Manage workforce, assign roles, and configure initial compensation' : 'View your personal work details and private information'}
          </p>
        </div>
        {isAdmin && (
          <Button icon={Plus} onClick={() => { setFieldErrors({}); setIsCreateOpen(true); }}>
            Onboard New Employee
          </Button>
        )}
      </div>

      {/* Admin Filters */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, code, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="HR & Administration">HR & Administration</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
            </select>
          </div>
        </div>
      )}

      {/* Table / List View */}
      <Card>
        {loading ? (
          <LoadingSpinner label="Loading employee directory..." />
        ) : employees.length === 0 ? (
          <EmptyState
            title="No employees found"
            description={isAdmin ? 'Get started by creating the first employee account.' : 'No profile information found.'}
            actionLabel={isAdmin ? 'Onboard Employee' : undefined}
            onAction={isAdmin ? () => setIsCreateOpen(true) : undefined}
          />
        ) : (
          <Table columns={tableColumns} data={employees} />
        )}
      </Card>

      {/* Create Employee Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Onboard New Employee"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button isLoading={submitting} onClick={handleCreate}>
              Create Employee Account
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              required
              placeholder="Jane"
              value={formData.first_name}
              error={fieldErrors.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
            <Input
              label="Last Name"
              required
              placeholder="Smith"
              value={formData.last_name}
              error={fieldErrors.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>

          <Input
            label="Work Email Address"
            type="email"
            required
            placeholder="jane.smith@dayflow.com"
            value={formData.email}
            error={fieldErrors.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="Engineering">Engineering</option>
                <option value="HR & Administration">HR & Administration</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            <Input
              label="Job Title"
              required
              placeholder="Software Engineer"
              value={formData.job_title}
              error={fieldErrors.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Initial Monthly Wage (?)"
              type="number"
              required
              placeholder="50000"
              value={formData.monthly_wage}
              error={fieldErrors.monthly_wage}
              onChange={(e) => setFormData({ ...formData, monthly_wage: parseFloat(e.target.value) || 0 })}
            />

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">System Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin / HR Officer</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
