import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { HealthAPI } from '../api/client';

export const DashboardLayout = ({ children, currentTab, setCurrentTab }) => {
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await HealthAPI.check();
        if (res.success) setBackendOnline(true);
      } catch {
        setBackendOnline(false);
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar backendOnline={backendOnline} />
      <div className="flex flex-1">
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
};
