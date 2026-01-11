import { MessageCircle, ClipboardList, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProjectStatusTimelineProps {
  status: string;
  trackingStatus?: "on-track" | "off-track";
  offTrackMessage?: string;
}

export default function ProjectStatusTimeline({ 
  status, 
  trackingStatus = "on-track",
  offTrackMessage 
}: ProjectStatusTimelineProps) {
  const statusSteps = [
    { label: "Open", icon: MessageCircle, active: status === "Open", completed: status !== "Open" },
    { label: "In Progress", icon: ClipboardList, active: status === "In progress", completed: ["Completed", "Closed"].includes(status) },
    { label: "Closed", icon: CheckCircle2, active: status === "Closed", completed: false },
  ];

  const getStepIndex = () => {
    if (status === "Open") return 0;
    if (status === "In progress") return 1;
    return 2;
  };

  const currentIndex = getStepIndex();

  return (
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-6">
        <h3 className="font-semibold text-foreground">Project status</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant={trackingStatus === "on-track" ? "outline" : "destructive"}
                className={cn(
                  "text-xs font-medium cursor-pointer",
                  trackingStatus === "on-track" && "bg-success/10 text-success border-success"
                )}
              >
                {trackingStatus === "on-track" ? "on track" : "off track"}
              </Badge>
            </TooltipTrigger>
            <TooltipContent 
              side="bottom" 
              className={cn(
                "p-3 max-w-xs",
                trackingStatus === "on-track" 
                  ? "bg-success/10 border border-success/20" 
                  : "bg-destructive/10 border border-destructive/20"
              )}
            >
              {trackingStatus === "on-track" ? (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-success">On Track</p>
                    <p className="text-sm text-success">No due dates have been missed</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Off Track</p>
                    <p className="text-sm text-destructive">{offTrackMessage || "Some tasks or milestones have missed their due dates"}</p>
                  </div>
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex items-center justify-between relative pr-8">
        {statusSteps.map((step, idx) => (
          <div key={idx} className="flex flex-col items-center relative z-10">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors border-2",
                step.active || step.completed
                  ? "bg-success/10 border-success text-success"
                  : "bg-muted border-border text-muted-foreground"
              )}
            >
              <step.icon className="h-5 w-5" />
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                step.active || step.completed ? "text-success" : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
        {/* Progress line */}
        <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-border -z-0" />
      </div>
    </div>
  );
}
