import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

const alertStyles = {
  info: 'bg-blue-50 text-blue-900 border-blue-200',
  success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  warning: 'bg-amber-50 text-amber-900 border-amber-200',
  danger: 'bg-rose-50 text-rose-900 border-rose-200',
};

const iconMap = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
};

export const Alert = ({ type = 'info', title, message, children, className = '' }) => {
  const Icon = iconMap[type] || Info;
  const style = alertStyles[type] || alertStyles.info;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border text-sm ${style} ${className}`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5 opacity-90" />
      <div className="flex-1">
        {title && <h4 className="font-semibold text-sm mb-0.5">{title}</h4>}
        {message && <p className="text-xs leading-relaxed">{message}</p>}
        {children}
      </div>
    </div>
  );
};
