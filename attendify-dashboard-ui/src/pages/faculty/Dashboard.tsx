import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, BookOpen, BarChart, CheckCircle2, Upload } from "lucide-react";
import {
  BarChart as RechartBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";

const subjectAttendanceData = [
  { subject: "Data Structures", attendance: 87 },
  { subject: "Database Systems", attendance: 75 },
  { subject: "Computer Networks", attendance: 82 },
  { subject: "Operating Systems", attendance: 68 },
];

const classData = [
  { name: "CSE-3A", present: 42, absent: 8 },
  { name: "CSE-4B", present: 38, absent: 12 },
  { name: "IT-3A", present: 45, absent: 5 },
];

const FacultyDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, Dr. Sharma</h1>
          <p className="text-muted-foreground">Faculty Dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground">Today is {new Date().toLocaleDateString()}</p>
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            View Schedule
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="interactive-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">My Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Current semester subjects</p>
          </CardContent>
        </Card>
        <Card className="interactive-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Classes Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Upcoming: CSE-3A at 11:00 AM</p>
          </CardContent>
        </Card>
        <Card className="interactive-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Attendance Marked</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">22/30</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card className="interactive-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78.6%</div>
            <p className="text-xs text-muted-foreground">Across all subjects</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="interactive-card">
          <CardHeader>
            <CardTitle>Today's Classes</CardTitle>
            <CardDescription>Upcoming classes for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Database Management Systems</h3>
                  <p className="text-sm text-muted-foreground">CSE-3A (Room 305)</p>
                </div>
                <div className="bg-secondary text-secondary-foreground rounded-md px-2 py-1 text-sm">
                  11:00 AM - 12:00 PM
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Data Structures</h3>
                  <p className="text-sm text-muted-foreground">IT-2B (Room 205)</p>
                </div>
                <div className="bg-secondary text-secondary-foreground rounded-md px-2 py-1 text-sm">
                  1:30 PM - 2:30 PM
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Computer Networks</h3>
                  <p className="text-sm text-muted-foreground">CSE-4B (Room 402)</p>
                </div>
                <div className="bg-secondary text-secondary-foreground rounded-md px-2 py-1 text-sm">
                  3:00 PM - 4:00 PM
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="interactive-card">
          <CardHeader>
            <CardTitle>Subject Attendance</CardTitle>
            <CardDescription>Average attendance by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RechartBarChart data={subjectAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="attendance" fill="hsl(var(--primary))" name="Attendance %" />
              </RechartBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="interactive-card">
          <CardHeader>
            <CardTitle>Recent Classes</CardTitle>
            <CardDescription>Attendance statistics for recent classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {classData.map((cls, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{cls.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {cls.present} present / {cls.absent} absent
                    </span>
                  </div>
                  <Progress value={(cls.present / (cls.present + cls.absent)) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="interactive-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-1"
                onClick={() => navigate("/faculty/mark-attendance")}
              >
                <Calendar className="h-5 w-5" />
                <span>Mark Attendance</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-1"
                onClick={() => navigate("/faculty/reports")}
              >
                <BarChart className="h-5 w-5" />
                <span>View Reports</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-1"
                onClick={() => navigate("/faculty/student-upload")}
              >
                <Upload className="h-5 w-5" />
                <span>Upload Students</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-1"
                onClick={() => navigate("/faculty/subjects")}
              >
                <BookOpen className="h-5 w-5" />
                <span>My Subjects</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FacultyDashboard;
