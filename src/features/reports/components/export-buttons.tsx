"use client";

type ExportRow = Record<string, string | number>;
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

function downloadExcel(rows: ExportRow[], filename: string) {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Report");
  XLSX.writeFile(workbook, `${filename}.xlsx`, { bookType: "xlsx" });
}

function printPdf(title: string, rows: ExportRow[]) {
  const headers = Object.keys(rows[0] ?? {});
  const doc = new jsPDF({ orientation: headers.length > 5 ? "landscape" : "portrait", unit: "pt", format: "a4" });
  const margin = 32; const pageWidth = doc.internal.pageSize.getWidth(); const usableWidth = pageWidth - margin * 2; const columnWidth = usableWidth / Math.max(headers.length, 1);
  doc.setFontSize(16); doc.setTextColor(20, 82, 67); doc.text(title, margin, margin); doc.setFontSize(9); doc.setTextColor(90, 105, 100); doc.text(`Generated ${new Date().toLocaleString()}`, margin, margin + 16);
  let y = margin + 38;
  const drawRow = (values: Array<string | number>, header = false) => { const lines = values.map((value) => doc.splitTextToSize(String(value ?? ""), columnWidth - 8)); const height = Math.max(...lines.map((line) => line.length), 1) * 12 + 10; if (y + height > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; } if (header) { doc.setFillColor(20, 125, 99); doc.setTextColor(255, 255, 255); doc.rect(margin, y, usableWidth, height, "F"); } else { doc.setTextColor(30, 50, 45); doc.setDrawColor(210, 220, 216); doc.rect(margin, y, usableWidth, height); } lines.forEach((line, index) => doc.text(line, margin + index * columnWidth + 4, y + 14)); y += height; };
  drawRow(headers, true); rows.forEach((row) => drawRow(headers.map((header) => row[header] ?? ""))); doc.save(`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`);
}

export function ExportButtons({ title, filename, rows, compact = false, includePdf = true }: { title: string; filename: string; rows: ExportRow[]; compact?: boolean; includePdf?: boolean }) {
  const disabled = rows.length === 0;
  return <div className="flex flex-wrap gap-2"><button type="button" disabled={disabled} onClick={() => downloadExcel(rows, filename)} className={`${compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"} rounded-lg border bg-card font-semibold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50`}>Excel</button>{includePdf && <button type="button" disabled={disabled} onClick={() => printPdf(title, rows)} className={`${compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"} rounded-lg border bg-card font-semibold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50`}>PDF</button>}</div>;
}

export function ExportGroup({ label, title, filename, rows }: { label: string; title: string; filename: string; rows: ExportRow[] }) {
  return <div className="rounded-xl border bg-card/80 px-3 py-2"><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><ExportButtons title={title} filename={filename} rows={rows} compact /></div>;
}
