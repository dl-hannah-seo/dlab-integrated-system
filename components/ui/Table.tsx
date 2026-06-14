import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  emptyMessage = '데이터가 없습니다.',
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#F7F7F5] border-b border-[#E9E9E7]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left font-semibold text-[#37352F] whitespace-nowrap ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-[#787774]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                className={`border-b border-[#E9E9E7] ${onRowClick ? 'cursor-pointer hover:bg-[#F7F7F5]' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-[#37352F] ${col.className ?? ''}`}>
                    {col.render ? col.render(row) : String(row[col.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
