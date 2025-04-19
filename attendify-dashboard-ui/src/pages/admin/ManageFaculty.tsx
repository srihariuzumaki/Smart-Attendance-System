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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, ChevronDown } from "lucide-react";

interface Faculty {
  faculty_id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  joining_date: string;
}

interface SectionMapping {
  id: number;
  subject: string;
  section: string;
  semester: string;
  department: string;
  academic_year: string;
}

interface FacultyWithSections extends Faculty {
  sections: SectionMapping[];
}

const ManageFaculty = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [faculties, setFaculties] = useState<FacultyWithSections[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("cse");
  const [expandedFaculty, setExpandedFaculty] = useState<string | null>(null);

  const fetchFaculties = async () => {
    try {
      // Fetch faculty list
      const facultyResponse = await fetch("http://localhost:5000/api/faculty");
      if (!facultyResponse.ok) {
        throw new Error("Failed to fetch faculties");
      }
      const facultyData = await facultyResponse.json();
      
      // Fetch section mappings for each faculty
      const facultiesWithSections = await Promise.all(
        (facultyData.faculty || []).map(async (faculty: Faculty) => {
          const mappingResponse = await fetch(`http://localhost:5000/api/section-mapping?faculty_id=${faculty.faculty_id}`);
          if (!mappingResponse.ok) {
            return { ...faculty, sections: [] };
          }
          const mappingData = await mappingResponse.json();
          return {
            ...faculty,
            sections: mappingData.section_mappings || []
          };
        })
      );

      setFaculties(facultiesWithSections);
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

  const toggleExpand = (facultyId: string) => {
    setExpandedFaculty(expandedFaculty === facultyId ? null : facultyId);
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
                <TableHead className="w-8"></TableHead>
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
                <>
                  <TableRow key={faculty.faculty_id}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleExpand(faculty.faculty_id)}
                      >
                        {expandedFaculty === faculty.faculty_id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
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
                  {expandedFaculty === faculty.faculty_id && (
                    <TableRow>
                      <TableCell colSpan={8} className="bg-muted/50">
                        <div className="p-4">
                          <h4 className="font-semibold mb-2">Section Assignments</h4>
                          {faculty.sections.length > 0 ? (
                            <div className="grid gap-2">
                              {faculty.sections.map((section) => (
                                <div
                                  key={section.id}
                                  className="bg-background p-3 rounded-lg border"
                                >
                                  <div className="grid grid-cols-4 gap-4">
                                    <div>
                                      <span className="text-sm font-medium">Subject:</span>
                                      <p className="text-sm">{section.subject}</p>
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium">Section:</span>
                                      <p className="text-sm">{section.section}</p>
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium">Semester:</span>
                                      <p className="text-sm">{section.semester}</p>
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium">Academic Year:</span>
                                      <p className="text-sm">{section.academic_year}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No sections assigned yet.
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ManageFaculty; 