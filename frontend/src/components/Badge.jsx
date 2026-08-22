import React from 'react';

const variants = {
  success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  danger: 'bg-rose-100 text-rose-800 border-rose-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
  default: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variantStyle = variants[variant] || variants.default;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variantStyle} ${className}`}>
      {children}
    </span>
  );
};
