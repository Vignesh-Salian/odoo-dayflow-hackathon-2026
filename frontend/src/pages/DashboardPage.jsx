import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { EmployeeAPI, AttendanceAPI, LeaveAPI, PayrollAPI } from '../api/client';
import { StatCard } from '../components/StatCard';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Table } from '../components/Table';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Alert } from '../components/Alert';
import { Users, Clock, CalendarDays, DollarSign, CheckCircle2, UserPlus, ArrowRight, ShieldCheck } from 'lucide-react';

export const DashboardPage = ({ onNavigate }) => {
  const { user, isAdmin } = useAuth();
  const [metrics, setMetrics] = useState({
    totalEmp: 0,
    attStatus: null,
    pendingLeaves: 0,
    netSalary: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const [empRes, attRes, leaveRes, salRes] = await Promise.all([
          EmployeeAPI.list(),
          AttendanceAPI.getCompanyLogs(),
          LeaveAPI.getAdminRequests(),
          PayrollAPI.getAdminStructures(),
        ]);

        const emps = empRes.success ? empRes.data : [];
        const leaves = leaveRes.success ? leaveRes.data : [];
        const sals = salRes.success ? salRes.data : [];

        const pending = leaves.filter((l) => l.status === 'Pending').length;
        const totalBudget = sals.reduce((acc, s) => acc + s.monthly_wage, 0);

        setMetrics({
          totalEmp: emps.length,
          pendingLeaves: pending,
          netSalary: totalBudget,
          attStatus: null,
        });
      } else {
        const [statusRes, allocRes, salRes] = await Promise.all([
          AttendanceAPI.getStatus(),
          LeaveAPI.getAllocations(),
          PayrollAPI.getMySalary(),
        ]);

        const att = statusRes.success ? statusRes.data : null;
        const allocs = allocRes.success ? allocRes.data : [];
        const sal = salRes.success ? salRes.data : null;

        const remainingPaid = allocs.find((a) => a.leave_type_name === 'Paid Leave')?.remaining_days || 12;

        setMetrics({
          totalEmp: 1,
          attStatus: att,
          pendingLeaves: remainingPaid,
          netSalary: sal?.net_salary || 0,
        });
      }
    } catch (err) {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isAdmin]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full font-semibold border border-indigo-400/20 uppercase tracking-wider">
              {isAdmin ? 'ADMIN CONTROL PANEL' : 'EMPLOYEE WORKSPACE'}
            </span>
          </div>
          <h2 className="text-2xl font-bold mt-1">Welcome back, {user?.first_name}!</h2>
          <p className="text-xs text-indigo-200 mt-1">
            Dayflow HRMS • {isAdmin ? 'Workforce overview & approval center' : 'Track your workday, attendance, leave balance, and compensation'}
          </p>
        </div>

        <div className="flex gap-2">
          {isAdmin ? (
            <Button variant="odoo" icon={UserPlus} onClick={() => onNavigate('employees')}>
              Onboard Employee
            </Button>
          ) : (
            <Button variant="secondary" icon={Clock} onClick={() => onNavigate('attendance')}>
              View Attendance
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      {isAdmin ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Headcount" value={metrics.totalEmp} icon={Users} />
          <StatCard
            title="Pending Leave Review"
            value={metrics.pendingLeaves}
            icon={CalendarDays}
            iconColor="text-amber-600 bg-amber-50"
          />
          <StatCard
            title="Monthly Payroll Budget"
            value={`?${metrics.netSalary.toLocaleString('en-IN')}`}
            icon={DollarSign}
            iconColor="text-emerald-600 bg-emerald-50"
          />
          <StatCard
            title="Database Engine"
            value="PostgreSQL"
            icon={ShieldCheck}
            iconColor="text-purple-600 bg-purple-50"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Today's Status"
            value={metrics.attStatus?.status || 'Not Marked'}
            icon={Clock}
            iconColor="text-indigo-600 bg-indigo-50"
          />
          <StatCard
            title="Paid Leave Balance"
            value={`${metrics.pendingLeaves} Days`}
            icon={CalendarDays}
            iconColor="text-emerald-600 bg-emerald-50"
          />
          <StatCard
            title="Net Take Home Salary"
            value={`?${metrics.netSalary.toLocaleString('en-IN')}`}
            icon={DollarSign}
            iconColor="text-purple-600 bg-purple-50"
          />
          <StatCard
            title="Department"
            value={user?.department || 'Engineering'}
            icon={Users}
          />
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          title={isAdmin ? 'Workforce Management' : 'My Personal Profile'}
          subtitle={isAdmin ? 'Onboard and manage employee records' : 'View job title, manager, and private info'}
          action={
            <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => onNavigate('employees')}>
              Open
            </Button>
          }
        >
          <p className="text-xs text-slate-600 leading-relaxed">
            {isAdmin
              ? 'Access complete employee directory, manage roles, and assign departments.'
              : 'Keep your personal details, emergency contacts, and work information updated.'}
          </p>
        </Card>

        <Card
          title="Time-Off & Leave"
          subtitle="Leave balances and approval requests"
          action={
            <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => onNavigate('leave')}>
              Open
            </Button>
          }
        >
          <p className="text-xs text-slate-600 leading-relaxed">
            {isAdmin
              ? 'Review pending time-off applications with approve/reject actions.'
              : 'Submit paid, sick, or unpaid leave applications with date range validation.'}
          </p>
        </Card>

        <Card
          title="Payroll & Compensation"
          subtitle="Formulated salary breakdown"
          action={
            <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => onNavigate('payroll')}>
              Open
            </Button>
          }
        >
          <p className="text-xs text-slate-600 leading-relaxed">
            {isAdmin
              ? 'Configure monthly wage parameters; backend recalculates Basic, HRA, and PF.'
              : 'View transparent read-only breakdown of earnings, deductions, and take-home pay.'}
          </p>
        </Card>
      </div>
    </div>
  );
};
