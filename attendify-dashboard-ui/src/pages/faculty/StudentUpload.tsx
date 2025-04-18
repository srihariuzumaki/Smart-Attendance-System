import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

interface Student {
  Semester: string;
  Name: string;
  AcademicYear: string;
  Department: string;
  USN: string;
}

const StudentUpload = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/upload-students', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload file');
      }

      const data = await response.json();
      setStudents(data.students);
      setAcademicYears(data.academicYears);
      setSemesters(data.semesters);
      toast.success('Student data uploaded successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload student data');
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Student Data</CardTitle>
          <CardDescription>
            Upload a CSV or Excel file containing student information. The file should include columns for
            Semester, Name, Academic Year, Department, and USN.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload onFileUpload={handleFileUpload} />
        </CardContent>
      </Card>

      {students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Students</CardTitle>
            <CardDescription>
              {students.length} students from {semesters.join(', ')} semester(s),
              Academic Year(s): {academicYears.join(', ')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>USN</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Academic Year</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, index) => (
                    <TableRow key={student.USN || index}>
                      <TableCell>{student.USN}</TableCell>
                      <TableCell>{student.Name}</TableCell>
                      <TableCell>{student.Semester}</TableCell>
                      <TableCell>{student.Department}</TableCell>
                      <TableCell>{student.AcademicYear}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentUpload; 