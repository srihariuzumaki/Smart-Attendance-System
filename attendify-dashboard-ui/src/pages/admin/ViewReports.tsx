import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download, FileDown, Filter, FileSpreadsheet } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Subject {
  code: string;
  name: string;
  semester: string;
  scheme: string;
  branch: string;
}

const ViewReports = () => {
  const [reportType, setReportType] = useState("format1");
  const [department, setDepartment] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [group, setGroup] = useState<string>("cse_physics");
  const [scheme, setScheme] = useState<string>("2022");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();

  useEffect(() => {
    if (department && semester) {
      // Fetch subjects for the selected department, semester, and scheme
      const url = ['1', '2'].includes(semester)
        ? `http://localhost:5000/api/subjects/${department}?semester=${semester}&group=${group}&scheme=${scheme}`
        : `http://localhost:5000/api/subjects/${department}?semester=${semester}&scheme=${scheme}`;

      fetch(url)
        .then(res => res.json())
        .then(data => {
          setSubjects(data || []);
        })
        .catch(error => {
          console.error('Error fetching subjects:', error);
          setSubjects([]);
        });
    } else {
      setSubjects([]);
    }
  }, [department, semester, group, scheme]);

  const handleGenerateReport = () => {
    // In a real app, this would generate a report based on the selected filters
    console.log("Generate report with filters:", {
      reportType,
      department,
      academicYear,
      semester,
      subject,
      fromDate,
      toDate
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">View Reports</h1>
        <p className="text-muted-foreground">Generate and download attendance reports</p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select filters to generate attendance reports</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheme">Scheme</Label>
              <Select value={scheme} onValueChange={(value) => {
                setScheme(value);
                setSubject(""); // Reset selected subject when scheme changes
              }}>
                <SelectTrigger id="scheme">
                  <SelectValue placeholder="Select Scheme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2022">2022 Scheme</SelectItem>
                  <SelectItem value="2021">2021 Scheme</SelectItem>
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
                  <SelectItem value="it">Information Technology</SelectItem>
                  <SelectItem value="mech">Mechanical Engineering</SelectItem>
                  <SelectItem value="civil">Civil Engineering</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="academic-year">Academic Year</Label>
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger id="academic-year">
                  <SelectValue placeholder="Select Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023-2024">2023-2024</SelectItem>
                  <SelectItem value="2024-2025">2024-2025</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Select value={semester} onValueChange={(value) => {
                setSemester(value);
                // Reset group if semester is not 1 or 2
                if (!['1', '2'].includes(value)) {
                  setGroup('cse_physics');
                }
                setSubject(""); // Reset selected subject when semester changes
              }}>
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

            {['1', '2'].includes(semester) && (
              <div className="space-y-2">
                <Label htmlFor="group">Group</Label>
                <Select value={group} onValueChange={setGroup}>
                  <SelectTrigger id="group">
                    <SelectValue placeholder="Select Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cse_physics">CSE Physics Group</SelectItem>
                    <SelectItem value="cse_chemistry">CSE Chemistry Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subj) => (
                    <SelectItem key={subj.code} value={subj.code}>
                      {subj.name} ({subj.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="from-date">From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                    id="from-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-date">To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                    id="to-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                    initialFocus
                    disabled={(date) => fromDate ? date < fromDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <Button onClick={handleGenerateReport} className="gap-2">
              <Filter className="h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>Attendance Reports</CardTitle>
              <CardDescription>View and download attendance reports</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <FileDown className="h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline" className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="format1" onValueChange={setReportType} className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="format1">Report Format 1</TabsTrigger>
              <TabsTrigger value="format2">Report Format 2</TabsTrigger>
            </TabsList>

            <TabsContent value="format1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>USN</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Total Classes</TableHead>
                    <TableHead>Attended</TableHead>
                    <TableHead>Attendance %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>1CS20001</TableCell>
                    <TableCell>Abhishek Sharma</TableCell>
                    <TableCell>42</TableCell>
                    <TableCell>38</TableCell>
                    <TableCell className="font-medium">90.5%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>1CS20002</TableCell>
                    <TableCell>Priya Patel</TableCell>
                    <TableCell>42</TableCell>
                    <TableCell>35</TableCell>
                    <TableCell className="font-medium">83.3%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>1CS20003</TableCell>
                    <TableCell>Rahul Singh</TableCell>
                    <TableCell>42</TableCell>
                    <TableCell>30</TableCell>
                    <TableCell className="font-medium">71.4%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>1CS20004</TableCell>
                    <TableCell>Neha Gupta</TableCell>
                    <TableCell>42</TableCell>
                    <TableCell>40</TableCell>
                    <TableCell className="font-medium">95.2%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>1CS20005</TableCell>
                    <TableCell>Arjun Kumar</TableCell>
                    <TableCell>42</TableCell>
                    <TableCell>32</TableCell>
                    <TableCell className="font-medium">76.2%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="format2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>USN</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-center">Jan 15</TableHead>
                    <TableHead className="text-center">Jan 17</TableHead>
                    <TableHead className="text-center">Jan 19</TableHead>
                    <TableHead className="text-center">Jan 22</TableHead>
                    <TableHead className="text-center">Jan 24</TableHead>
                    <TableHead>Total %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>1CS20001</TableCell>
                    <TableCell>Abhishek Sharma</TableCell>
                    <TableCell className="text-center text-green-500">P</TableCell>
                    <TableCell className="text-center text-green-500">P</TableCell>
                    <TableCell className="text-center text-green-500">P</TableCell>
                    <TableCell className="text-center text-red-500">A</TableCell>
                    <TableCell className="text-center text-green-500">P</TableCell>
                    <TableCell className="font-medium">80%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>1CS20002</TableCell>
                    <TableCell>Priya Patel</TableCell>
                    <TableCell className="text-center text-green-500">P</TableCell>
                    <TableCell className="text-center text-green-500">P</TableCell>
                    <TableCell className="text-center text-red-500">A</TableCell>
                    <TableCell className="text-center text-green-500">P</TableCell>
                    <TableCell className="text-center text-green-500">P</TableCell>
                    <TableCell className="font-medium">80%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>1CS20003</TableCell>
                    <TableCell>Rahul Singh</TableCell>
                    <TableCell className="text-center text-red-500">A</TableCell>
                    <TableCell className="text-center text-green-500">P</TableCell>
                    <TableCell className="text-center text-red-500">A</TableCell>
                    <TableCell className="text-center text-green-500">P</TableCell>
                    <TableCell className="text-center text-green-500">P</TableCell>
                    <TableCell className="font-medium">60%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>1CS20004</TableCell>
                    <TableCell>Neha Gupta</TableCell>
                    <TableCell className="text-center text-green-500">P</TableCell>
                    <TableCell className="text-center text-green-500">P</TableCell>
                    <TableCell className="text-center text-green-500">P</TableCell>
                    <TableCell className="text-center text-green-500">P</TableCell>
                    <TableCell className="text-center text-green-500">P</TableCell>
                    <TableCell className="font-medium">100%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>1CS20005</TableCell>
                    <TableCell>Arjun Kumar</TableCell>
                    <TableCell className="text-center text-green-500">P</TableCell>
                    <TableCell className="text-center text-red-500">A</TableCell>
                    <TableCell className="text-center text-green-500">P</TableCell>
                    <TableCell className="text-center text-red-500">A</TableCell>
                    <TableCell className="text-center text-green-500">P</TableCell>
                    <TableCell className="font-medium">60%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-center border-t pt-4">
          <div className="flex gap-2">
            <Button variant="outline">Previous</Button>
            <Button variant="outline">1</Button>
            <Button variant="outline">2</Button>
            <Button variant="outline">3</Button>
            <Button variant="outline">Next</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ViewReports;
