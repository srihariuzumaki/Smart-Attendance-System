import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown, FileSpreadsheet, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface Student {
  USN: string;
  Name: string;
  Semester: string;
  Department: string;
  AcademicYear: string;
  present: boolean;
}

interface AttendanceRecord {
  USN: string;
  Name: string;
  Date: string;
  Present: boolean;
}

interface AttendanceReportProps {
  students: Student[];
  subject: string;
  section: string;
  department: string;
  semester: string;
  academicYear: string;
  date: Date;
}

const AttendanceReport = ({ 
  students, 
  subject, 
  section, 
  department,
  semester,
  academicYear,
  date 
}: AttendanceReportProps) => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().setDate(1)), // First day of current month
    to: new Date(),
  });

  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchAttendanceData();
    }
  }, [dateRange.from, dateRange.to]);

  const fetchAttendanceData = async () => {
    if (!dateRange.from || !dateRange.to) return;

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/view-attendance?` +
        `department=${department}&` +
        `academicYear=${academicYear}&` +
        `semester=${semester}&` +
        `subject=${subject}&` +
        `fromDate=${format(dateRange.from, 'yyyy-MM-dd')}&` +
        `toDate=${format(dateRange.to, 'yyyy-MM-dd')}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            description: "No attendance records found for the selected date range."
          });
          setAttendanceData([]);
          return;
        }
        throw new Error('Failed to fetch attendance data');
      }

      const data = await response.json();
      setAttendanceData(data.records);
    } catch (error) {
      toast({
        description: "Failed to fetch attendance records."
      });
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    if (!dateRange.from || !dateRange.to) return;
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/view-attendance?` +
        `department=${department}&` +
        `academicYear=${academicYear}&` +
        `semester=${semester}&` +
        `subject=${subject}&` +
        `fromDate=${format(dateRange.from, 'yyyy-MM-dd')}&` +
        `toDate=${format(dateRange.to, 'yyyy-MM-dd')}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch attendance data');
      }

      const data = await response.json();
      const blob = new Blob([data.csv_data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `attendance_${subject}_${section}_${format(dateRange.from, "dd-MM-yyyy")}_to_${format(dateRange.to, "dd-MM-yyyy")}.csv`);
      link.click();
    } catch (error) {
      toast({
        description: "Failed to download CSV file."
      });
    }
  };

  const handleDownloadExcel = async () => {
    if (!dateRange.from || !dateRange.to) return;
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/view-attendance?` +
        `department=${department}&` +
        `academicYear=${academicYear}&` +
        `semester=${semester}&` +
        `subject=${subject}&` +
        `fromDate=${format(dateRange.from, 'yyyy-MM-dd')}&` +
        `toDate=${format(dateRange.to, 'yyyy-MM-dd')}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch attendance data');
      }

      const data = await response.json();
      const binaryString = window.atob(data.excel_data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `attendance_${subject}_${section}_${format(dateRange.from, "dd-MM-yyyy")}_to_${format(dateRange.to, "dd-MM-yyyy")}.xlsx`);
      link.click();
    } catch (error) {
      toast({
        description: "Failed to download Excel file."
      });
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-col space-y-4">
        <div className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Attendance Report</CardTitle>
            <p className="text-sm text-muted-foreground">
              {subject} - Section {section}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleDownloadCSV} 
              className="gap-2" 
              disabled={!dateRange.from || !dateRange.to || loading}
            >
              <FileDown className="h-4 w-4" />
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDownloadExcel} 
              className="gap-2" 
              disabled={!dateRange.from || !dateRange.to || loading}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="space-y-2">
            <Label>Select Date Range</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal w-[160px]",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "dd/MM/yyyy") : "From date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal w-[160px]",
                      !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, "dd/MM/yyyy") : "To date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading attendance records...</div>
        ) : attendanceData.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>USN</TableHead>
                  <TableHead>Name</TableHead>
                  {Object.keys(attendanceData[0])
                    .filter(key => !['USN', 'Name'].includes(key))
                    .map(date => (
                      <TableHead key={date}>{format(new Date(date), "dd/MM")}</TableHead>
                    ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceData.map((record, index) => (
                  <TableRow key={`${record.USN}-${index}`}>
                    <TableCell>{record.USN}</TableCell>
                    <TableCell>{record.Name}</TableCell>
                    {Object.entries(record)
                      .filter(([key]) => !['USN', 'Name'].includes(key))
                      .map(([date, status], colIndex) => (
                        <TableCell key={`${record.USN}-${date}-${colIndex}`} className="text-center">
                          {status}
                        </TableCell>
                      ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            {dateRange.from && dateRange.to
              ? "No attendance records found for the selected date range"
              : "Select a date range to view attendance records"}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceReport;
