import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import ProjectTypes from "./pages/ProjectTypes";
import { AppHeader } from "./components/AppHeader";
import { AppSidebar } from "./components/AppSidebar";
import SitesList from "./pages/buildings/SitesList";
import SiteDetail from "./pages/buildings/SiteDetail";
import BuildingsList from "./pages/buildings/BuildingsList";
import BuildingDetail from "./pages/buildings/BuildingDetail";

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
                <Route path="/buildings" element={<BuildingsList />} />
                <Route path="/buildings/sites" element={<SitesList />} />
                <Route path="/buildings/sites/:siteId" element={<SiteDetail />} />
                <Route path="/buildings/:buildingId" element={<BuildingDetail />} />
                <Route path="/companies" element={<div className="p-6">Companies page coming soon</div>} />
                <Route path="/inspections" element={<div className="p-6">Inspections page coming soon</div>} />
                <Route path="/property-inspections" element={<div className="p-6">Property inspections page coming soon</div>} />
                <Route path="/equipment" element={<div className="p-6">Equipment page coming soon</div>} />
                <Route path="/warehouse" element={<div className="p-6">Warehouse page coming soon</div>} />
                <Route path="/marketing" element={<div className="p-6">Marketing page coming soon</div>} />
                <Route path="/settlements" element={<div className="p-6">Settlements page coming soon</div>} />
                <Route path="/reports" element={<div className="p-6">Reports page coming soon</div>} />
                <Route path="/esg" element={<div className="p-6">ESG page coming soon</div>} />
                <Route path="/master-data" element={<div className="p-6">Master data coming soon</div>} />
                <Route path="/master-data/tickets" element={<div className="p-6">Master data – Tickets coming soon</div>} />
                <Route path="/master-data/projects-list" element={<div className="p-6">Master data – Projects list coming soon</div>} />
                <Route path="/master-data/projects-categories" element={<div className="p-6">Master data – Categories assignment table coming soon</div>} />
                <Route path="/master-data/project-types" element={<ProjectTypes />} />
                <Route path="/master-data/foreign-exchange" element={<ForeignExchange />} />
                <Route path="/master-data/warehouse" element={<div className="p-6">Master data – Warehouse coming soon</div>} />
                <Route path="/master-data/equipment" element={<div className="p-6">Master data – Equipment coming soon</div>} />
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
