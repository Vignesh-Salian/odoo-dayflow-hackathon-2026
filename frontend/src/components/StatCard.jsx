import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const StatCard = ({ title, value, change, changeType = 'positive', icon: Icon, iconColor = 'text-indigo-600 bg-indigo-50' }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {change && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
          {changeType === 'positive' ? (
            <span className="flex items-center text-emerald-600">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              {change}
            </span>
          ) : (
            <span className="flex items-center text-rose-600">
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              {change}
            </span>
          )}
          <span className="text-slate-400">vs target</span>
        </div>
      )}
    </div>
  );
};
