import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface Faculty {
  faculty_id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  joining_date: string;
}

const ManageFaculty = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  
  // Form states
  const [facultyId, setFacultyId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [joiningDate, setJoiningDate] = useState("");

  useEffect(() => {
    fetchFacultyList();
  }, []);

  const fetchFacultyList = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/faculty');
      if (!response.ok) throw new Error('Failed to fetch faculty list');
      const data = await response.json();
      setFacultyList(data.faculty);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch faculty list",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFacultyId("");
    setName("");
    setEmail("");
    setDepartment("");
    setDesignation("");
    setJoiningDate("");
    setEditingFaculty(null);
  };

  const handleSubmit = async () => {
    if (!facultyId || !name || !email || !department || !designation || !joiningDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const url = editingFaculty 
        ? `http://localhost:5000/api/faculty/${editingFaculty.faculty_id}`
        : 'http://localhost:5000/api/faculty';
      
      const method = editingFaculty ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
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
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save faculty');
      }

      toast({
        title: "Success",
        description: `Faculty ${editingFaculty ? 'updated' : 'added'} successfully`,
        action: (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ),
      });

      resetForm();
      fetchFacultyList();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save faculty",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (faculty: Faculty) => {
    setEditingFaculty(faculty);
    setFacultyId(faculty.faculty_id);
    setName(faculty.name);
    setEmail(faculty.email);
    setDepartment(faculty.department);
    setDesignation(faculty.designation);
    setJoiningDate(faculty.joining_date);
  };

  const handleDelete = async (facultyId: string) => {
    if (!confirm('Are you sure you want to delete this faculty member?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/faculty/${facultyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete faculty');
      }

      toast({
        title: "Success",
        description: "Faculty deleted successfully",
        action: (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ),
      });

      fetchFacultyList();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete faculty",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manage Faculty</h1>
        <p className="text-muted-foreground">Add, edit, or remove faculty members</p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>{editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}</CardTitle>
          <CardDescription>Enter faculty details below</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="faculty-id">Faculty ID</Label>
              <Input
                id="faculty-id"
                placeholder="Enter faculty ID"
                value={facultyId}
                onChange={(e) => setFacultyId(e.target.value)}
                disabled={!!editingFaculty}
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
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editingFaculty ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              editingFaculty ? 'Update Faculty' : 'Add Faculty'
            )}
          </Button>
          {editingFaculty && (
            <Button
              variant="outline"
              onClick={resetForm}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Faculty List</CardTitle>
          <CardDescription>View and manage all faculty members</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faculty ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Joining Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facultyList.map((faculty) => (
                  <TableRow key={faculty.faculty_id}>
                    <TableCell>{faculty.faculty_id}</TableCell>
                    <TableCell>{faculty.name}</TableCell>
                    <TableCell>{faculty.email}</TableCell>
                    <TableCell className="uppercase">{faculty.department}</TableCell>
                    <TableCell>{faculty.designation}</TableCell>
                    <TableCell>{format(new Date(faculty.joining_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(faculty)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(faculty.faculty_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {facultyList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                      No faculty members found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageFaculty; 