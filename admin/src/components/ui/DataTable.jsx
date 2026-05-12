export default function DataTable({ columns, data, emptyText = "Kayıt yok" }) {
  return (
    <div className="overflow-x-auto">
      <table className="table table-sm">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.headerClassName}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="text-center opacity-60 py-6">
                {emptyText}
              </td>
            </tr>
          )}
          {data.map((row, i) => (
            <tr key={row.id ?? i}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
