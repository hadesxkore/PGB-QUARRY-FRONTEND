import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Calendar as CalendarIcon,
  Download,
  RefreshCw,
  FileText,
  Eye,
  Pencil,
  Trash2
} from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface AdminTruckLog {
  _id: string;
  quarryId: {
    _id: string;
    name: string;
    location: string;
    proponent: string;
  };
  logType: 'in' | 'out';
  truckCount: number;
  truckStatus?: 'empty' | 'half-loaded' | 'full';
  notes?: string;
  loggedBy: {
    _id: string;
    name: string;
    username: string;
  };
  logDate: string;
  createdAt: string;
  updatedAt: string;
}

type LogTypeFilter = 'all' | 'in' | 'out';
type DateRangeType = 'today' | 'week' | 'month' | 'year';

export default function AdminTruckLogsPage() {
  const [logs, setLogs] = useState<AdminTruckLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [logTypeFilter, setLogTypeFilter] = useState<LogTypeFilter>('all');
  const [quarryFilter, setQuarryFilter] = useState<string>('all');
  const [date, setDate] = useState<Date>(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfDateRange, setPdfDateRange] = useState<DateRangeType>('today');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('');
  const [excelDialogOpen, setExcelDialogOpen] = useState(false);
  const [excelDateRange, setExcelDateRange] = useState<DateRangeType>('today');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AdminTruckLog | null>(null);
  const [editTime, setEditTime] = useState('');
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [editTruckStatus, setEditTruckStatus] = useState<'empty' | 'half-loaded' | 'full'>('full');
  const itemsPerPage = 10;

  // Fetch logs
  useEffect(() => {
    fetchLogs();
  }, [date]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;

      const startDate = startOfDay(date);
      const endDate = endOfDay(date);

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin-truck-logs?${params}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch logs');

      const result = await response.json();
      setLogs(result.data || []);
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load logs');
    } finally {
      setIsLoading(false);
    }
  };

  // Open edit dialog
  const handleEditClick = (log: AdminTruckLog) => {
    setSelectedLog(log);
    // Format time as HH:MM for input
    const logDate = new Date(log.logDate);
    const hours = logDate.getHours().toString().padStart(2, '0');
    const minutes = logDate.getMinutes().toString().padStart(2, '0');
    setEditTime(`${hours}:${minutes}`);
    setEditDate(logDate);
    setEditTruckStatus(log.truckStatus || 'full');
    setEditDialogOpen(true);
  };

  // Update log date and time
  const handleUpdateTime = async () => {
    if (!selectedLog || !editTime || !editDate) return;

    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;

      // Parse the time and combine with selected date
      const [hours, minutes] = editTime.split(':').map(Number);
      const newLogDate = new Date(editDate);
      newLogDate.setHours(hours, minutes, 0, 0);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin-truck-logs/${selectedLog._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          logDate: newLogDate.toISOString(),
          truckCount: selectedLog.truckCount,
          truckStatus: editTruckStatus,
          notes: selectedLog.notes
        })
      });

      if (!response.ok) throw new Error('Failed to update log');

      toast.success('Log updated successfully');
      setEditDialogOpen(false);
      fetchLogs(); // Refresh logs
    } catch (error: any) {
      console.error('Error updating log:', error);
      toast.error('Failed to update time');
    }
  };

  // Delete log
  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this log? This action cannot be undone.')) {
      return;
    }

    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin-truck-logs/${logId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete log');

      toast.success('Log deleted successfully');
      fetchLogs(); // Refresh logs
    } catch (error: any) {
      console.error('Error deleting log:', error);
      toast.error('Failed to delete log');
    }
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (logTypeFilter !== 'all' && log.logType !== logTypeFilter) return false;
    if (quarryFilter !== 'all' && log.quarryId.name !== quarryFilter) return false;
    return true;
  });

  // Get unique quarries - filter out empty/null values
  const uniqueQuarries = Array.from(new Set(logs.map(log => log.quarryId?.name).filter(name => name && name.trim() !== '')));

  // Calculate stats
  const inCount = filteredLogs.filter(log => log.logType === 'in').reduce((sum, log) => sum + log.truckCount, 0);
  const outCount = filteredLogs.filter(log => log.logType === 'out').reduce((sum, log) => sum + log.truckCount, 0);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get date range based on selection
  const getDateRange = (rangeType: DateRangeType) => {
    const now = new Date();
    switch (rangeType) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
    }
  };

  // Fetch logs for PDF
  const fetchLogsForPDF = async (rangeType: DateRangeType) => {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;

      const { start, end } = getDateRange(rangeType);

      const params = new URLSearchParams({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin-truck-logs?${params}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch logs');

      const result = await response.json();
      return result.data || [];
    } catch (error: any) {
      console.error('Error fetching logs for PDF:', error);
      toast.error('Failed to load logs for PDF');
      return [];
    }
  };

  // Convert image to base64
  const getImageBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  // Generate PDF
  const generatePDF = async (rangeType: DateRangeType) => {
    const pdfLogs = await fetchLogsForPDF(rangeType);
    
    if (pdfLogs.length === 0) {
      toast.error('No logs found for the selected date range');
      return null;
    }

    const doc = new jsPDF();
    
    // Add Bataan Logo (from public/images folder)
    try {
      const logoBase64 = await getImageBase64('/images/bataanlogo.png');
      doc.addImage(logoBase64, 'PNG', 14, 10, 20, 20);
    } catch (error) {
      console.error('Logo error:', error);
      console.log('Make sure bataanlogo.png exists in public/images/ folder');
    }

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Provincial Government of Bataan', 40, 15);
    
    doc.setFontSize(14);
    doc.text('Admin Truck Logs Report', 40, 23);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const { start, end } = getDateRange(rangeType);
    doc.text(`Period: ${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`, 40, 29);
    doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy hh:mm a')}`, 40, 34);

    // Summary Stats
    const inLogs = pdfLogs.filter((log: AdminTruckLog) => log.logType === 'in').reduce((sum: number, log: AdminTruckLog) => sum + log.truckCount, 0);
    const outLogs = pdfLogs.filter((log: AdminTruckLog) => log.logType === 'out').reduce((sum: number, log: AdminTruckLog) => sum + log.truckCount, 0);
    
    doc.setFontSize(9);
    doc.text(`Total Logs: ${pdfLogs.length} | Trucks IN: ${inLogs} | Trucks OUT: ${outLogs}`, 14, 42);

    // Table with PURPLE theme
    autoTable(doc, {
      startY: 48,
      head: [['Type', 'Proponent', 'Location', 'Count', 'Remarks', 'Date', 'Time', 'Admin']],
      body: pdfLogs.map((log: AdminTruckLog) => [
        log.logType.toUpperCase(),
        log.quarryId?.proponent || 'N/A',
        log.quarryId.location,
        log.truckCount.toString(),
        log.truckStatus === 'full' ? 'Full' : log.truckStatus === 'half-loaded' ? 'Half-Loaded' : log.truckStatus === 'empty' ? 'Empty' : 'N/A',
        format(new Date(log.logDate), 'MMM dd, yyyy'),
        format(new Date(log.logDate), 'hh:mm a'),
        log.loggedBy?.name || 'Unknown'
      ]),
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [147, 51, 234], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 243, 255] },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 28 },
        4: { cellWidth: 12, halign: 'center' },
        5: { cellWidth: 22 },
        6: { cellWidth: 18 },
        7: { cellWidth: 23 }
      },
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    return doc;
  };

  // Handle PDF Preview
  const handlePDFPreview = async () => {
    setPdfDialogOpen(true);
    const doc = await generatePDF(pdfDateRange);
    if (doc) {
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfPreviewUrl(url);
    }
  };

  // Handle PDF Download
  const handlePDFDownload = async () => {
    const doc = await generatePDF(pdfDateRange);
    if (doc) {
      const { start, end } = getDateRange(pdfDateRange);
      const filename = `Admin_Truck_Logs_${format(start, 'MMM_dd_yyyy')}_to_${format(end, 'MMM_dd_yyyy')}.pdf`;
      doc.save(filename);
      toast.success('PDF downloaded successfully!');
    }
  };

  // Handle Excel Export
  const handleExcelExport = async () => {
    const excelLogs = await fetchLogsForPDF(excelDateRange);
    
    if (excelLogs.length === 0) {
      toast.error('No logs found for the selected date range');
      return;
    }

    // Prepare data for Excel
    const { start, end } = getDateRange(excelDateRange);
    const inLogs = excelLogs.filter((log: AdminTruckLog) => log.logType === 'in').reduce((sum: number, log: AdminTruckLog) => sum + log.truckCount, 0);
    const outLogs = excelLogs.filter((log: AdminTruckLog) => log.logType === 'out').reduce((sum: number, log: AdminTruckLog) => sum + log.truckCount, 0);

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Logs sheet (FIRST - so it opens by default)
    const logsData = excelLogs.map((log: AdminTruckLog) => ({
      'Type': log.logType.toUpperCase(),
      'Proponent': log.quarryId?.proponent || 'N/A',
      'Location': log.quarryId.location,
      'Truck Count': log.truckCount,
      'Remarks': log.truckStatus === 'full' ? 'Full' : log.truckStatus === 'half-loaded' ? 'Half-Loaded' : log.truckStatus === 'empty' ? 'Empty' : 'N/A',
      'Date': format(new Date(log.logDate), 'MMM dd, yyyy'),
      'Time': format(new Date(log.logDate), 'hh:mm a'),
      'Logged By': log.loggedBy?.name || 'Unknown'
    }));

    const logsWS = XLSX.utils.json_to_sheet(logsData);
    
    // Set column widths
    logsWS['!cols'] = [
      { wch: 10 },  // Type
      { wch: 25 },  // Proponent
      { wch: 20 },  // Location
      { wch: 12 },  // Truck Count
      { wch: 15 },  // Remarks
      { wch: 15 },  // Date
      { wch: 12 },  // Time
      { wch: 20 }   // Logged By
    ];

    XLSX.utils.book_append_sheet(wb, logsWS, 'Admin Truck Logs');

    // Summary sheet (SECOND)
    const summaryData = [
      ['Provincial Government of Bataan'],
      ['Admin Truck Logs Report'],
      [''],
      ['Period:', `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`],
      ['Generated:', format(new Date(), 'MMM dd, yyyy hh:mm a')],
      [''],
      ['Summary Statistics'],
      ['Total Logs:', excelLogs.length],
      ['Trucks IN:', inLogs],
      ['Trucks OUT:', outLogs],
    ];

    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');

    // Generate filename and download
    const filename = `Admin_Truck_Logs_${format(start, 'MMM_dd_yyyy')}_to_${format(end, 'MMM_dd_yyyy')}.xlsx`;
    XLSX.writeFile(wb, filename);
    
    toast.success('Excel file downloaded successfully!');
    setExcelDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Admin Truck Logs</h2>
          <p className="text-sm text-slate-500">Manual counting records by administrators</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchLogs} variant="outline" size="sm" className="gap-2 h-8 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button onClick={handlePDFPreview} variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
            <FileText className="h-3.5 w-3.5" />
            Export PDF
          </Button>
          <Button onClick={() => setExcelDialogOpen(true)} variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
            <Download className="h-3.5 w-3.5" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-slate-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{filteredLogs.length}</div>
            <p className="text-xs text-slate-500 mt-1">For selected date</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <ArrowDownToLine className="h-4 w-4 text-green-600" />
              Trucks IN
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{inCount}</div>
            <p className="text-xs text-slate-500 mt-1">Total counted</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <ArrowUpFromLine className="h-4 w-4 text-red-600" />
              Trucks OUT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{outCount}</div>
            <p className="text-xs text-slate-500 mt-1">Total counted</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            {/* Title and Filters Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-lg">Admin Truck Logs</CardTitle>
              
              {/* Quarry and Type Filters - Top Right */}
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Quarry Filter */}
                <Select value={quarryFilter} onValueChange={setQuarryFilter}>
                  <SelectTrigger className="w-full sm:w-[140px] h-8 text-xs">
                    <SelectValue placeholder="All Quarries" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-[300px]">
                    <SelectItem value="all">All Quarries</SelectItem>
                    {uniqueQuarries.map((quarry) => (
                      <SelectItem key={quarry} value={quarry}>
                        {quarry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Log Type Filter */}
                <Select value={logTypeFilter} onValueChange={(value: LogTypeFilter) => setLogTypeFilter(value)}>
                  <SelectTrigger className="w-full sm:w-[120px] h-8 text-xs">
                    <SelectValue placeholder="All Logs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Logs</SelectItem>
                    <SelectItem value="in">
                      <div className="flex items-center gap-2">
                        <ArrowDownToLine className="h-3.5 w-3.5 text-green-600" />
                        Truck IN
                      </div>
                    </SelectItem>
                    <SelectItem value="out">
                      <div className="flex items-center gap-2">
                        <ArrowUpFromLine className="h-3.5 w-3.5 text-red-600" />
                        Truck OUT
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description and Calendar Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardDescription>
                Showing {filteredLogs.length} logs for {format(date, 'MMMM dd, yyyy')}
              </CardDescription>
              
              {/* Date Picker - Bottom Right */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto justify-start text-left font-normal h-8 text-xs">
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                    {format(date, 'MMM dd, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No logs found for this date</div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Type</TableHead>
                      <TableHead>Proponent</TableHead>
                      <TableHead className="hidden lg:table-cell">Location</TableHead>
                      <TableHead className="w-[80px]">Count</TableHead>
                      <TableHead className="hidden md:table-cell">Remarks</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="hidden xl:table-cell">Time</TableHead>
                      <TableHead className="hidden lg:table-cell">Logged By</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell>
                          <Badge 
                            variant={log.logType === 'in' ? 'default' : 'destructive'}
                            className={cn(
                              'gap-1',
                              log.logType === 'in' ? 'bg-green-600' : ''
                            )}
                          >
                            {log.logType === 'in' ? (
                              <ArrowDownToLine className="h-3 w-3" />
                            ) : (
                              <ArrowUpFromLine className="h-3 w-3" />
                            )}
                            {log.logType.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {log.quarryId?.proponent || 'N/A'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                          {log.quarryId.location}
                        </TableCell>
                        <TableCell className="font-bold text-center">{log.truckCount}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge 
                            variant="outline"
                            className={cn(
                              log.truckStatus === 'full' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                              log.truckStatus === 'half-loaded' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                              log.truckStatus === 'empty' ? 'bg-gray-50 text-gray-700 border-gray-300' :
                              'bg-gray-50 text-gray-700 border-gray-300'
                            )}
                          >
                            {log.truckStatus === 'full' ? 'Full' :
                             log.truckStatus === 'half-loaded' ? 'Half-Loaded' :
                             log.truckStatus === 'empty' ? 'Empty' : 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{format(new Date(log.logDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="hidden xl:table-cell text-muted-foreground">{format(new Date(log.logDate), 'hh:mm a')}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {log.loggedBy?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(log)}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLog(log._id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {filteredLogs.length > itemsPerPage && (
                <div className="flex justify-end pt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNumber = index + 1;
                        
                        // Show first, last, current, and adjacent pages
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationLink
                                onClick={() => setCurrentPage(pageNumber)}
                                isActive={currentPage === pageNumber}
                                className="cursor-pointer"
                              >
                                {pageNumber}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (
                          pageNumber === currentPage - 2 ||
                          pageNumber === currentPage + 2
                        ) {
                          return <PaginationItem key={pageNumber}><span className="px-4">...</span></PaginationItem>;
                        }
                        return null;
                      })}

                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* PDF Preview Dialog */}
      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Export Admin Truck Logs PDF</DialogTitle>
            <DialogDescription>
              Select the date range for the logs you want to export
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Date Range Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Date Range</label>
              <Select value={pdfDateRange} onValueChange={(value: DateRangeType) => setPdfDateRange(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today's Logs</SelectItem>
                  <SelectItem value="week">This Week's Logs</SelectItem>
                  <SelectItem value="month">This Month's Logs</SelectItem>
                  <SelectItem value="year">This Year's Logs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* PDF Preview */}
            {pdfPreviewUrl && (
              <div className="border rounded-lg overflow-hidden bg-slate-50">
                <div className="bg-slate-100 px-4 py-2 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">PDF Preview</span>
                  </div>
                </div>
                <div className="p-4">
                  <iframe
                    src={pdfPreviewUrl}
                    className="w-full h-[500px] border rounded"
                    title="PDF Preview"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={handlePDFPreview}
                variant="outline"
                className="w-full sm:w-auto gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview PDF
              </Button>
              <Button 
                onClick={handlePDFDownload}
                className="w-full sm:w-auto gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Excel Export Dialog */}
      <Dialog open={excelDialogOpen} onOpenChange={setExcelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Export to Excel</DialogTitle>
            <DialogDescription>
              Select the date range for the logs you want to export
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Date Range Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Date Range</label>
              <Select value={excelDateRange} onValueChange={(value: DateRangeType) => setExcelDateRange(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today's Logs</SelectItem>
                  <SelectItem value="week">This Week's Logs</SelectItem>
                  <SelectItem value="month">This Month's Logs</SelectItem>
                  <SelectItem value="year">This Year's Logs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                The Excel file will contain two sheets:
              </p>
              <ul className="text-xs text-blue-700 mt-2 space-y-1 ml-4">
                <li>• <strong>Summary</strong> - Overview and statistics</li>
                <li>• <strong>Truck Logs</strong> - Detailed log entries</li>
              </ul>
            </div>

            {/* Action Button */}
            <div className="flex justify-end pt-2">
              <Button 
                onClick={handleExcelExport}
                className="w-full sm:w-auto gap-2"
              >
                <Download className="h-4 w-4" />
                Download Excel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Time Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Log Time</DialogTitle>
            <DialogDescription>
              Update the time for this truck log entry
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Log Details</Label>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Type:</strong> {selectedLog.logType.toUpperCase()}</p>
                  <p><strong>Proponent:</strong> {selectedLog.quarryId?.proponent || 'N/A'}</p>
                  <p><strong>Current Date:</strong> {format(new Date(selectedLog.logDate), 'MMM dd, yyyy')}</p>
                  <p><strong>Current Time:</strong> {format(new Date(selectedLog.logDate), 'hh:mm a')}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-date">New Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editDate ? format(editDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editDate}
                      onSelect={setEditDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-time">New Time</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-truck-status">Truck Status (Remarks)</Label>
                <Select value={editTruckStatus} onValueChange={(value: any) => setEditTruckStatus(value)}>
                  <SelectTrigger id="edit-truck-status">
                    <SelectValue placeholder="Select truck status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empty">Empty</SelectItem>
                    <SelectItem value="half-loaded">Half-Loaded</SelectItem>
                    <SelectItem value="full">Full</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTime}
              disabled={!editTime || !editDate}
            >
              Update Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
