import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface PreviewData {
  USN: string;
  Name: string;
  Department: string;
  Semester: string;
  Section: string;
  AcademicYear: string;
}

const UploadStudents = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);
  const [loading, setLoading] = useState(false);
  const [sectionMappingId, setSectionMappingId] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      handlePreview(selectedFile);
    }
  };

  const handlePreview = async (selectedFile: File) => {
    if (!sectionMappingId) {
      toast({
        title: "Error",
        description: "Please enter a section mapping ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("section_mapping_id", sectionMappingId);

    try {
      const response = await fetch("http://localhost:5000/api/upload-students/preview", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to preview students");
      }

      // Handle successful preview
      if (data.students && Array.isArray(data.students)) {
        setPreviewData(data.students);
        toast({
          title: "Success",
          description: `Preview loaded with ${data.students.length} students`,
        });
      } else {
        setPreviewData([]);
        toast({
          title: "Warning",
          description: "No students found in the file",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to preview students",
        variant: "destructive",
      });
      setPreviewData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !sectionMappingId) {
      toast({
        title: "Error",
        description: "Please select a file and enter section mapping ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("section_mapping_id", sectionMappingId);

    try {
      const response = await fetch("http://localhost:5000/api/upload-students", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload students");
      }

      // Clear the form and preview on successful upload
      setFile(null);
      setPreviewData([]);
      setSectionMappingId("");
      
      // Reset the file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }

      toast({
        title: "Success",
        description: data.message || "Students uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Students</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid w-full gap-4">
          <div>
            <Label htmlFor="section-mapping">Section Mapping ID</Label>
            <Input
              id="section-mapping"
              value={sectionMappingId}
              onChange={(e) => setSectionMappingId(e.target.value)}
              placeholder="Enter section mapping ID"
            />
          </div>
          <div>
            <Label htmlFor="file">Student List (CSV/Excel)</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : previewData.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>USN</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Academic Year</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((student, index) => (
                    <TableRow key={student.USN || index}>
                      <TableCell>{student.USN}</TableCell>
                      <TableCell>{student.Name}</TableCell>
                      <TableCell>{student.Department}</TableCell>
                      <TableCell>{student.Semester}</TableCell>
                      <TableCell>{student.Section}</TableCell>
                      <TableCell>{student.AcademicYear}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
          <Button onClick={handleUpload} disabled={!file || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Students"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UploadStudents; 