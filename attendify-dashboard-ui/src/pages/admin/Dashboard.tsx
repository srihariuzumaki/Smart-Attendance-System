import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, BookOpen, BarChart, UserPlus, FileText, Users } from "lucide-react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
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
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Active faculty members</p>
          </CardContent>
        </Card>
        <Card className="interactive-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">Subjects being taught</p>
          </CardContent>
        </Card>
        <Card className="interactive-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">320</div>
            <p className="text-xs text-muted-foreground">Classes this month</p>
          </CardContent>
        </Card>
        <Card className="interactive-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14</div>
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Faculty Added</h3>
                  <p className="text-sm text-muted-foreground">Dr. Rajesh assigned to CSE</p>
                </div>
                <div className="text-secondary-foreground rounded-md px-2 py-1 text-sm">
                  Just now
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Report Generated</h3>
                  <p className="text-sm text-muted-foreground">Attendance report for CSE 3rd sem</p>
                </div>
                <div className="text-secondary-foreground rounded-md px-2 py-1 text-sm">
                  2 hours ago
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Subject Mapped</h3>
                  <p className="text-sm text-muted-foreground">Operating Systems to Dr. Verma</p>
                </div>
                <div className="text-secondary-foreground rounded-md px-2 py-1 text-sm">
                  Yesterday
                </div>
              </div>
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
