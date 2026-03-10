export default function Table({ columns, data, emptyMessage = 'No hay datos disponibles' }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-[#8b949e] text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#1e293b]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#0d1117] border-b border-[#1e293b]">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-medium text-[#8b949e] uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={row.id ?? rowIndex}
              className={`border-b border-[#1e293b] transition-colors hover:bg-[#1e293b]/30 ${
                rowIndex % 2 === 0 ? 'bg-[#161b22]' : 'bg-[#0d1117]'
              }`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-[#e6edf3]">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
