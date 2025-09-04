import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TimerProvider } from "@/contexts/TimerContext";
import { Layout } from "@/components/Layout";
import PomodoroPage from "@/pages/PomodoroPage";
import TasksPage from "@/pages/TasksPage";
import StatisticsPage from "@/pages/StatisticsPage";
import TreePage from "@/pages/TreePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TimerProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<PomodoroPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="stats" element={<StatisticsPage />} />
              <Route path="tree" element={<TreePage />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TimerProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
