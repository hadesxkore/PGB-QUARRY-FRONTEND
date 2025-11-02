import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface TruckLog {
  _id: string;
  plateNumber: string;
  brand: string;
  company: string;
  logType: 'IN' | 'OUT';
  logDate: string;
  logTime: string;
  user: {
    name: string;
    username: string;
  };
  createdAt: string;
}

export const exportLogsToExcel = (logs: TruckLog[], dateRange: { from: Date; to: Date }) => {
  // Prepare data for Excel
  const excelData = logs.map((log, index) => ({
    'No.': index + 1,
    'Plate Number': log.plateNumber,
    'Brand': log.brand,
    'Company': log.company,
    'Type': log.logType,
    'Date': format(new Date(log.logDate), 'MMM dd, yyyy'),
    'Time': log.logTime,
    'Logged By': log.user?.name || 'Unknown',
  }));

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const colWidths = [
    { wch: 5 },  // No.
    { wch: 15 }, // Plate Number
    { wch: 15 }, // Brand
    { wch: 20 }, // Company
    { wch: 8 },  // Type
    { wch: 15 }, // Date
    { wch: 12 }, // Time
    { wch: 20 }, // Logged By
  ];
  ws['!cols'] = colWidths;

  // Style header row (bold)
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddress]) continue;
    ws[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "E2E8F0" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Truck Logs');

  // Generate filename with date range
  const filename = `Truck_Logs_${format(dateRange.from, 'yyyy-MM-dd')}_to_${format(dateRange.to, 'yyyy-MM-dd')}.xlsx`;

  // Download file
  XLSX.writeFile(wb, filename);
};
