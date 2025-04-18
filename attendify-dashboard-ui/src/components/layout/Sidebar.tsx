import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Users, 
  BarChart, 
  BookOpen, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  GraduationCap,
  UserPlus
} from "lucide-react";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import ThemeToggle from "./ThemeToggle";
import useAuth from "@/hooks/useAuth";

// Create a persistent store for sidebar state
interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
}

const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      toggle: () => set((state) => ({ collapsed: !state.collapsed })),
    }),
    {
      name: 'sidebar-storage',
    }
  )
);

type SidebarProps = {
  role: "admin" | "faculty" | "student";
};

type NavItem = {
  title: string;
  icon: React.ElementType;
  href: string;
  role: ("admin" | "faculty" | "student")[];
};

const navItems: NavItem[] = [
  // Admin routes
  {
    title: "Dashboard",
    icon: Home,
    href: "/admin",
    role: ["admin"],
  },
  {
    title: "Map Faculty",
    icon: UserPlus,
    href: "/admin/map-faculty",
    role: ["admin"],
  },
  {
    title: "View Reports",
    icon: FileText,
    href: "/admin/reports",
    role: ["admin"],
  },
  {
    title: "Manage Students",
    icon: Users,
    href: "/admin/students",
    role: ["admin"],
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/admin/settings",
    role: ["admin"],
  },
  
  // Faculty routes
  {
    title: "Dashboard",
    icon: Home,
    href: "/faculty",
    role: ["faculty"],
  },
  {
    title: "Mark Attendance",
    icon: Calendar,
    href: "/faculty/mark-attendance",
    role: ["faculty"],
  },
  {
    title: "My Subjects",
    icon: BookOpen,
    href: "/faculty/subjects",
    role: ["faculty"],
  },
  {
    title: "Reports",
    icon: BarChart,
    href: "/faculty/reports",
    role: ["faculty"],
  },
  
  // Student routes
  {
    title: "Dashboard",
    icon: Home,
    href: "/student",
    role: ["student"],
  },
  {
    title: "My Attendance",
    icon: Calendar,
    href: "/student/attendance",
    role: ["student"],
  },
  {
    title: "Courses",
    icon: GraduationCap,
    href: "/student/courses",
    role: ["student"],
  },
];

const Sidebar = ({ role }: SidebarProps) => {
  const { collapsed, toggle } = useSidebarStore();
  const location = useLocation();
  const { logout } = useAuth();
  
  const filteredNavItems = navItems.filter(item => item.role.includes(role));

  return (
    <div className={cn(
      "h-screen border-r border-border flex flex-col bg-sidebar transition-all duration-300 sticky top-0",
      collapsed ? "w-[80px]" : "w-[280px]"
    )}>
      <div className="p-4 flex items-center justify-between">
        <div className={cn(
          "flex items-center gap-2 transition-all",
          collapsed ? "opacity-0 w-0" : "opacity-100"
        )}>
          <BookOpen className="h-6 w-6 text-sidebar-primary" />
          <h1 className="font-bold text-lg text-sidebar-foreground">
            Attend
            <span className="text-sidebar-primary">Sync</span>
          </h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="rounded-full h-8 w-8 bg-sidebar-accent hover:bg-sidebar-accent/80"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-sidebar-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-sidebar-foreground" />
          )}
          <span className="sr-only">
            {collapsed ? "Expand sidebar" : "Collapse sidebar"}
          </span>
        </Button>
      </div>
      
      <Separator />
      
      <ScrollArea className="flex-1 py-4">
        <nav className="grid gap-2 px-2">
          {filteredNavItems.map((item, index) => (
            <Link
              key={index}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
                location.pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className={cn(
                "transition-all",
                collapsed ? "opacity-0 w-0 hidden" : "opacity-100"
              )}>
                {item.title}
              </span>
            </Link>
          ))}
        </nav>
      </ScrollArea>
      
      <Separator />
      
      <div className="p-4 flex flex-col gap-2">
        <div className={cn(
          "flex items-center justify-between",
          collapsed && "flex-col gap-3"
        )}>
          <ThemeToggle />
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            className={cn(
              "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "w-10 h-10 p-0"
            )}
            onClick={logout}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
