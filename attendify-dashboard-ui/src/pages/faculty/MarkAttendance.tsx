import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon, CheckCircle, AlertCircle, Check, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import AttendanceReport from "@/components/faculty/AttendanceReport";

interface Student {
  USN: string;
  Name: string;
  Semester: string;
  Department: string;
  AcademicYear: string;
  present: boolean;
}

const MarkAttendance = () => {
  const { toast } = useToast();
  
  const [department, setDepartment] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [availableAcademicYears, setAvailableAcademicYears] = useState<string[]>([]);
  const [availableSemesters, setAvailableSemesters] = useState<string[]>([]);
  
  const handleCheckboxChange = (usn: string) => {
    setStudents(
      students.map(student => 
        student.USN === usn ? { ...student, present: !student.present } : student
      )
    );
  };
  
  const handleMarkAllPresent = () => {
    setStudents(
      students.map(student => ({ ...student, present: true }))
    );
  };
  
  const handleFetchStudents = async () => {
    if (!department || !academicYear || !semester || !section || !subject) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all the required fields.",
      });
      return;
    }
    
    setIsLoadingStudents(true);
    
    try {
      // Fetch students from the backend
      const response = await fetch(`http://localhost:5000/api/students?department=${department}&academicYear=${academicYear}&semester=${semester}`);
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            variant: "destructive",
            title: "No Students Found",
            description: data.message || "No students found for the selected criteria.",
          });
          setStudents([]);
          return;
        }
        throw new Error('Failed to fetch students');
      }
      
      const studentsWithAttendance = data.students.map((student: Student) => ({
        ...student,
        present: false // Initialize all students as absent
      }));
      
      setStudents(studentsWithAttendance);
      
      toast({
        title: "Student data loaded",
        description: `Loaded ${studentsWithAttendance.length} students for ${subject} - ${section}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch students. Please try again.",
      });
      setStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  };
  
  const handleSubmit = async () => {
    if (students.length === 0) {
      toast({
        variant: "destructive",
        title: "No students found",
        description: "Please load student data first.",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const attendanceData = {
        department,
        semester,
        subject,
        date: format(date!, 'yyyy-MM-dd'),
        records: students.map(student => ({
          ...student,
          Date: format(date!, 'yyyy-MM-dd'),
          Subject: subject,
        }))
      };
      
      const response = await fetch('http://localhost:5000/api/mark-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit attendance');
      }
      
      setSubmitted(true);
      const presentCount = students.filter(s => s.present).length;
      
      toast({
        title: "Attendance submitted successfully!",
        description: `Marked ${presentCount} students present out of ${students.length}`,
        action: (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit attendance. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setSubmitted(false);
    setStudents([]);
    setDepartment("");
    setAcademicYear("");
    setSemester("");
    setSection("");
    setSubject("");
    setDate(new Date());
  };

  // Fetch available academic years and semesters when department changes
  const handleDepartmentChange = async (value: string) => {
    setDepartment(value);
    try {
      const response = await fetch(`http://localhost:5000/api/students/metadata?department=${value}`);
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            variant: "destructive",
            title: "No Data Found",
            description: data.message || "Please upload student data first.",
          });
          setAvailableAcademicYears([]);
          setAvailableSemesters([]);
          return;
        }
        throw new Error('Failed to fetch metadata');
      }
      
      setAvailableAcademicYears(data.academicYears);
      setAvailableSemesters(data.semesters);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch class information.",
      });
      setAvailableAcademicYears([]);
      setAvailableSemesters([]);
    }
  };

  // Add totalClasses state
  const [totalClasses, setTotalClasses] = useState(42); // This would come from your backend in a real app

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mark Attendance</h1>
        <p className="text-muted-foreground">Record student attendance for your classes</p>
      </div>
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Class Selection</CardTitle>
          <CardDescription>Select the class details to mark attendance</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={department} onValueChange={handleDepartmentChange} disabled={submitted}>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cse">Computer Science & Engineering</SelectItem>
                  <SelectItem value="ece">Electronics & Communication</SelectItem>
                  <SelectItem value="ise">Information Science</SelectItem>
                  <SelectItem value="mech">Mechanical Engineering</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="academic-year">Academic Year</Label>
              <Select value={academicYear} onValueChange={setAcademicYear} disabled={submitted || !department}>
                <SelectTrigger id="academic-year">
                  <SelectValue placeholder="Select Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  {availableAcademicYears.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Select value={semester} onValueChange={setSemester} disabled={submitted || !department}>
                <SelectTrigger id="semester">
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  {availableSemesters.map((sem) => (
                    <SelectItem key={sem} value={sem}>{sem} Semester</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select value={section} onValueChange={setSection} disabled={submitted}>
                <SelectTrigger id="section">
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Section A</SelectItem>
                  <SelectItem value="B">Section B</SelectItem>
                  <SelectItem value="C">Section C</SelectItem>
                  <SelectItem value="D">Section D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={subject} onValueChange={setSubject} disabled={submitted}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dsa">Data Structures & Algorithms</SelectItem>
                  <SelectItem value="dbms">Database Management Systems</SelectItem>
                  <SelectItem value="os">Operating Systems</SelectItem>
                  <SelectItem value="cn">Computer Networks</SelectItem>
                  <SelectItem value="se">Software Engineering</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                    disabled={submitted}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="mt-4 flex justify-center">
            <Button 
              onClick={handleFetchStudents}
              disabled={isLoadingStudents || submitted}
            >
              {isLoadingStudents ? "Loading Students..." : "Load Student List"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {students.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <CardTitle>Student Attendance</CardTitle>
                <CardDescription>
                  {subject && section 
                    ? `${subject} - Section ${section} (${date ? format(date, "PPP") : "Today"})`
                    : "Mark attendance for the selected class"
                  }
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={handleMarkAllPresent}
                disabled={submitted}
                className="self-start md:self-center"
              >
                Mark All Present
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {submitted ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center text-center p-6">
                  <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3 mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-medium mb-1">Attendance Submitted Successfully!</h3>
                  <p className="text-muted-foreground mb-4">
                    Attendance for {subject} ({section}) on {date ? format(date, "PPP") : "today"} has been recorded.
                  </p>
                  <Button onClick={resetForm} className="gap-2">
                    <RefreshCw className="h-4 w-4" /> Mark Another Class
                  </Button>
                </div>

                <AttendanceReport
                  students={students}
                  subject={subject}
                  section={section}
                  department={department}
                  semester={semester}
                  academicYear={academicYear}
                  date={date!}
                />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>USN</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.USN}>
                        <TableCell>
                          <Checkbox
                            checked={student.present}
                            onCheckedChange={() => handleCheckboxChange(student.USN)}
                            disabled={submitted}
                          />
                        </TableCell>
                        <TableCell>{student.USN}</TableCell>
                        <TableCell>{student.Name}</TableCell>
                        <TableCell>{student.Semester}</TableCell>
                        <TableCell>
                          {student.present ? (
                            <span className="inline-flex items-center text-green-600">
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Present
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-red-600">
                              <AlertCircle className="mr-1 h-4 w-4" />
                              Absent
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          
          {!submitted && (
            <CardFooter className="flex justify-center border-t pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={loading} className="min-w-[200px]">
                    {loading ? "Submitting..." : "Submit Attendance"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Attendance Submission</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will record attendance for {students.filter(s => s.present).length} out of {students.length} students.
                      Are you sure you want to submit? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSubmit}>Submit</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
};

export default MarkAttendance;
