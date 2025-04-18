import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Pencil, Trash2, UserPlus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddFacultyDialog } from "./MapFaculty";

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
  const [loading, setLoading] = useState(true);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("cse");

  const fetchFaculties = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/faculty");
      if (!response.ok) {
        throw new Error("Failed to fetch faculties");
      }
      const data = await response.json();
      setFaculties(data.faculty || []);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch faculties",
        variant: "destructive",
      });
      setFaculties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculties();
  }, []);

  const handleDeleteFaculty = async (facultyId: string) => {
    if (!confirm("Are you sure you want to delete this faculty member?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/faculty/${facultyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete faculty");
      }

      toast({
        title: "Success",
        description: "Faculty deleted successfully",
      });

      fetchFaculties();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete faculty",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Faculty</CardTitle>
        <AddFacultyDialog department={selectedDepartment} onFacultyAdded={fetchFaculties} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
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
              {faculties.map((faculty) => (
                <TableRow key={faculty.faculty_id}>
                  <TableCell>{faculty.faculty_id}</TableCell>
                  <TableCell>{faculty.name}</TableCell>
                  <TableCell>{faculty.email}</TableCell>
                  <TableCell className="capitalize">{faculty.department}</TableCell>
                  <TableCell>{faculty.designation}</TableCell>
                  <TableCell>{new Date(faculty.joining_date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteFaculty(faculty.faculty_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ManageFaculty; 