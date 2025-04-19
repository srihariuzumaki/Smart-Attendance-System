import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Subject {
  subject_id: string;
  name: string;
  course_code: string;
  semester: number;
  department: string;
  section: string;
}

const MySubjects = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const fetchMySubjects = async () => {
    try {
      // Get faculty ID from local storage
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

      const response = await fetch(`http://localhost:5000/api/faculty/${facultyId}/subjects`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch subjects");
      }
      const data = await response.json();
      setSubjects(data.subjects || []);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch subjects",
        variant: "destructive",
      });
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySubjects();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Subjects</CardTitle>
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
                <TableHead>Course Code</TableHead>
                <TableHead>Subject Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Semester</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.subject_id}>
                  <TableCell>{subject.course_code}</TableCell>
                  <TableCell>{subject.name}</TableCell>
                  <TableCell className="capitalize">{subject.department}</TableCell>
                  <TableCell>{subject.section}</TableCell>
                  <TableCell>{subject.semester}</TableCell>
                </TableRow>
              ))}
              {subjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No subjects assigned yet. Please contact the administrator to assign subjects.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default MySubjects; 