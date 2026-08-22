import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Clock, CalendarDays, DollarSign } from 'lucide-react';

export const Sidebar = ({ currentTab, onSelectTab }) => {
  const { isAdmin } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: isAdmin ? 'Employee Directory' : 'My Profile', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leave', label: 'Time Off & Leave', icon: CalendarDays },
    { id: 'payroll', label: 'Payroll & Salary', icon: DollarSign },
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          HRMS Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
        <p className="font-semibold text-slate-800 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Dayflow Engine
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          PostgreSQL database connected. Formulated salary & attendance active.
        </p>
      </div>
    </aside>
  );
};
