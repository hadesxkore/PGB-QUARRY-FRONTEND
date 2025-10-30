import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, TrendingUp } from 'lucide-react';

const reports = [
  { id: 1, title: 'Monthly Quarry Operations Report', date: 'October 2024', type: 'Monthly', size: '2.4 MB' },
  { id: 2, title: 'Truck Logs Summary', date: 'Week 43, 2024', type: 'Weekly', size: '1.8 MB' },
  { id: 3, title: 'CCTV Incident Report', date: 'October 28, 2024', type: 'Incident', size: '856 KB' },
  { id: 4, title: 'Permit Compliance Report', date: 'Q3 2024', type: 'Quarterly', size: '3.2 MB' },
  { id: 5, title: 'Environmental Impact Assessment', date: 'September 2024', type: 'Monthly', size: '4.1 MB' },
  { id: 6, title: 'Revenue Collection Report', date: 'October 2024', type: 'Monthly', size: '1.2 MB' },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reports</h2>
          <p className="text-sm text-slate-500">Generate and download system reports</p>
        </div>
        <Button className="gap-2">
          <FileText className="h-4 w-4" />
          Generate New Report
        </Button>
      </div>

      {/* Report Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">156</div>
            <p className="text-xs text-slate-500 mt-1">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">12</div>
            <p className="text-xs text-slate-500 mt-1">Generated reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">89</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +15% this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">3</div>
            <p className="text-xs text-slate-500 mt-1">In progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>Download or view generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900">{report.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {report.date}
                      </span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-500">{report.type}</span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-500">{report.size}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-3 w-3" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
