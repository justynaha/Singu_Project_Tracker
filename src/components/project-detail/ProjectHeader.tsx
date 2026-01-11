import { useNavigate } from "react-router-dom";
import { ChevronRight, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectHeaderProps {
  projectNo: string;
  projectName?: string;
  site?: string | null;
  address?: string | null;
  onEdit?: () => void;
}

export default function ProjectHeader({
  projectNo,
  projectName,
  site,
  address,
  onEdit,
}: ProjectHeaderProps) {
  const navigate = useNavigate();
  return <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <button onClick={() => navigate("/projects")} className="hover:text-primary transition-colors">
          Projects
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Project name</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-foreground">
             {projectName || "Project"}
          </h1>
        </div>
        <p className="text-muted-foreground text-sm mb-4">
          {site || "-"}{address ? `, ${address}` : ""}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>
    </>;
}