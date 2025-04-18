
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface MainLayoutProps {
  role: "admin" | "faculty" | "student";
}

const MainLayout = ({ role }: MainLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { toast } = useToast();

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} />
      
      <main className={cn("flex-1 transition-all duration-300 animate-fade-in")}>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
