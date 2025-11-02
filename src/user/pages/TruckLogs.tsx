import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { 
  Calendar as CalendarIcon, 
  ArrowDownToLine, 
  ArrowUpFromLine,
  Filter,
  FileSpreadsheet,
  FileText,
  ArrowUpDown,
  Search
} from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { exportLogsToExcel } from '@/utils/exportLogs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TruckLog {
  _id: string;
  truck: {
    _id: string;
    plateNumber: string;
    brand: string;
    model: string;
  };
  plateNumber: string;
  brand: string;
  company: string;
  logType: 'IN' | 'OUT';
  logDate: string;
  logTime: string;
  user: {
    _id: string;
    name: string;
    username: string;
  };
  createdAt: string;
}

type FilterType = 'today' | 'week' | 'month' | 'year' | 'custom';
type LogTypeFilter = 'all' | 'IN' | 'OUT';
type SortField = 'date' | 'plateNumber' | 'logType';
type SortOrder = 'asc' | 'desc';

export default function TruckLogs() {
  const [logs, setLogs] = useState<TruckLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>('today');
  const [logTypeFilter, setLogTypeFilter] = useState<LogTypeFilter>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportType, setExportType] = useState<'excel' | 'pdf'>('excel');
  const [searchQuery, setSearchQuery] = useState('');
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfDateRange, setPdfDateRange] = useState<FilterType>('today');

  // Fetch logs
  const fetchLogs = async (startDate: Date, endDate: Date) => {
    setIsLoading(true);
    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/truck-logs?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch logs');

      const result = await response.json();
      const allLogs = result.data || [];
      
      // Debug: Check if backend is already filtering
      console.log('Total logs from backend:', allLogs.length);
      if (allLogs.length > 0) {
        console.log('Sample log structure:', allLogs[0]);
        console.log('Sample log.user:', allLogs[0].user);
        console.log('Sample log.loggedBy:', allLogs[0].loggedBy);
        console.log('Current user ID:', useAuthStore.getState().user?.id);
      }
      
      // Backend should already filter by user, but add extra safety check
      const currentUser = useAuthStore.getState().user;
      const userLogs = allLogs.filter((log: any) => {
        const userId = currentUser?.id;
        // Check multiple possible fields for user ID
        const logUserId = log.user?._id || log.user?.id || log.user || log.loggedBy?._id || log.loggedBy?.id || log.loggedBy;
        
        // If no userId, include all (shouldn't happen)
        // Otherwise, only include if user IDs match
        return !userId || logUserId === userId;
      });
      
      console.log('Filtered logs:', userLogs.length);
      setLogs(userLogs);
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to fetch logs', {
        description: error.message || 'Something went wrong',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to convert image to base64
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

  // Get date range helper
  const getDateRange = (type: FilterType) => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (type) {
      case 'today':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'week':
        start = startOfWeek(now);
        end = endOfWeek(now);
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'year':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      default:
        start = startOfDay(now);
        end = endOfDay(now);
    }

    return { start, end };
  };

  // Fetch logs for PDF
  const fetchLogsForPDF = async (rangeType: FilterType) => {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;
      const { start, end } = getDateRange(rangeType);

      const params = new URLSearchParams({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/truck-logs?${params}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch logs');

      const result = await response.json();
      const allLogs = result.data || [];
      const currentUser = useAuthStore.getState().user;
      const userLogs = allLogs.filter((log: any) => {
        const loggedById = log.user?._id || log.user?.id || log.user || log.loggedBy?._id || log.loggedBy?.id || log.loggedBy;
        const userId = currentUser?.id;
        return !userId || loggedById === userId || log.user === userId || log.user?._id === userId || log.user?.id === userId;
      });

      return userLogs;
    } catch (error) {
      console.error('Error fetching logs for PDF:', error);
      return [];
    }
  };

  // Generate PDF
  const generatePDF = async (rangeType: FilterType) => {
    const pdfLogs = await fetchLogsForPDF(rangeType);
    
    if (pdfLogs.length === 0) {
      toast.error('No logs found for the selected date range');
      return null;
    }

    const doc = new jsPDF();
    
    // Add Bataan Logo
    try {
      const logoBase64 = await getImageBase64('/images/bataanlogo.png');
      doc.addImage(logoBase64, 'PNG', 14, 10, 20, 20);
    } catch (error) {
      console.error('Logo error:', error);
    }

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Provincial Government of Bataan', 40, 15);
    
    doc.setFontSize(14);
    doc.text('My Truck Logs Report', 40, 23);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const { start, end } = getDateRange(rangeType);
    doc.text(`Period: ${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`, 40, 29);
    doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy hh:mm a')}`, 40, 34);

    // Summary Stats
    const inLogs = pdfLogs.filter((log: any) => log.logType === 'IN').length;
    const outLogs = pdfLogs.filter((log: any) => log.logType === 'OUT').length;
    
    doc.setFontSize(9);
    doc.text(`Total Logs: ${pdfLogs.length} | Trucks IN: ${inLogs} | Trucks OUT: ${outLogs}`, 14, 42);

    // Table with GREEN theme
    autoTable(doc, {
      startY: 48,
      head: [['Type', 'Plate Number', 'Brand', 'Company', 'Date', 'Time']],
      body: pdfLogs.map((log: any) => [
        log.logType.toUpperCase(),
        log.plateNumber,
        log.brand,
        log.company,
        format(new Date(log.createdAt), 'MMM dd, yyyy'),
        format(new Date(log.createdAt), 'hh:mm a'),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 45 },
        4: { cellWidth: 30 },
        5: { cellWidth: 25 }
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
      const filename = `My_Truck_Logs_${format(start, 'MMM_dd_yyyy')}_to_${format(end, 'MMM_dd_yyyy')}.pdf`;
      doc.save(filename);
      toast.success('PDF downloaded successfully!');
    }
  };

  // Handle filter change
  const handleFilterChange = (type: FilterType) => {
    setFilterType(type);
    const now = new Date();
    let from: Date;
    let to: Date;

    switch (type) {
      case 'today':
        from = startOfDay(now);
        to = endOfDay(now);
        break;
      case 'week':
        from = startOfWeek(now);
        to = endOfWeek(now);
        break;
      case 'month':
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case 'year':
        from = startOfYear(now);
        to = endOfYear(now);
        break;
      default:
        return;
    }

    setDateRange({ from, to });
    fetchLogs(from, to);
  };

  // Handle custom date range
  const handleCustomRange = (from: Date | undefined, to: Date | undefined) => {
    if (from && to) {
      setFilterType('custom');
      setDateRange({ from: startOfDay(from), to: endOfDay(to) });
      fetchLogs(startOfDay(from), endOfDay(to));
      setShowCalendar(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLogs(dateRange.from, dateRange.to);
  }, []);

  // Filter and sort logs
  const filteredLogs = logs.filter(log => {
    // Filter by log type
    if (logTypeFilter !== 'all' && log.logType !== logTypeFilter) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.plateNumber.toLowerCase().includes(query) ||
        log.brand.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'date') {
      comparison = new Date(a.logDate).getTime() - new Date(b.logDate).getTime();
    } else if (sortField === 'plateNumber') {
      comparison = a.plateNumber.localeCompare(b.plateNumber);
    } else if (sortField === 'logType') {
      comparison = a.logType.localeCompare(b.logType);
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Pagination
  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = sortedLogs.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [logTypeFilter, filterType, searchQuery]);

  // Calculate stats
  const inLogs = logs.filter(log => log.logType === 'IN');
  const outLogs = logs.filter(log => log.logType === 'OUT');

  // Toggle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-8">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Truck Logs</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all truck entry and exit records
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              className="gap-2 w-full sm:w-auto"
              onClick={() => {
                setExportType('excel');
                setShowExportDialog(true);
              }}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
            <Button 
              variant="outline" 
              className="gap-2 w-full sm:w-auto"
              onClick={() => {
                setExportType('pdf');
                setShowExportDialog(true);
              }}
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Filter Section */}
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filter Logs
                  </CardTitle>
                  <CardDescription>Select a time period to view logs</CardDescription>
                </div>
              </div>
              
              {/* Stats - Responsive Grid */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="flex flex-col p-3 rounded-lg border-2 border-slate-200 bg-slate-50">
                  <span className="text-xs text-muted-foreground">Total Logs</span>
                  <span className="text-2xl font-bold">{logs.length}</span>
                </div>
                <div className="flex flex-col p-3 rounded-lg border-2 border-green-200 bg-green-50">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ArrowDownToLine className="h-3 w-3 text-green-600" />
                    Entries
                  </span>
                  <span className="text-2xl font-bold text-green-600">{inLogs.length}</span>
                </div>
                <div className="flex flex-col p-3 rounded-lg border-2 border-red-200 bg-red-50">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ArrowUpFromLine className="h-3 w-3 text-red-600" />
                    Exits
                  </span>
                  <span className="text-2xl font-bold text-red-600">{outLogs.length}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterType === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('today')}
              >
                Today
              </Button>
              <Button
                variant={filterType === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('week')}
              >
                This Week
              </Button>
              <Button
                variant={filterType === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('month')}
              >
                This Month
              </Button>
              <Button
                variant={filterType === 'year' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('year')}
              >
                This Year
              </Button>
            </div>

            {/* Custom Date Range */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full sm:w-auto justify-start text-left font-normal',
                      filterType === 'custom' && 'border-primary'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterType === 'custom' ? (
                      <>
                        {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
                      </>
                    ) : (
                      'Custom Range'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => handleCustomRange(range?.from, range?.to)}
                    numberOfMonths={2}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <div className="text-sm text-muted-foreground flex items-center">
                Showing: {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table with Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-lg">Logs Table</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Sort By */}
                  <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Latest Date</SelectItem>
                      <SelectItem value="plateNumber">Plate Number</SelectItem>
                      <SelectItem value="logType">Type (IN/OUT)</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Log Type Filter */}
                  <Select value={logTypeFilter} onValueChange={(value: LogTypeFilter) => setLogTypeFilter(value)}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Logs</SelectItem>
                      <SelectItem value="IN">
                        <div className="flex items-center gap-2">
                          <ArrowDownToLine className="h-4 w-4 text-green-600" />
                          Truck IN
                        </div>
                      </SelectItem>
                      <SelectItem value="OUT">
                        <div className="flex items-center gap-2">
                          <ArrowUpFromLine className="h-4 w-4 text-red-600" />
                          Truck OUT
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by plate number or brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center text-muted-foreground">Loading logs...</div>
            ) : sortedLogs.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No logs found for this period</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Type</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 hover:bg-transparent p-0 font-semibold"
                          onClick={() => handleSort('plateNumber')}
                        >
                          Plate Number
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="hidden md:table-cell">Brand / Model</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 hover:bg-transparent p-0 font-semibold"
                          onClick={() => handleSort('date')}
                        >
                          Date
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="hidden lg:table-cell">Logged By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell>
                          <div className={cn(
                            'inline-flex p-1.5 rounded',
                            log.logType === 'IN' ? 'bg-green-100' : 'bg-red-100'
                          )}>
                            {log.logType === 'IN' ? (
                              <ArrowDownToLine className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowUpFromLine className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{log.plateNumber}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {log.brand}
                        </TableCell>
                        <TableCell className="font-medium">
                          {format(new Date(log.logDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{log.logTime}</span>
                            <Badge 
                              variant={log.logType === 'IN' ? 'default' : 'destructive'}
                              className={cn(
                                'text-xs',
                                log.logType === 'IN' ? 'bg-green-600' : ''
                              )}
                            >
                              {log.logType}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {log.user?.name || 'Unknown'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {!isLoading && sortedLogs.length > itemsPerPage && (
              <div className="flex justify-end mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className={cn(
                          'cursor-pointer',
                          currentPage === 1 && 'pointer-events-none opacity-50'
                        )}
                      />
                    </PaginationItem>
                    
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      // Show first page, last page, current page, and pages around current
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
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}

                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className={cn(
                          'cursor-pointer',
                          currentPage === totalPages && 'pointer-events-none opacity-50'
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Confirmation Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Export to {exportType === 'excel' ? 'Excel' : 'PDF'}
              </DialogTitle>
              <DialogDescription>
                {exportType === 'excel' 
                  ? 'This will export all filtered logs to an Excel file (.xlsx) with a clean, formatted layout.'
                  : 'This will export all filtered logs to a PDF file with a professional layout.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="space-y-4">
                  {exportType === 'pdf' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">PDF Date Range</label>
                      <Select value={pdfDateRange} onValueChange={(value: FilterType) => setPdfDateRange(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                          <SelectItem value="year">This Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Records:</span>
                      <span className="font-semibold">{sortedLogs.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date Range:</span>
                      <span className="font-semibold">
                        {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Filter:</span>
                      <span className="font-semibold">
                        {logTypeFilter === 'all' ? 'All Logs' : logTypeFilter === 'IN' ? 'Entries Only' : 'Exits Only'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowExportDialog(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              {exportType === 'excel' ? (
                <Button
                  onClick={() => {
                    exportLogsToExcel(sortedLogs, dateRange);
                    toast.success('Excel file exported successfully!', {
                      description: `Exported ${sortedLogs.length} records`,
                    });
                    setShowExportDialog(false);
                  }}
                  className="w-full sm:w-auto gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Export Excel
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowExportDialog(false);
                      handlePDFPreview();
                    }}
                    className="w-full sm:w-auto gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Preview PDF
                  </Button>
                  <Button
                    onClick={() => {
                      handlePDFDownload();
                      setShowExportDialog(false);
                    }}
                    className="w-full sm:w-auto gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Download PDF
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* PDF Preview Dialog */}
        <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
          <DialogContent className="max-w-4xl h-[90vh] p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>PDF Preview</DialogTitle>
              <DialogDescription>
                Preview your truck logs report before downloading
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 p-6 pt-4">
              {pdfPreviewUrl ? (
                <iframe
                  src={pdfPreviewUrl}
                  className="w-full h-[calc(90vh-180px)] border rounded-lg"
                  title="PDF Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-[calc(90vh-180px)]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Generating PDF preview...</p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="p-6 pt-0">
              <Button variant="outline" onClick={() => setPdfDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => {
                handlePDFDownload();
                setPdfDialogOpen(false);
              }}>
                <FileText className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
