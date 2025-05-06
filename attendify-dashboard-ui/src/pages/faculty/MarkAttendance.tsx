import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon, CheckCircle, AlertCircle, Check, RefreshCw, Loader2 } from "lucide-react";
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

interface Section {
  id: string;
  department: string;
  semester: string;
  section: string;
  subject_code: string;
  subject_name: string;
}

const MarkAttendance = () => {
  const { toast } = useToast();

  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const facultyId = localStorage.getItem("facultyId");
        if (!facultyId) {
          toast({
            title: "Error",
            description: "Faculty ID not found. Please login again.",
            variant: "destructive",
          });
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
      }
    };

    fetchSections();
  }, []);

  const handleFetchStudents = async () => {
    if (!selectedSection) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please select a section.",
      });
      return;
    }

    setIsLoadingStudents(true);

    try {
      const section = sections.find(s => s.id === selectedSection);
      if (!section) {
        throw new Error("Selected section not found");
      }

      // Get academic year from section mapping
      const response = await fetch(`http://localhost:5000/api/section-mapping?department=${section.department}&semester=${section.semester}`);
      const mappingData = await response.json();

      if (!response.ok) {
        throw new Error('Failed to fetch section mapping');
      }

      const sectionMapping = mappingData.section_mappings.find(
        (mapping: any) => mapping.section === section.section && mapping.subject_code === section.subject_code
      );

      if (!sectionMapping) {
        throw new Error('Section mapping not found');
      }

      // Fetch students with the academic year from section mapping
      const studentsResponse = await fetch(
        `http://localhost:5000/api/students?department=${section.department}&semester=${section.semester}&academicYear=${sectionMapping.academic_year}`
      );
      const data = await studentsResponse.json();

      if (!studentsResponse.ok) {
        if (studentsResponse.status === 404) {
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
        description: `Loaded ${studentsWithAttendance.length} students for ${section.subject_name} - ${section.section}`,
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

    const section = sections.find(s => s.id === selectedSection);
    if (!section) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selected section not found",
      });
      return;
    }

    setLoading(true);

    try {
      const attendanceData = {
        department: section.department,
        semester: section.semester,
        subject: section.subject_code,
        section: section.section,
        date: format(date!, 'yyyy-MM-dd'),
        records: students.map(student => ({
          USN: student.USN,
          present: student.present,
          AcademicYear: student.AcademicYear
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit attendance');
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
        description: error instanceof Error ? error.message : "Failed to submit attendance. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllPresent = () => {
    setStudents(
      students.map(student => ({ ...student, present: true }))
    );
  };

  const handleCheckboxChange = (usn: string) => {
    setStudents(
      students.map(student =>
        student.USN === usn ? { ...student, present: !student.present } : student
      )
    );
  };

  const resetForm = () => {
    setSubmitted(false);
    setStudents([]);
    setSelectedSection("");
    setDate(new Date());
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection} disabled={submitted}>
                <SelectTrigger id="section">
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.subject_name} - {section.department} {section.semester} {section.section}
                    </SelectItem>
                  ))}
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
                    disabled={submitted}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <Button
                onClick={handleFetchStudents}
                disabled={!selectedSection || !date || submitted}
              >
                {isLoadingStudents ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load Students'
                )}
              </Button>

              {students.length > 0 && !submitted && (
                <Button variant="outline" onClick={handleMarkAllPresent}>
                  Mark All Present
                </Button>
              )}
            </div>

            {students.length > 0 && (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>USN</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Present</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.USN}>
                          <TableCell>{student.USN}</TableCell>
                          <TableCell>{student.Name}</TableCell>
                          <TableCell className="text-right">
                            <Checkbox
                              checked={student.present}
                              onCheckedChange={() => handleCheckboxChange(student.USN)}
                              disabled={submitted}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    disabled={!submitted}
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || submitted}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Attendance'
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarkAttendance;
