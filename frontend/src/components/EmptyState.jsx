import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No data available',
  description = 'Get started by creating a new record or running the initial workflow.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
      <div className="p-3 bg-white border border-slate-200 rounded-full shadow-xs text-slate-400 mb-3">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
