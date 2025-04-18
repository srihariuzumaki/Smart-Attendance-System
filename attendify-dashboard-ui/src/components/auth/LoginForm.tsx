import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User, Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ThemeToggle from "../layout/ThemeToggle";

const LoginForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [userType, setUserType] = useState<"student" | "faculty" | "admin">("student");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usn, setUsn] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (userType === "admin") {
        // For demo purposes, simply redirect
        navigate("/admin");
        toast({
          title: "Login Successful",
          description: "Welcome to the admin dashboard",
        });
      } else if (userType === "faculty") {
        // Authenticate faculty with ID and password
        const response = await fetch('http://localhost:5000/api/auth/faculty', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            faculty_id: username,
            password: password,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to login');
        }

        const data = await response.json();
        
        // Store faculty info in localStorage for future use
        localStorage.setItem('faculty', JSON.stringify(data.faculty));
        
        // Clear sensitive data
        setPassword("");
        
        navigate("/faculty");
        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.faculty.name}`,
        });
      } else {
        // For demo purposes, simply redirect
        navigate("/student");
        toast({
          title: "Login Successful",
          description: "Welcome to the student dashboard",
        });
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="max-w-md w-full">
        <div className="text-center mb-6 animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight">
            Attend<span className="text-primary">Sync</span>
          </h1>
          <p className="text-muted-foreground mt-1">College Attendance Management System</p>
        </div>
        
        <Tabs defaultValue="student" className="w-full" onValueChange={(value) => setUserType(value as "student" | "faculty" | "admin")}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="student" className="transition-all duration-200">Student</TabsTrigger>
            <TabsTrigger value="faculty" className="transition-all duration-200">Faculty</TabsTrigger>
            <TabsTrigger value="admin" className="transition-all duration-200">Admin</TabsTrigger>
          </TabsList>
          
          <div className="mt-4 animate-slide-in">
            <Card className="border border-border shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">
                  {userType === "student" ? "Student Login" : 
                   userType === "faculty" ? "Faculty Login" : "Admin Login"}
                </CardTitle>
                <CardDescription>
                  {userType === "student" ? "Enter your USN and date of birth" : 
                   "Enter your username and password to access your dashboard"}
                </CardDescription>
              </CardHeader>
              
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <TabsContent value="student" className="space-y-4 mt-0">
                    <div className="space-y-2">
                      <Label htmlFor="usn">University Seat Number (USN)</Label>
                      <Input 
                        id="usn" 
                        placeholder="Enter your USN" 
                        value={usn}
                        onChange={(e) => setUsn(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : "Select date of birth"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                            disabled={(date) => date > new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="faculty" className="space-y-4 mt-0">
                    <div className="space-y-2">
                      <Label htmlFor="username">Faculty ID</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="username" 
                          placeholder="Enter your faculty ID" 
                          className="pl-10" 
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="password" 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Enter your password" 
                          className="pl-10" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-1 top-1"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? 
                            <EyeOff className="h-4 w-4 text-muted-foreground" /> :
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          }
                          <span className="sr-only">
                            {showPassword ? "Hide password" : "Show password"}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="admin" className="space-y-4 mt-0">
                    <div className="space-y-2">
                      <Label htmlFor="admin-username">Admin Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="admin-username" 
                          placeholder="Enter admin username" 
                          className="pl-10" 
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="admin-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="admin-password" 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Enter your password" 
                          className="pl-10" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-1 top-1"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? 
                            <EyeOff className="h-4 w-4 text-muted-foreground" /> :
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          }
                          <span className="sr-only">
                            {showPassword ? "Hide password" : "Show password"}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </CardContent>
                
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default LoginForm;
