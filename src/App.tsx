import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import { AppHeader } from "./components/AppHeader";
import { AppSidebar } from "./components/AppSidebar";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex w-full min-h-screen">
          <AppSidebar />
          <div className="flex-1 flex flex-col w-full">
            <AppHeader />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/project/:id" element={<ProjectDetail />} />
                <Route path="/start" element={<div className="p-6">Start page coming soon</div>} />
                <Route path="/tickets" element={<div className="p-6">Tickets page coming soon</div>} />
                <Route path="/buildings" element={<div className="p-6">Buildings page coming soon</div>} />
                <Route path="/companies" element={<div className="p-6">Companies page coming soon</div>} />
                <Route path="/inspections" element={<div className="p-6">Inspections page coming soon</div>} />
                <Route path="/property-inspections" element={<div className="p-6">Property inspections page coming soon</div>} />
                <Route path="/equipment" element={<div className="p-6">Equipment page coming soon</div>} />
                <Route path="/warehouse" element={<div className="p-6">Warehouse page coming soon</div>} />
                <Route path="/marketing" element={<div className="p-6">Marketing page coming soon</div>} />
                <Route path="/settlements" element={<div className="p-6">Settlements page coming soon</div>} />
                <Route path="/reports" element={<div className="p-6">Reports page coming soon</div>} />
                <Route path="/esg" element={<div className="p-6">ESG page coming soon</div>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
