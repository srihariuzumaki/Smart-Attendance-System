import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import MainLayout from "./components/layout/MainLayout";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import MapFaculty from "./pages/admin/MapFaculty";
import ManageStudents from "./pages/admin/ManageStudents";
import ViewReports from "./pages/admin/ViewReports";
import ManageFaculty from "./pages/admin/ManageFaculty";

// Faculty Pages
import FacultyDashboard from "./pages/faculty/Dashboard";
import MarkAttendance from "./pages/faculty/MarkAttendance";
import StudentUpload from "./pages/faculty/StudentUpload";

// Student Pages
import StudentDashboard from "./pages/student/Dashboard";
import StudentAttendance from "./pages/student/StudentAttendance";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />
          
          {/* Redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<MainLayout role="admin" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="map-faculty" element={<MapFaculty />} />
            <Route path="manage-faculty" element={<ManageFaculty />} />
            <Route path="manage-students" element={<ManageStudents />} />
            <Route path="view-reports" element={<ViewReports />} />
          </Route>
          
          {/* Faculty Routes */}
          <Route path="/faculty" element={<MainLayout role="faculty" />}>
            <Route index element={<FacultyDashboard />} />
            <Route path="mark-attendance" element={<MarkAttendance />} />
            <Route path="student-upload" element={<StudentUpload />} />
          </Route>
          
          {/* Student Routes */}
          <Route path="/student" element={<MainLayout role="student" />}>
            <Route index element={<StudentDashboard />} />
            <Route path="attendance" element={<StudentAttendance />} />
          </Route>
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
