import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PayrollAPI } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { Table } from '../components/Table';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { DollarSign, Edit3, ShieldCheck, ArrowRight, Wallet, CheckCircle } from 'lucide-react';

export const PayrollPage = () => {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [salaryData, setSalaryData] = useState(null);
  const [adminStructures, setAdminStructures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Wage Update Modal
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [newWage, setNewWage] = useState(50000);
  const [bonus, setBonus] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const res = await PayrollAPI.getAdminStructures();
        if (res.success) setAdminStructures(res.data || []);
      } else {
        const res = await PayrollAPI.getMySalary();
        if (res.success) setSalaryData(res.data);
      }
    } catch (err) {
      toast.error('Failed to load payroll structure');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [isAdmin]);

  const handleUpdateWage = async (e) => {
    e.preventDefault();
    if (!selectedEmp || newWage < 10000) {
      toast.error('Please enter a valid monthly wage (min ?10,000)');
      return;
    }
    setSubmitting(true);
    try {
      const res = await PayrollAPI.updateSalary(selectedEmp.employee_id, {
        monthly_wage: newWage,
        performance_bonus: bonus,
      });
      if (res.success) {
        toast.success(res.message);
        setUpdateModalOpen(false);
        fetchPayroll();
      }
    } catch (err) {
      toast.error(err.message || 'Wage update failed');
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
      accessor: 'employee_name',
      cellClassName: 'font-semibold text-slate-900',
    },
    {
      header: 'Monthly Wage (W)',
      accessor: 'monthly_wage',
      render: (row) => <span className="font-semibold text-slate-900">?{row.monthly_wage.toLocaleString('en-IN')}</span>,
    },
    {
      header: 'Basic Salary (50%)',
      accessor: 'basic_salary',
      render: (row) => <span className="text-slate-700">?{row.basic_salary.toLocaleString('en-IN')}</span>,
    },
    {
      header: 'HRA (50% Basic)',
      accessor: 'hra',
      render: (row) => <span className="text-slate-700">?{row.hra.toLocaleString('en-IN')}</span>,
    },
    {
      header: 'Fixed Allowance',
      accessor: 'fixed_allowance',
      render: (row) => <span className="text-slate-700">?{row.fixed_allowance.toLocaleString('en-IN')}</span>,
    },
    {
      header: 'Net Payable',
      accessor: 'net_salary',
      render: (row) => <span className="font-bold text-emerald-700">?{row.net_salary.toLocaleString('en-IN')}</span>,
    },
    {
      header: 'Action',
      accessor: 'actions',
      render: (row) => (
        <Button
          size="sm"
          variant="secondary"
          icon={Edit3}
          onClick={() => {
            setSelectedEmp(row);
            setNewWage(row.monthly_wage);
            setBonus(row.performance_bonus);
            setUpdateModalOpen(true);
          }}
        >
          Configure Wage
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Payroll & Salary Engine</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin ? 'Configure employee wages; components recalculate automatically in backend' : 'Read-only breakdown of your monthly salary components and deductions'}
          </p>
        </div>
      </div>

      {/* Employee Read-Only Salary Breakdown */}
      {!isAdmin && salaryData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Gross Monthly Wage"
              value={`?${salaryData.monthly_wage.toLocaleString('en-IN')}`}
              icon={Wallet}
              iconColor="text-indigo-600 bg-indigo-50"
            />
            <StatCard
              title="Total Deductions (PF+PT)"
              value={`?${(salaryData.pf_deduction + salaryData.pt_deduction).toLocaleString('en-IN')}`}
              icon={ShieldCheck}
              iconColor="text-rose-600 bg-rose-50"
            />
            <StatCard
              title="Net Take-Home Salary"
              value={`?${salaryData.net_salary.toLocaleString('en-IN')}`}
              icon={DollarSign}
              iconColor="text-emerald-600 bg-emerald-50"
            />
          </div>

          <Card title="Detailed Earnings & Deductions Breakdown" subtitle="Formula-driven backend computation">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Earnings Column */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
                  Gross Earnings Components
                </h4>
                <div className="space-y-2 text-sm divide-y divide-slate-100">
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-600 font-medium">Basic Salary (50% of Wage)</span>
                    <span className="font-semibold text-slate-900">?{salaryData.basic_salary.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-600 font-medium">House Rent Allowance (50% of Basic)</span>
                    <span className="font-semibold text-slate-900">?{salaryData.hra.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-600 font-medium">Standard Allowance</span>
                    <span className="font-semibold text-slate-900">?{salaryData.standard_allowance.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-600 font-medium">Leave Travel Allowance (LTA)</span>
                    <span className="font-semibold text-slate-900">?{salaryData.lta.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-600 font-medium">Performance Bonus</span>
                    <span className="font-semibold text-slate-900">?{salaryData.performance_bonus.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-600 font-medium">Fixed Allowance (Remainder)</span>
                    <span className="font-semibold text-slate-900">?{salaryData.fixed_allowance.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Column */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                  Statutory Deductions
                </h4>
                <div className="space-y-2 text-sm divide-y divide-slate-100">
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-600 font-medium">Provident Fund (PF - 12% of Basic)</span>
                    <span className="font-semibold text-rose-700">- ?{salaryData.pf_deduction.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-600 font-medium">Professional Tax (PT)</span>
                    <span className="font-semibold text-rose-700">- ?{salaryData.pt_deduction.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 border-slate-200 mt-4">
                    <span className="font-bold text-slate-900">Net Take Home Pay</span>
                    <span className="font-extrabold text-emerald-600 text-lg">?{salaryData.net_salary.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Admin Salary Structures Control Table */}
      {isAdmin && (
        <Card title="Workforce Salary Configurations" subtitle="Update monthly wage W; backend dynamically recomputes all formulas">
          {loading && adminStructures.length === 0 ? (
            <LoadingSpinner label="Loading payroll configurations..." />
          ) : adminStructures.length === 0 ? (
            <EmptyState title="No salary structures" description="Create employees to generate automated salary structures." />
          ) : (
            <Table columns={tableColumns} data={adminStructures} />
          )}
        </Card>
      )}

      {/* Update Wage Modal */}
      <Modal
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        title={`Configure Salary: ${selectedEmp?.employee_name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setUpdateModalOpen(false)}>
              Cancel
            </Button>
            <Button isLoading={submitting} onClick={handleUpdateWage}>
              Save & Recalculate Salary
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateWage} className="space-y-4">
          <Input
            label="Monthly Wage (?)"
            type="number"
            required
            placeholder="60000"
            value={newWage}
            onChange={(e) => setNewWage(parseFloat(e.target.value) || 0)}
            helperText="Changing Monthly Wage recalculates Basic, HRA, Fixed Allowance, and PF automatically."
          />

          <Input
            label="Performance Bonus (?)"
            type="number"
            placeholder="0"
            value={bonus}
            onChange={(e) => setBonus(parseFloat(e.target.value) || 0)}
          />
        </form>
      </Modal>
    </div>
  );
};
