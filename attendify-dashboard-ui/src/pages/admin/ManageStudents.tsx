import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Upload, Download, FileSpreadsheet } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface Student {
  USN: string;
  Name: string;
  Department: string;
  Semester: string;
  AcademicYear: string;
}

interface SectionMapping {
  id: number;
  faculty_id: string;
  faculty_name: string;
  department: string;
  semester: string;
  section: string;
  subject: string;
  academic_year: string;
}

const ManageStudents = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewData, setPreviewData] = useState<Student[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [sectionMappings, setSectionMappings] = useState<SectionMapping[]>([]);
  const [selectedMapping, setSelectedMapping] = useState<string>("");

  // Fetch section mappings
  useEffect(() => {
    const fetchSectionMappings = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/section-mapping');
        if (!response.ok) throw new Error('Failed to fetch section mappings');
        const data = await response.json();
        setSectionMappings(data.section_mappings || []);
      } catch (error) {
        console.error('Error fetching section mappings:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch section mappings",
        });
      }
    };

    fetchSectionMappings();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files?.[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Check file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (!validTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an Excel (.xlsx, .xls) or CSV file",
      });
      return;
    }

    if (!selectedMapping) {
      toast({
        variant: "destructive",
        title: "Section Required",
        description: "Please select a section before uploading students",
      });
      return;
    }

    setSelectedFile(file);
    setPreviewData([]); // Clear previous preview
    setValidationErrors([]); // Clear previous errors
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('section_mapping_id', selectedMapping);

      const response = await fetch('http://localhost:5000/api/upload-students/preview', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Validation failed:', data);
        if (data.errors && Array.isArray(data.errors)) {
          setValidationErrors(data.errors);
          toast({
            variant: "destructive",
            title: "Validation Failed",
            description: "Please check the validation errors below",
          });
        } else {
          throw new Error(data.error || 'Failed to preview file');
        }
        return;
      }

      setPreviewData(data.students || []);
      setValidationErrors([]);
    } catch (error) {
      console.error('Error during file upload:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to preview file",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedMapping) return;

    setLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('section_mapping_id', selectedMapping);

      const response = await fetch('http://localhost:5000/api/upload-students', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          setValidationErrors(data.errors);
          throw new Error("Please check the validation errors below");
        } else {
          throw new Error(data.error || 'Failed to upload students');
        }
      }

      toast({
        title: "Upload Successful",
        description: `Successfully uploaded ${data.count} students`,
      });

      // Reset states
      setSelectedFile(null);
      setPreviewData([]);
      setValidationErrors([]);
      setUploadProgress(100);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload students",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Create template CSV content with example data
    const headers = ["USN", "Name", "Department", "Semester", "AcademicYear"];
    const exampleRow = ["1XY21CS001", "John Doe", "CSE", "6", "2023-24"];
    const csvContent = "data:text/csv;charset=utf-8," +
      headers.join(",") + "\n" +
      exampleRow.join(",");

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_upload_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manage Students</h1>
        <p className="text-muted-foreground">Upload and manage student records</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Students</CardTitle>
          <CardDescription>
            Upload student records using Excel or CSV file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Section Selection */}
            <div className="space-y-2">
              <Label>Select Section</Label>
              <Select value={selectedMapping} onValueChange={setSelectedMapping}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a section" />
                </SelectTrigger>
                <SelectContent>
                  {sectionMappings.map((mapping) => (
                    <SelectItem key={mapping.id} value={mapping.id.toString()}>
                      {`${mapping.department} - Sem ${mapping.semester} - Sec ${mapping.section} (${mapping.faculty_name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template Download */}
            <div>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertTitle>Validation Errors</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4 mt-2">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${dragActive ? "border-primary" : "border-muted-foreground/25"
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Drag and drop or click to upload
                </span>
                <span className="text-xs text-muted-foreground">
                  Supports CSV, Excel (.xlsx, .xls)
                </span>
              </label>
            </div>

            {/* Preview Table */}
            {previewData.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Preview</h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>USN</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Academic Year</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((student, index) => (
                        <TableRow key={index}>
                          <TableCell>{student.USN}</TableCell>
                          <TableCell>{student.Name}</TableCell>
                          <TableCell>{student.Department}</TableCell>
                          <TableCell>{student.Semester}</TableCell>
                          <TableCell>{student.AcademicYear}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Students
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageStudents; 