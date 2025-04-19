import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
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
      
      <div className={cn("flex-1 flex flex-col transition-all duration-300 animate-fade-in")}>
        <main className="flex-1">
          <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
