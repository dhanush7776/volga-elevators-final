import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export type ExportColumn = {
  key: string;
  label: string;
  relation?: { table: string; labelKey: string };
};

type CompanyInfo = {
  name: string;
  logoDataUrl?: string | null;
};

function formatCell(row: Record<string, unknown>, col: ExportColumn): string {
  const value = col.relation
    ? (row[col.relation.table] as any)?.[col.relation.labelKey]
    : row[col.key];
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

export function exportToPDF(
  title: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
  company: CompanyInfo
) {
  const doc = new jsPDF({ orientation: columns.length > 6 ? 'landscape' : 'portrait' });
  const generatedAt = new Date();

  if (company.logoDataUrl) {
    try {
      doc.addImage(company.logoDataUrl, 'PNG', 14, 10, 16, 16);
    } catch {
      // ignore bad image data
    }
  }

  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text(company.name, company.logoDataUrl ? 34 : 14, 18);

  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(title, company.logoDataUrl ? 34 : 14, 25);

  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text(
    `Generated: ${format(generatedAt, 'dd MMM yyyy')} at ${format(generatedAt, 'hh:mm a')}`,
    company.logoDataUrl ? 34 : 14,
    31
  );
  doc.text(`Total Records: ${rows.length}`, company.logoDataUrl ? 34 : 14, 36);

  autoTable(doc, {
    startY: 42,
    head: [columns.map((c) => c.label)],
    body: rows.map((row) => columns.map((c) => formatCell(row, c))),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [13, 148, 136], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 253, 250] },
    didDrawPage: () => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${doc.getCurrentPageInfo().pageNumber} of ${pageCount}`,
        doc.internal.pageSize.getWidth() - 30,
        doc.internal.pageSize.getHeight() - 8
      );
    },
  });

  doc.save(`${slugify(title)}-${format(generatedAt, 'yyyy-MM-dd')}.pdf`);
}

export function exportToExcel(
  title: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[]
) {
  const data = rows.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((c) => (obj[c.label] = formatCell(row, c)));
    return obj;
  });
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, title.slice(0, 31));
  XLSX.writeFile(workbook, `${slugify(title)}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

export function exportToCSV(
  title: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[]
) {
  const header = columns.map((c) => escapeCsv(c.label)).join(',');
  const body = rows
    .map((row) => columns.map((c) => escapeCsv(formatCell(row, c))).join(','))
    .join('\n');
  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugify(title)}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
