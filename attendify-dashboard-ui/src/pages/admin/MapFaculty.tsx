import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, Plus, Lock, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Faculty {
  faculty_id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  joining_date: string;
}

const AddFacultyDialog = ({ department, onFacultyAdded }: { department: string, onFacultyAdded: () => void }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [facultyId, setFacultyId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [open, setOpen] = useState(false);

  const resetForm = () => {
    setFacultyId("");
    setName("");
    setEmail("");
    setDesignation("");
    setJoiningDate("");
    setPassword("");
  };

  const handleSubmit = async () => {
    if (!facultyId || !name || !email || !designation || !joiningDate || !password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/faculty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          faculty_id: facultyId,
          name,
          email,
          department,
          designation,
          joining_date: joiningDate,
          password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add faculty');
      }

      toast({
        title: "Success",
        description: "Faculty added successfully",
        action: (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ),
      });

      resetForm();
      setOpen(false);
      onFacultyAdded();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add faculty",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Plus className="h-4 w-4 mr-1" />
          Add New Faculty
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Faculty</DialogTitle>
          <DialogDescription>Enter the details of the new faculty member</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="faculty-id">Faculty ID</Label>
            <Input
              id="faculty-id"
              placeholder="Enter faculty ID"
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter faculty name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="designation">Designation</Label>
            <Select value={designation} onValueChange={setDesignation}>
              <SelectTrigger id="designation">
                <SelectValue placeholder="Select Designation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Professor">Professor</SelectItem>
                <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                <SelectItem value="Lecturer">Lecturer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="joining-date">Joining Date</Label>
            <Input
              id="joining-date"
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 
                  <EyeOff className="h-4 w-4 text-muted-foreground" /> :
                  <Eye className="h-4 w-4 text-muted-foreground" />
                }
                <span className="sr-only">
                  {showPassword ? "Hide password" : "Show password"}
                </span>
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Faculty...
              </>
            ) : (
              "Add Faculty"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

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
          setFacultyList(data.faculty || []);
        })
        .catch(error => {
          console.error('Error fetching faculty:', error);
          toast({
            title: "Error",
            description: "Failed to fetch faculty list",
            variant: "destructive",
          });
          setFacultyList([]);
        });

      // Fetch subjects for the selected department
      fetch(`http://localhost:5000/api/subjects/${department}`)
        .then(res => res.json())
        .then(data => {
          setSubjects(data || []);
        })
        .catch(error => {
          console.error('Error fetching subjects:', error);
          toast({
            title: "Error",
            description: "Failed to fetch subjects",
            variant: "destructive",
          });
          setSubjects([]);
        });
    } else {
      setFacultyList([]);
      setSubjects([]);
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
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select value={facultyId} onValueChange={setFacultyId}>
                  <SelectTrigger id="faculty">
                    <SelectValue placeholder="Select Faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {facultyList?.map((faculty) => (
                      <SelectItem key={faculty.faculty_id} value={faculty.faculty_id}>
                        {faculty.name} - {faculty.designation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {department && <AddFacultyDialog department={department} onFacultyAdded={() => {
                // Fetch faculty list for the selected department
                fetch(`http://localhost:5000/api/faculty?department=${department}`)
                  .then(res => res.json())
                  .then(data => {
                    setFacultyList(data.faculty || []);
                  })
                  .catch(error => {
                    console.error('Error fetching faculty:', error);
                    toast({
                      title: "Error",
                      description: "Failed to fetch faculty list",
                      variant: "destructive",
                    });
                  });
              }} />}
            </div>
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

export { AddFacultyDialog };
