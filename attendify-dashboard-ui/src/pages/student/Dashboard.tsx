
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, Download, AlertTriangle, Check } from "lucide-react";
import { 
  PieChart, 
  Pie, 
  ResponsiveContainer, 
  Cell, 
  Legend, 
  Tooltip 
} from "recharts";

const subjects = [
  {
    id: 1,
    name: "Data Structures & Algorithms",
    code: "CS301",
    total: 42,
    attended: 38,
    percentage: 90,
  },
  {
    id: 2,
    name: "Database Management Systems",
    code: "CS302",
    total: 40,
    attended: 30,
    percentage: 75,
  },
  {
    id: 3,
    name: "Computer Networks",
    code: "CS303",
    total: 38,
    attended: 25,
    percentage: 66,
  },
  {
    id: 4,
    name: "Operating Systems",
    code: "CS304",
    total: 35,
    attended: 32,
    percentage: 91,
  },
];

const getProgressColor = (percentage: number) => {
  if (percentage < 75) return "bg-destructive";
  if (percentage < 85) return "bg-yellow-500";
  return "bg-green-500";
};

const getTextColor = (percentage: number) => {
  if (percentage < 75) return "text-destructive";
  if (percentage < 85) return "text-yellow-500";
  return "text-green-500";
};

const StudentDashboard = () => {
  // Calculate the average attendance
  const averageAttendance = subjects.reduce((sum, subject) => sum + subject.percentage, 0) / subjects.length;
  
  // Prepare data for the pie chart
  const pieData = [
    { name: "Present", value: averageAttendance },
    { name: "Absent", value: 100 - averageAttendance },
  ];
  
  const COLORS = ["hsl(var(--primary))", "hsl(var(--muted))"];
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const getDatesBetween = (startDate: Date, endDate: Date) => {
    const dates = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };
  
  // Generate dates for the last 5 days
  const today = new Date();
  const fiveDaysAgo = new Date(today);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 4);
  const recentDates = getDatesBetween(fiveDaysAgo, today);
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, Rahul</h1>
        <p className="text-muted-foreground">Student Dashboard • USN: 1CS20003</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 interactive-card">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Attendance Overview</span>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                <span>Report</span>
              </Button>
            </CardTitle>
            <CardDescription>Your attendance across all subjects</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {subjects.map((subject) => (
              <div key={subject.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{subject.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{subject.code}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {subject.attended}/{subject.total} Classes
                      </span>
                      
                      {subject.percentage < 75 && (
                        <Badge variant="destructive" className="text-xs flex items-center gap-1 ml-2">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Low Attendance</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <span className={`font-semibold ${getTextColor(subject.percentage)}`}>
                    {subject.percentage}%
                  </span>
                </div>
                
                <Progress 
                  value={subject.percentage} 
                  max={100} 
                  className={`h-2 ${getProgressColor(subject.percentage)}`}
                />
                
                {subject.percentage < 75 && (
                  <p className="text-xs text-destructive italic">
                    Need to attend {Math.ceil((75 * subject.total - 100 * subject.attended) / 25)} more classes to reach 75%
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card className="interactive-card">
          <CardHeader>
            <CardTitle>Overall Attendance</CardTitle>
            <CardDescription>Your average attendance</CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                  label={({ value }) => `${value}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className={`text-2xl font-bold mt-2 ${averageAttendance >= 75 ? 'text-green-500' : 'text-destructive'}`}>
              {averageAttendance.toFixed(1)}%
            </div>
          </CardContent>
          
          <CardFooter>
            <div className="w-full text-center text-sm text-muted-foreground">
              {averageAttendance >= 75 ? (
                <div className="flex items-center justify-center gap-1 text-green-500">
                  <Check className="h-4 w-4" />
                  <span>You're above the 75% requirement</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span>You're below the 75% requirement</span>
                </div>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="interactive-card">
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
            <CardDescription>Your attendance for the last 5 days</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {recentDates.map((date, index) => {
                // Randomly decide if present or absent for demonstration
                const isPresent = Math.random() > 0.3;
                
                return (
                  <div 
                    key={index}
                    className="flex flex-col items-center"
                  >
                    <div className="text-sm font-medium">{formatDate(date)}</div>
                    <div 
                      className={`w-full h-14 mt-2 rounded-md flex items-center justify-center ${
                        isPresent ? 'bg-green-500/20' : 'bg-destructive/20'
                      }`}
                    >
                      {isPresent ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <span className="text-lg font-medium text-destructive">A</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        <Card className="interactive-card">
          <CardHeader>
            <CardTitle>Upcoming Classes</CardTitle>
            <CardDescription>Your schedule for today</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-md p-3 hover:bg-secondary/50 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Database Management Systems</h3>
                    <p className="text-sm text-muted-foreground">Room 305 • Prof. Sharma</p>
                  </div>
                  <Badge className="bg-primary">11:00 AM</Badge>
                </div>
              </div>
              
              <div className="border rounded-md p-3 hover:bg-secondary/50 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Operating Systems</h3>
                    <p className="text-sm text-muted-foreground">Room 401 • Prof. Mehta</p>
                  </div>
                  <Badge className="bg-primary">1:30 PM</Badge>
                </div>
              </div>
              
              <div className="border rounded-md p-3 hover:bg-secondary/50 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Computer Networks</h3>
                    <p className="text-sm text-muted-foreground">Room 206 • Prof. Gupta</p>
                  </div>
                  <Badge className="bg-primary">3:00 PM</Badge>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-1 w-full">
                <Calendar className="h-4 w-4" />
                <span>Full Schedule</span>
              </Button>
              <Button variant="outline" className="flex items-center gap-1 w-full">
                <BookOpen className="h-4 w-4" />
                <span>All Courses</span>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
