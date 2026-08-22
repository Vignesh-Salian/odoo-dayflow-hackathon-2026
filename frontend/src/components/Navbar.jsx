import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AttendanceAPI } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Badge } from './Badge';
import { Button } from './Button';
import { Layers, LogOut, Clock, CheckCircle2, UserCheck, Shield } from 'lucide-react';

export const Navbar = ({ backendOnline }) => {
  const { user, logout, isAdmin } = useAuth();
  const toast = useToast();
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await AttendanceAPI.getStatus();
      if (res.success) setAttendanceStatus(res.data);
    } catch (err) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const res = await AttendanceAPI.checkIn();
      if (res.success) {
        toast.success(res.message);
        fetchStatus();
      }
    } catch (err) {
      toast.error(err.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const res = await AttendanceAPI.checkOut();
      if (res.success) {
        toast.success(res.message);
        fetchStatus();
      }
    } catch (err) {
      toast.error(err.message || 'Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-600 text-white font-bold shadow-xs">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 leading-none">Dayflow HRMS</h1>
            <Badge variant={isAdmin ? 'purple' : 'info'} className="text-[10px] uppercase">
              {isAdmin ? 'ADMIN / HR' : 'EMPLOYEE'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Every workday, perfectly aligned</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Quick Attendance Widget */}
        {attendanceStatus?.has_profile && (
          <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-3">
            <Clock className="w-4 h-4 text-slate-400" />
            <div className="text-xs">
              <span className="text-slate-500 font-medium">Status: </span>
              <span className="font-semibold text-slate-800">{attendanceStatus.status}</span>
            </div>
            {attendanceStatus.is_checked_in ? (
              <Button size="sm" variant="danger" isLoading={loading} onClick={handleCheckOut} className="py-1 px-2.5 text-xs">
                Check Out
              </Button>
            ) : (
              <Button size="sm" variant="primary" isLoading={loading} onClick={handleCheckIn} className="py-1 px-2.5 text-xs">
                Check In
              </Button>
            )}
          </div>
        )}

        <div className="h-5 w-px bg-slate-200" />

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-300 flex items-center justify-center text-xs font-bold text-indigo-700">
            {user?.first_name ? user.first_name[0] : 'U'}
          </div>
          <div className="hidden sm:block text-left text-xs">
            <p className="font-semibold text-slate-800 leading-none">{user?.first_name} {user?.last_name}</p>
            <p className="text-slate-400 mt-0.5">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
