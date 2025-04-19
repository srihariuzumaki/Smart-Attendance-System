import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Calendar as CalendarIcon, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Section {
  id: number;
  subject: string;
  section: string;
  semester: string;
  department: string;
  academic_year: string;
}

interface AttendanceRecord {
  USN: string;
  Name: string;
  dates: { [key: string]: boolean };
  total_classes: number;
  classes_attended: number;
  attendance_percentage: number;
}

const Reports = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [dates, setDates] = useState<string[]>([]);

  const fetchSections = async () => {
    try {
      const facultyId = localStorage.getItem("facultyId");
      
      if (!facultyId) {
        toast({
          title: "Error",
          description: "Faculty ID not found. Please login again.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const response = await fetch(`http://localhost:5000/api/faculty/${facultyId}/sections`);
      if (!response.ok) {
        throw new Error("Failed to fetch sections");
      }
      const data = await response.json();
      setSections(data.sections || []);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch sections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceReport = async () => {
    if (!selectedSection || !startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please select a section and date range",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const facultyId = localStorage.getItem("facultyId");
      
      if (!facultyId) {
        toast({
          title: "Error",
          description: "Faculty ID not found. Please login again.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/faculty/${facultyId}/attendance-report?` + 
        new URLSearchParams({
          subject: selectedSection.subject,
          department: selectedSection.department,
          semester: selectedSection.semester,
          section: selectedSection.section,
          fromDate: format(startDate, 'yyyy-MM-dd'),
          toDate: format(endDate, 'yyyy-MM-dd')
        })
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch attendance report");
      }
      
      const data = await response.json();
      
      // Process the attendance data to calculate percentages
      const processedData = (data.records || []).map((record: any) => {
        const totalClasses = Object.keys(record.dates || {}).length;
        const classesAttended = Object.values(record.dates || {}).filter(Boolean).length;
        const attendancePercentage = totalClasses > 0 ? (classesAttended / totalClasses) * 100 : 0;
        
        return {
          ...record,
          total_classes: totalClasses,
          classes_attended: classesAttended,
          attendance_percentage: attendancePercentage
        };
      });

      setAttendanceData(processedData);
      setDates(data.dates || []);
    } catch (error) {
      console.error("Error fetching attendance report:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch attendance report",
        variant: "destructive",
      });
      setAttendanceData([]);
      setDates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format: 'csv' | 'xlsx') => {
    try {
      const response = await fetch('http://localhost:5000/api/attendance/report/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: selectedSection?.subject,
          department: selectedSection?.department,
          semester: selectedSection?.semester,
          section: selectedSection?.section,
          start_date: startDate,
          end_date: endDate,
          format: format
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'attendance_report';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Ensure proper file extension
      if (!filename.endsWith(`.${format}`)) {
        filename = `${filename}.${format}`;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Report downloaded successfully",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download report",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  useEffect(() => {
    if (selectedSection && startDate && endDate) {
      fetchAttendanceReport();
    }
  }, [selectedSection, startDate, endDate]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const getAttendanceColor = (percentage: number | undefined) => {
    if (!percentage) return "text-gray-600 dark:text-gray-400";
    if (percentage >= 75) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const DownloadButton = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto">
          <Download className="mr-2 h-4 w-4" />
          Download Report
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleDownload('csv')}>
          Download as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload('xlsx')}>
          Download as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance Reports</h1>
        <p className="text-muted-foreground">View and analyze attendance records</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Section and Date Range</CardTitle>
          <CardDescription>Choose a section and specify the date range for the attendance report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="flex items-center gap-4">
              <Select
                value={selectedSection?.id.toString()}
                onValueChange={(value) => {
                  const section = sections.find((s) => s.id.toString() === value);
                  setSelectedSection(section || null);
                }}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id.toString()}>
                      {section.subject} - {section.department} {section.semester} {section.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">From Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={`w-[240px] justify-start text-left font-normal ${
                        !startDate && "text-muted-foreground"
                      }`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? (
                        format(startDate, "LLL dd, y")
                      ) : (
                        <span>Pick start date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        if (date) {
                          setStartDate(date);
                          // Reset end date if start date is after it
                          if (endDate && date > endDate) {
                            setEndDate(undefined);
                          }
                        }
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(23, 59, 59, 999);
                        return date > today;
                      }}
                      initialFocus
                      fromYear={2020}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">To Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={`w-[240px] justify-start text-left font-normal ${
                        !endDate && "text-muted-foreground"
                      }`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? (
                        format(endDate, "LLL dd, y")
                      ) : (
                        <span>Pick end date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => {
                        if (!startDate) return true;
                        const today = new Date();
                        today.setHours(23, 59, 59, 999);
                        // Only disable dates before start date
                        return date < startDate;
                      }}
                      initialFocus
                      defaultMonth={startDate}
                      fromYear={2020}
                      toYear={2025}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button 
                className="mt-8"
                onClick={fetchAttendanceReport}
                disabled={!selectedSection || !startDate || !endDate}
              >
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          {selectedSection && startDate && endDate && (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>USN</TableHead>
                      <TableHead>Name</TableHead>
                      {dates.map((date) => (
                        <TableHead key={date} className="text-center">
                          {formatDate(date)}
                        </TableHead>
                      ))}
                      <TableHead className="text-center">Classes Attended</TableHead>
                      <TableHead className="text-center">Total Classes</TableHead>
                      <TableHead className="text-center">Attendance %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.map((record) => (
                      <TableRow key={record.USN}>
                        <TableCell>{record.USN}</TableCell>
                        <TableCell>{record.Name}</TableCell>
                        {dates.map((date) => (
                          <TableCell key={date} className="text-center">
                            {record.dates[date] ? "P" : "A"}
                          </TableCell>
                        ))}
                        <TableCell className="text-center">{record.classes_attended || 0}</TableCell>
                        <TableCell className="text-center">{record.total_classes || 0}</TableCell>
                        <TableCell className={`text-center font-medium ${getAttendanceColor(record.attendance_percentage)}`}>
                          {record.attendance_percentage ? record.attendance_percentage.toFixed(1) : '0.0'}%
                        </TableCell>
                      </TableRow>
                    ))}
                    {attendanceData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={dates.length + 5} className="text-center py-4">
                          No attendance records found for the selected date range
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
          {attendanceData.length > 0 && (
            <DownloadButton />
          )}
        </>
      )}
    </div>
  );
};

export default Reports; 