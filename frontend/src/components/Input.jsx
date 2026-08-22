import React from 'react';

export const Input = ({
  label,
  error,
  helperText,
  required = false,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3 py-2 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:cursor-not-allowed ${
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 text-rose-900 bg-rose-50/30'
            : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200 text-slate-900 bg-white'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-xs font-medium text-rose-600 animate-fadeIn">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
};
