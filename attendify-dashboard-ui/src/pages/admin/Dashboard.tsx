import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, BookOpen, BarChart, UserPlus, FileText, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface DashboardStats {
  totalFaculty: number;
  totalSubjects: number;
  totalClasses: number;
  reportsGenerated: number;
}

interface RecentActivity {
  type: string;
  description: string;
  timestamp: string;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalFaculty: 0,
    totalSubjects: 0,
    totalClasses: 0,
    reportsGenerated: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch faculty count
        const facultyResponse = await fetch("http://localhost:5000/api/faculty");
        const facultyData = await facultyResponse.json();

        // Fetch subjects count
        const subjectsResponse = await fetch("http://localhost:5000/api/subjects/all");
        const subjectsData = await subjectsResponse.json();

        // Fetch classes count (this month)
        const classesResponse = await fetch("http://localhost:5000/api/attendance/stats/monthly");
        const classesData = await classesResponse.json();

        // Fetch reports count (this week)
        const reportsResponse = await fetch("http://localhost:5000/api/reports/stats/weekly");
        const reportsData = await reportsResponse.json();

        setStats({
          totalFaculty: facultyData.total || 0,
          totalSubjects: subjectsData.total || 0,
          totalClasses: classesData.total_classes || 0,
          reportsGenerated: reportsData.total_reports || 0
        });

        // Fetch recent activities
        const activitiesResponse = await fetch("http://localhost:5000/api/activities/recent");
        const activitiesData = await activitiesResponse.json();
        setRecentActivities(activitiesData.activities || []);

      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage college attendance and faculty</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          View Schedule
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="interactive-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFaculty}</div>
            <p className="text-xs text-muted-foreground">Active faculty members</p>
          </CardContent>
        </Card>
        <Card className="interactive-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubjects}</div>
            <p className="text-xs text-muted-foreground">Subjects being taught</p>
          </CardContent>
        </Card>
        <Card className="interactive-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClasses}</div>
            <p className="text-xs text-muted-foreground">Classes this month</p>
          </CardContent>
        </Card>
        <Card className="interactive-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reportsGenerated}</div>
            <p className="text-xs text-muted-foreground">Attendance reports this week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity Card */}
        <Card className="interactive-card">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions and logs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{activity.type}</h3>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  </div>
                  <div className="text-secondary-foreground rounded-md px-2 py-1 text-sm">
                    {activity.timestamp}
                  </div>
                </div>
              ))}
              {recentActivities.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent activities</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="interactive-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-1" asChild>
                <Link to="/admin/manage-faculty">
                  <UserPlus className="h-5 w-5" />
                  <span>Manage Faculty</span>
                </Link>
              </Button>

              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-1" asChild>
                <Link to="/admin/manage-students">
                  <Users className="h-5 w-5" />
                  <span>Manage Students</span>
                </Link>
              </Button>

              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-1" asChild>
                <Link to="/admin/map-faculty">
                  <BookOpen className="h-5 w-5" />
                  <span>Map Faculty</span>
                </Link>
              </Button>

              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-1" asChild>
                <Link to="/admin/view-reports">
                  <BarChart className="h-5 w-5" />
                  <span>View Reports</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
