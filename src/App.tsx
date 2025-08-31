import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import PomodoroPage from "@/pages/PomodoroPage";
import TasksPage from "@/pages/TasksPage";
import StatisticsPage from "@/pages/StatisticsPage";
import TreePage from "@/pages/TreePage";
import PondPage from "@/pages/PondPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<PomodoroPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="stats" element={<StatisticsPage />} />
            <Route path="tree" element={<TreePage />} />
            <Route path="pond" element={<PondPage />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
