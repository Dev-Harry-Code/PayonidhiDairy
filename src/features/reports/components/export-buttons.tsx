"use client";

type ExportRow = Record<string, string | number>;

function escapeHtml(value: string | number) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}

function downloadExcel(title: string, rows: ExportRow[], filename: string) {
  const headers = Object.keys(rows[0] ?? {});
  const table = `<html><head><meta charset="UTF-8"><style>body{font-family:Arial}th{background:#147d63;color:white}th,td{border:1px solid #ccc;padding:6px;text-align:left}</style></head><body><h2>${escapeHtml(title)}</h2><table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml(row[header] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  const blob = new Blob([table], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${filename}.xls`; link.click(); URL.revokeObjectURL(url);
}

function printPdf(title: string, rows: ExportRow[]) {
  const headers = Object.keys(rows[0] ?? {});
  const table = `<h1>${escapeHtml(title)}</h1><p>Generated ${new Date().toLocaleString()}</p><table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml(row[header] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  const popup = window.open("", "_blank", "width=1100,height=800");
  if (!popup) return;
  popup.document.write(`<html><head><title>${escapeHtml(title)}</title><style>body{font-family:Arial;padding:32px;color:#163b34}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #cbd5d1;padding:8px;text-align:left}th{background:#147d63;color:#fff}h1{margin-bottom:4px}@media print{button{display:none}}</style></head><body>${table}<script>window.onload=()=>window.print()</script></body></html>`); popup.document.close();
}

export function ExportButtons({ title, filename, rows, compact = false }: { title: string; filename: string; rows: ExportRow[]; compact?: boolean }) {
  const disabled = rows.length === 0;
  return <div className="flex flex-wrap gap-2"><button type="button" disabled={disabled} onClick={() => downloadExcel(title, rows, filename)} className={`${compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"} rounded-lg border bg-card font-semibold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50`}>Excel</button><button type="button" disabled={disabled} onClick={() => printPdf(title, rows)} className={`${compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"} rounded-lg border bg-card font-semibold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50`}>PDF</button></div>;
}
