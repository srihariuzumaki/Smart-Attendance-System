import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download, FileDown, Filter, FileSpreadsheet } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface Subject {
  code: string;
  name: string;
  semester: string;
  department: string;
  section: string;
}

const ViewReports = () => {
  const [reportType, setReportType] = useState("format1");
  const [faculty, setFaculty] = useState("");
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [department, setDepartment] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch faculty list when component mounts
  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/faculty");
        if (!response.ok) {
          throw new Error('Failed to fetch faculty list');
        }
        const data = await response.json();
        setFacultyList(data.faculty || []);
      } catch (error) {
        console.error('Error fetching faculty:', error);
        toast({
          title: "Error",
          description: "Failed to fetch faculty list",
          variant: "destructive",
        });
      }
    };

    fetchFaculty();
  }, []);

  // Fetch subjects when faculty is selected
  useEffect(() => {
    if (faculty) {
      const fetchSubjects = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/faculty/${faculty}/subjects`);
          if (!response.ok) {
            throw new Error('Failed to fetch subjects');
          }
          const data = await response.json();
          setSubjects(data.subjects || []);

          // If faculty changes, reset subject selection
          setSubject("");

          // Set department from the selected faculty's department
          const selectedFaculty = facultyList.find(f => f.faculty_id === faculty);
          if (selectedFaculty) {
            setDepartment(selectedFaculty.department);
          }
        } catch (error) {
          console.error('Error fetching subjects:', error);
          setSubjects([]);
        }
      };

      fetchSubjects();
    } else {
      setSubjects([]);
      setSubject("");
      setDepartment("");
    }
  }, [faculty, facultyList]);

  const handleGenerateReport = async () => {
    if (!faculty || !subject || !fromDate || !toDate) {
      toast({
        title: "Error",
        description: "Please fill in all the required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const selectedSubject = subjects.find(s => s.code === subject);
      if (!selectedSubject) {
        throw new Error('Selected subject not found');
      }

      const response = await fetch(
        `http://localhost:5000/api/admin/attendance-report?` +
        new URLSearchParams({
          department: selectedSubject.department,
          academicYear: academicYear || "2023-2024", // Default academic year
          semester: selectedSubject.semester,
          subject: subject,
          fromDate: format(fromDate, 'yyyy-MM-dd'),
          toDate: format(toDate, 'yyyy-MM-dd')
        })
      );

      if (!response.ok) {
        throw new Error('Failed to fetch attendance report');
      }

      const data = await response.json();

      if (reportType === 'format1') {
        // Process data for format1 (summary view)
        const processedData = data.students.map((student: any) => ({
          ...student,
          attendance_percentage: ((student.classes_attended / student.total_classes) * 100).toFixed(1)
        }));
        setAttendanceData(processedData);
        setDates([]);
      } else {
        // Process data for format2 (date-wise view)
        setAttendanceData(data.students);
        setDates(data.dates || []);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
      setAttendanceData([]);
      setDates([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">View Reports</h1>
          <p className="text-muted-foreground">
            Generate and view attendance reports
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>
            Select the filters to generate the attendance report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <Tabs defaultValue="format1" value={reportType} onValueChange={setReportType}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="format1">Summary View</TabsTrigger>
                <TabsTrigger value="format2">Date-wise View</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <Label htmlFor="faculty">Faculty</Label>
              <Select value={faculty} onValueChange={setFaculty}>
                <SelectTrigger id="faculty">
                  <SelectValue placeholder="Select Faculty" />
                </SelectTrigger>
                <SelectContent>
                  {facultyList.map((f) => (
                    <SelectItem key={f.faculty_id} value={f.faculty_id}>
                      {f.name} - {f.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((sub) => (
                    <SelectItem key={sub.code} value={sub.code}>
                      {sub.name} - {sub.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fromDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={setFromDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !toDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={setToDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button onClick={handleGenerateReport} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Report...
                </>
              ) : (
                'Generate Report'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {attendanceData.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="format1" value={reportType}>
              <TabsContent value="format1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>USN</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Total Classes</TableHead>
                      <TableHead>Attended</TableHead>
                      <TableHead>Attendance %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.map((student) => (
                      <TableRow key={student.usn}>
                        <TableCell>{student.usn}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.totalClasses}</TableCell>
                        <TableCell>{student.classesAttended}</TableCell>
                        <TableCell className={cn(
                          "font-medium",
                          student.attendancePercentage >= 75 ? "text-green-600" :
                            student.attendancePercentage >= 60 ? "text-yellow-600" :
                              "text-red-600"
                        )}>
                          {student.attendancePercentage.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="format2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>USN</TableHead>
                      <TableHead>Student Name</TableHead>
                      {dates.map((date) => (
                        <TableHead key={`header-${date}`} className="text-center">
                          {format(new Date(date), 'MMM dd')}
                        </TableHead>
                      ))}
                      <TableHead>Total %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.map((student) => (
                      <TableRow key={student.usn}>
                        <TableCell>{student.usn}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        {dates.map((date) => (
                          <TableCell key={`${student.usn}-${date}`} className="text-center">
                            {student.attendance[date] ? 'P' : 'A'}
                          </TableCell>
                        ))}
                        <TableCell className={cn(
                          "font-medium",
                          student.attendancePercentage >= 75 ? "text-green-600" :
                            student.attendancePercentage >= 60 ? "text-yellow-600" :
                              "text-red-600"
                        )}>
                          {student.attendancePercentage.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ViewReports;
