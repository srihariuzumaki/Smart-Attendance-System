import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, BookOpen, BarChart, CheckCircle2, Upload, Loader2 } from "lucide-react";
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
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface DashboardData {
  faculty_name: string;
  department: string;
  total_subjects: number;
  todays_classes: {
    subject: string;
    section: string;
    department: string;
    semester: string;
    status: string;
  }[];
  attendance_marked: {
    total: number;
    today: number;
  };
  subject_attendance: {
    subject: string;
    attendance: number;
  }[];
  recent_classes: {
    name: string;
    present: number;
    absent: number;
  }[];
}

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get faculty ID from local storage or context
        const facultyId = localStorage.getItem('facultyId');
        if (!facultyId) {
          throw new Error('Faculty ID not found');
        }

        const response = await fetch(`http://localhost:5000/api/faculty/${facultyId}/dashboard`);
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dashboard data"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {data.faculty_name}</h1>
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
            <div className="text-2xl font-bold">{data.total_subjects}</div>
            <p className="text-xs text-muted-foreground">Current semester subjects</p>
          </CardContent>
        </Card>
        <Card className="interactive-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Classes Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.todays_classes.length}</div>
            {data.todays_classes[0] && (
              <p className="text-xs text-muted-foreground">
                Next: {data.todays_classes[0].subject} - {data.todays_classes[0].section}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="interactive-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Attendance Marked</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.attendance_marked.total}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card className="interactive-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.subject_attendance.length > 0
                ? (data.subject_attendance.reduce((sum, subj) => sum + subj.attendance, 0) / data.subject_attendance.length).toFixed(1)
                : 0}%
            </div>
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
              {data.todays_classes.map((cls, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{cls.subject}</h3>
                    <p className="text-sm text-muted-foreground">
                      {cls.department.toUpperCase()}-{cls.semester}{cls.section}
                    </p>
                  </div>
                  <div className="bg-secondary text-secondary-foreground rounded-md px-2 py-1 text-sm">
                    {cls.status}
                  </div>
                </div>
              ))}
              {data.todays_classes.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No classes scheduled for today</p>
              )}
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
              <RechartBarChart data={data.subject_attendance}>
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
              {data.recent_classes.map((cls, index) => (
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
              {data.recent_classes.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No recent classes found</p>
              )}
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
                onClick={() => navigate("/faculty/my-subjects")}
              >
                <BookOpen className="h-5 w-5" />
                <span>My Subjects</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-1"
                onClick={() => navigate("/faculty/upload")}
              >
                <Upload className="h-5 w-5" />
                <span>Upload Students</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FacultyDashboard;
