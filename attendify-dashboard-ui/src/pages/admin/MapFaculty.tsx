import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2 } from "lucide-react";

interface Faculty {
  faculty_id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
}

const MapFaculty = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [academicYear, setAcademicYear] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);

  useEffect(() => {
    if (department) {
      // Fetch faculty list for the selected department
      fetch(`http://localhost:5000/api/faculty?department=${department}`)
        .then(res => res.json())
        .then(data => {
          setFacultyList(data.faculty);
        })
        .catch(error => {
          console.error('Error fetching faculty:', error);
          toast({
            title: "Error",
            description: "Failed to fetch faculty list",
            variant: "destructive",
          });
        });

      // Fetch subjects for the selected department
      fetch(`http://localhost:5000/api/subjects/${department}`)
        .then(res => res.json())
        .then(data => {
          setSubjects(data);
        })
        .catch(error => {
          console.error('Error fetching subjects:', error);
          toast({
            title: "Error",
            description: "Failed to fetch subjects",
            variant: "destructive",
          });
        });
    }
  }, [department]);

  const handleMapFaculty = async () => {
    if (!facultyId || !department || !semester || !section || !subject || !academicYear) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/section-mapping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          faculty_id: facultyId,
          department,
          semester,
          section,
          subject,
          academic_year: academicYear,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to map faculty');
      }

      const selectedFaculty = facultyList.find(f => f.faculty_id === facultyId);
      toast({
        title: "Success",
        description: `${selectedFaculty?.name} has been assigned to ${subject} - Section ${section}`,
        action: (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ),
      });

      // Reset form
      setFacultyId("");
      setSubject("");
      setSection("");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to map faculty",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Map Faculty</h1>
        <p className="text-muted-foreground">Assign faculty members to specific courses and sections</p>
      </div>
      
      <Card className="max-w-3xl mx-auto shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle>Faculty Assignment</CardTitle>
          <CardDescription>Map faculty to departments, courses, and sections</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="academic-year">Academic Year</Label>
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger id="academic-year">
                  <SelectValue placeholder="Select Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023-2024">2023-2024</SelectItem>
                  <SelectItem value="2024-2025">2024-2025</SelectItem>
                  <SelectItem value="2025-2026">2025-2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cse">Computer Science & Engineering</SelectItem>
                  <SelectItem value="ece">Electronics & Communication</SelectItem>
                  <SelectItem value="ise">Information Technology</SelectItem>
                  <SelectItem value="mech">Mechanical Engineering</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger id="semester">
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Semester</SelectItem>
                  <SelectItem value="2">2nd Semester</SelectItem>
                  <SelectItem value="3">3rd Semester</SelectItem>
                  <SelectItem value="4">4th Semester</SelectItem>
                  <SelectItem value="5">5th Semester</SelectItem>
                  <SelectItem value="6">6th Semester</SelectItem>
                  <SelectItem value="7">7th Semester</SelectItem>
                  <SelectItem value="8">8th Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select value={section} onValueChange={setSection}>
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
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger id="subject">
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subj) => (
                  <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="faculty">Faculty</Label>
            <Select value={facultyId} onValueChange={setFacultyId}>
              <SelectTrigger id="faculty">
                <SelectValue placeholder="Select Faculty" />
              </SelectTrigger>
              <SelectContent>
                {facultyList.map((faculty) => (
                  <SelectItem key={faculty.faculty_id} value={faculty.faculty_id}>
                    {faculty.name} - {faculty.designation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={handleMapFaculty} 
            disabled={loading}
            className="w-full transition-all duration-300 hover:scale-[1.02]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mapping Faculty...
              </>
            ) : (
              "Map Faculty to Section"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MapFaculty;
