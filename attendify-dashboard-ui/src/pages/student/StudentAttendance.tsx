
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { ArrowDown, Check, Download, X, Calendar as CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const subjects = [
  {
    id: 1,
    name: "Data Structures & Algorithms",
    code: "CS301",
    total: 42,
    attended: 38,
    percentage: 90,
    faculty: "Dr. Sharma",
    data: [
      { date: "Apr 1", status: "present" },
      { date: "Apr 3", status: "present" },
      { date: "Apr 5", status: "present" },
      { date: "Apr 8", status: "present" },
      { date: "Apr 10", status: "absent" },
      { date: "Apr 12", status: "present" },
      { date: "Apr 15", status: "present" },
    ]
  },
  {
    id: 2,
    name: "Database Management Systems",
    code: "CS302",
    total: 40,
    attended: 30,
    percentage: 75,
    faculty: "Dr. Gupta",
    data: [
      { date: "Apr 2", status: "present" },
      { date: "Apr 4", status: "absent" },
      { date: "Apr 6", status: "present" },
      { date: "Apr 9", status: "present" },
      { date: "Apr 11", status: "absent" },
      { date: "Apr 13", status: "present" },
      { date: "Apr 16", status: "present" },
    ]
  },
  {
    id: 3,
    name: "Computer Networks",
    code: "CS303",
    total: 38,
    attended: 25,
    percentage: 66,
    faculty: "Prof. Verma",
    data: [
      { date: "Apr 2", status: "absent" },
      { date: "Apr 4", status: "present" },
      { date: "Apr 6", status: "absent" },
      { date: "Apr 9", status: "present" },
      { date: "Apr 11", status: "absent" },
      { date: "Apr 13", status: "present" },
      { date: "Apr 16", status: "present" },
    ]
  },
  {
    id: 4,
    name: "Operating Systems",
    code: "CS304",
    total: 35,
    attended: 32,
    percentage: 91,
    faculty: "Dr. Patel",
    data: [
      { date: "Apr 1", status: "present" },
      { date: "Apr 3", status: "present" },
      { date: "Apr 5", status: "present" },
      { date: "Apr 8", status: "present" },
      { date: "Apr 10", status: "present" },
      { date: "Apr 12", status: "absent" },
      { date: "Apr 15", status: "present" },
    ]
  },
];

const monthlyData = [
  { month: "Jan", attendance: 88 },
  { month: "Feb", attendance: 82 },
  { month: "Mar", attendance: 79 },
  { month: "Apr", attendance: 84 },
];

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const generateRandomAttendance = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  
  const result = [];
  
  for (let i = 1; i <= daysInMonth; i++) {
    // Don't include future dates
    if (i > today.getDate()) continue;
    
    // Random attendance - more likely to be present
    const isPresent = Math.random() > 0.2;
    
    result.push({
      date: i,
      status: isPresent ? "present" : "absent"
    });
  }
  
  return result;
};

const calendarData = generateRandomAttendance();

const getProgressColor = (percentage: number) => {
  if (percentage < 75) return "bg-destructive";
  if (percentage < 85) return "bg-yellow-500";
  return "bg-green-500";
};

const StudentAttendance = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  const filteredSubjects = selectedSubject === "all" 
    ? subjects 
    : subjects.filter(subject => subject.id.toString() === selectedSubject);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
        <p className="text-muted-foreground">Track and monitor your attendance across all subjects</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 interactive-card">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <CardTitle>Subject-wise Attendance</CardTitle>
                <CardDescription>Detailed view of your attendance in each subject</CardDescription>
              </div>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-6">
              {filteredSubjects.map((subject) => (
                <div key={subject.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{subject.name}</h3>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span>{subject.code}</span>
                        <span className="mx-2">•</span>
                        <span>{subject.faculty}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-sm font-medium">
                        {subject.attended} / {subject.total} Classes
                      </span>
                      <div className="text-sm font-semibold">
                        {subject.percentage}%
                      </div>
                    </div>
                  </div>
                  
                  <Progress 
                    value={subject.percentage} 
                    max={100} 
                    className={`h-2 ${getProgressColor(subject.percentage)}`}
                  />
                  
                  {subject.percentage < 75 && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <ArrowDown className="h-3 w-3" />
                      You need to attend {Math.ceil((75 * subject.total - 100 * subject.attended) / 25)} more classes to reach 75%
                    </p>
                  )}
                  
                  <div className="flex gap-2 flex-wrap mt-1">
                    {subject.data.map((day, index) => (
                      <Badge 
                        key={index} 
                        variant={day.status === "present" ? "default" : "destructive"}
                        className="flex items-center gap-1"
                      >
                        {day.date}
                        {day.status === "present" ? 
                          <Check className="h-3 w-3" /> : 
                          <X className="h-3 w-3" />
                        }
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          
          <CardFooter>
            <Button variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download Detailed Report
            </Button>
          </CardFooter>
        </Card>
        
        <div className="space-y-4">
          <Card className="interactive-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Monthly Trends</span>
              </CardTitle>
              <CardDescription>Your attendance trends</CardDescription>
            </CardHeader>
            
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, "Attendance"]} />
                  <Bar 
                    dataKey="attendance" 
                    fill="hsl(var(--primary))" 
                    name="Attendance %"
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="interactive-card">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Your attendance at a glance</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Lowest Subject</span>
                  <span className="text-sm font-medium">CS303 (66%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Highest Subject</span>
                  <span className="text-sm font-medium">CS304 (91%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Average</span>
                  <span className="text-sm font-medium">80.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Days Present</span>
                  <span className="text-sm font-medium">42/50</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Attendance Calendar</CardTitle>
          <CardDescription>Check your daily attendance record</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="calendar">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="calendar" className="flex flex-col items-center">
              <div className="p-3 bg-card rounded-lg shadow-sm mb-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md"
                  // Customize specific dates based on attendance
                  modifiers={{
                    present: calendarData
                      .filter(day => day.status === "present")
                      .map(day => new Date(new Date().getFullYear(), new Date().getMonth(), day.date)),
                    absent: calendarData
                      .filter(day => day.status === "absent")
                      .map(day => new Date(new Date().getFullYear(), new Date().getMonth(), day.date))
                  }}
                  modifiersStyles={{
                    present: { backgroundColor: "rgba(34, 197, 94, 0.2)" },
                    absent: { backgroundColor: "rgba(239, 68, 68, 0.2)" }
                  }}
                />
              </div>
              
              <div className="flex gap-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-200 rounded-full"></div>
                  <span className="text-sm">Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-200 rounded-full"></div>
                  <span className="text-sm">Absent</span>
                </div>
              </div>
              
              {selectedDate && (
                <div className="mt-4 w-full bg-card p-4 rounded-md border">
                  <h3 className="font-medium">
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                  
                  <div className="mt-2 space-y-1">
                    {subjects.map(subject => {
                      // Randomly determine attendance for demo purposes
                      const isPresent = Math.random() > 0.3;
                      
                      return (
                        <div 
                          key={subject.id} 
                          className="flex items-center justify-between py-1 border-b last:border-0"
                        >
                          <span className="text-sm">{subject.name}</span>
                          {isPresent ? (
                            <Badge className="bg-green-500">Present</Badge>
                          ) : (
                            <Badge variant="destructive">Absent</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="list">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      {subjects.map(subject => (
                        <TableHead key={subject.id}>{subject.code}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 10 }, (_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() - i);
                      
                      return (
                        <TableRow key={i}>
                          <TableCell>
                            {date.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </TableCell>
                          
                          {subjects.map(subject => {
                            // Random attendance status for demo
                            const isPresent = Math.random() > 0.3;
                            
                            return (
                              <TableCell key={subject.id}>
                                {isPresent ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <X className="h-4 w-4 text-destructive" />
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentAttendance;
