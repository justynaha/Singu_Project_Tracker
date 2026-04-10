import { LayoutGrid, Ticket, BarChart3, Building2, Users, ClipboardCheck, Home, Package, Warehouse, Megaphone, CreditCard, FileText, Leaf, ChevronLeft, ChevronDown, PieChart, List, MapPin, Building, MapPinned, FileText as DocIcon, Shield, AlertTriangle } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
const navigationItems = [{
  title: "Start",
  icon: LayoutGrid,
  path: "/start",
  hasSubmenu: true
}, {
  title: "Tickets",
  icon: Ticket,
  path: "/tickets",
  hasSubmenu: true
}, {
  title: "Project Tracker",
  icon: BarChart3,
  path: "/projects",
  badge: "NEW",
  submenu: [{
    title: "Dashboard",
    icon: PieChart,
    path: "/dashboard"
  }, {
    title: "Projects",
    icon: List,
    path: "/projects"
  }]
}, {
  title: "Buildings",
  icon: Building2,
  path: "/buildings",
  submenu: [{
    title: "Sites",
    icon: MapPin,
    path: "/buildings/sites"
  }, {
    title: "Buildings",
    icon: Building,
    path: "/buildings"
  }, {
    title: "Locations",
    icon: MapPinned,
    path: "/buildings/locations",
    disabled: true
  }, {
    title: "Documentation",
    icon: DocIcon,
    path: "/buildings/documentation",
    disabled: true
  }, {
    title: "Checkpoints",
    icon: Shield,
    path: "/buildings/checkpoints",
    disabled: true
  }, {
    title: "Evacuation confirmation",
    icon: AlertTriangle,
    path: "/buildings/evacuation",
    disabled: true
  }]
}, {
  title: "Companies",
  icon: Users,
  path: "/companies",
  hasSubmenu: true
}, {
  title: "Inspections",
  icon: ClipboardCheck,
  path: "/inspections",
  hasSubmenu: true
}, {
  title: "Property inspections",
  icon: Home,
  path: "/property-inspections",
  hasSubmenu: true
}, {
  title: "Equipment",
  icon: Package,
  path: "/equipment",
  hasSubmenu: true
}, {
  title: "Warehouse",
  icon: Warehouse,
  path: "/warehouse",
  hasSubmenu: true
}, {
  title: "Marketing",
  icon: Megaphone,
  path: "/marketing",
  hasSubmenu: true
}, {
  title: "Settlements",
  icon: CreditCard,
  path: "/settlements",
  hasSubmenu: true
}, {
  title: "Reports",
  icon: FileText,
  path: "/reports",
  hasSubmenu: true
}, {
  title: "ESG",
  icon: Leaf,
  path: "/esg",
  hasSubmenu: true
}];
export const AppSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  // Check if current path is within Project Tracker
  const isProjectTrackerActive = location.pathname === "/dashboard" || location.pathname === "/projects" || location.pathname === "/" || location.pathname.startsWith("/project/");
  return <aside className={cn("bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col h-screen sticky top-0", isCollapsed ? "w-16" : "w-64")}>
      {/* Toggle button */}
      <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute -right-3 top-4 bg-card border border-border rounded-full p-1 shadow-md hover:bg-secondary transition-colors z-10">
        <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6">
        <ul className="space-y-1 px-3">
          {navigationItems.map(item => <li key={item.path}>
              {item.submenu ? <Collapsible defaultOpen={isProjectTrackerActive}>
                  <CollapsibleTrigger className={cn("flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors relative w-full", "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", isProjectTrackerActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium")}>
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <>
                        <span className="flex-1 text-left">{item.title}</span>
                        {item.badge}
                        <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                      </>}
                  </CollapsibleTrigger>
                  {!isCollapsed && <CollapsibleContent>
                      <ul className="ml-6 mt-1 space-y-1 border-l border-sidebar-border pl-3">
                        {item.submenu.map(subItem => <li key={subItem.path}>
                            <NavLink to={subItem.path} className={cn("flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors", "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")} activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                              <subItem.icon className="h-4 w-4 flex-shrink-0" />
                              <span>{subItem.title}</span>
                            </NavLink>
                          </li>)}
                      </ul>
                    </CollapsibleContent>}
                </Collapsible> : <NavLink to={item.path} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors relative", "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")} activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <>
                      <span className="flex-1">{item.title}</span>
                      {item.badge && <span className="bg-success text-success-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                          {item.badge}
                        </span>}
                      {item.hasSubmenu && <ChevronLeft className="h-4 w-4 -rotate-90" />}
                    </>}
                </NavLink>}
            </li>)}
        </ul>
      </nav>
    </aside>;
};