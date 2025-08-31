import { 
  Timer, 
  CheckSquare, 
  BarChart3, 
  TreePine, 
  Waves, 
  Settings 
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Pomodoro", url: "/", icon: Timer },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Statistics", url: "/stats", icon: BarChart3 },
  { title: "Tree", url: "/tree", icon: TreePine },
  { title: "Pond", url: "/pond", icon: Waves },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const getNavClassName = (path: string) => {
    const baseClasses = "transition-smooth";
    return isActive(path) 
      ? `${baseClasses} bg-primary text-primary-foreground shadow-nature` 
      : `${baseClasses} hover:bg-muted`;
  };

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card border-r border-border">
        <div className="p-4">
          {!isCollapsed && (
            <h1 className="text-xl font-bold bg-nature-gradient bg-clip-text text-transparent">
              FocusFlow
            </h1>
          )}
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClassName(item.url)}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span className="ml-2">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}