import React from 'react';

export const Table = ({ columns, data, keyField = 'id', onRowClick }) => {
  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg">
      <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
        <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={`px-4 py-3 ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {data.map((row, rIdx) => (
            <tr
              key={row[keyField] || rIdx}
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'hover:bg-slate-50 cursor-pointer transition-colors' : 'hover:bg-slate-50/60'}
            >
              {columns.map((col, cIdx) => (
                <td key={cIdx} className={`px-4 py-3 text-slate-700 ${col.cellClassName || ''}`}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
