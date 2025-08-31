import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Settings } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { SettingsDialog } from "@/components/SettingsDialog";

export function Layout() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card">
            <SidebarTrigger className="hover:bg-muted transition-smooth" />
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="hover:bg-muted transition-smooth"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </header>
          
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        </main>
        
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    </SidebarProvider>
  );
}