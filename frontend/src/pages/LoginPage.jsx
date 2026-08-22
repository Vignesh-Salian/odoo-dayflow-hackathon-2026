import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthAPI } from '../api/client';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Alert } from '../components/Alert';
import { Layers, Shield, User, Lock, ArrowRight } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@dayflow.com');
  const [password, setPassword] = useState('Admin@2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await AuthAPI.login({ email, password });
      if (res.success) {
        login(res.data);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (role) => {
    if (role === 'admin') {
      setEmail('admin@dayflow.com');
      setPassword('Admin@2026');
    } else {
      setEmail('john.doe@dayflow.com');
      setPassword('Employee@2026');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-indigo-600 p-6 text-white text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md mb-3 border border-white/20">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Dayflow HRMS</h1>
          <p className="text-xs text-indigo-100 mt-1">Human Resource Management System</p>
        </div>

        {/* Form Area */}
        <div className="p-6 sm:p-8 space-y-6">
          {error && <Alert type="danger" title="Authentication Failed" message={error} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              placeholder="user@dayflow.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 font-semibold"
              isLoading={loading}
              icon={ArrowRight}
            >
              Sign In to Dayflow
            </Button>
          </form>

          {/* Quick Demo Selector */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2">
              Quick Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('admin')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                Admin / HR
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('employee')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Employee
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
