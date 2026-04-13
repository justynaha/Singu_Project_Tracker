import { useParams, useNavigate } from "react-router-dom";
import { FileText, Info, Clock, ArrowLeft, ListTodo, FileSignature } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import ProjectHeader from "@/components/project-detail/ProjectHeader";
import TimelineV2Tab from "@/components/project-detail/TimelineV2Tab";
import OverviewTab from "@/components/project-detail/OverviewTab";
import FilesTab from "@/components/project-detail/FilesTab";
import ContractsTab from "@/components/project-detail/ContractsTab";
import ActualVsBudgetTab from "@/components/project-detail/ActualVsBudgetTab";
import EditProjectModal from "@/components/project-detail/EditProjectModal";
import { useProjectDetail } from "@/hooks/useProjectDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("project-plan");
  const [showEditModal, setShowEditModal] = useState(false);

  const {
    project,
    timelineItems,
    files,
    contracts,
    costs,
    cashflowTotals,
    loading,
    updateProject,
    deleteProject,
    createTimelineItem,
    updateTimelineItem,
    deleteTimelineItem,
    reorderTimelineItems,
    createFile,
    deleteFile,
    createCost,
    updateCost,
    deleteCost,
  } = useProjectDetail(id);

  const handleDeleteProject = async () => {
    const success = await deleteProject();
    if (success) {
      navigate("/projects");
    }
    return success;
  };

  // Calculate tracking status based on overdue items
  const overdueItems = timelineItems.filter(item => {
    if (!item.due_date || item.status === "done") return false;
    return new Date(item.due_date) < new Date();
  });
  const trackingStatus: "on-track" | "off-track" = overdueItems.length > 0 ? "off-track" : "on-track";
  const offTrackMessage = overdueItems.length > 0 
    ? `${overdueItems.length} item${overdueItems.length > 1 ? "s have" : " has"} missed ${overdueItems.length > 1 ? "their" : "its"} due date`
    : undefined;

  // File preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string; type: string } | null>(null);

  const handleFilePreview = (file: { name: string; url: string; type: string }) => {
    setPreviewFile(file);
    setShowPreviewModal(true);
  };

  const isImage = (type: string) => type?.startsWith("image/");

  // Use cashflow totals
  const totalContracted = cashflowTotals.contracted;
  const totalInvoiced = cashflowTotals.invoiced;
  const totalBudget = project?.total_budget || 0;

  const formatCurrency = (amount: number) => {
    return `USD ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const tabs = [
    { id: "project-plan", label: "Overview", icon: ListTodo },
    { id: "contracts", label: "Contracts", icon: FileSignature },
    { id: "files", label: "Files", icon: FileText, badge: `(${files.length})` },
    { id: "details", label: "Details", icon: Info },
    { id: "history", label: "History", icon: Clock },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-32 w-full mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Project not found</h2>
          <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/projects")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6">
        <ProjectHeader projectNo={project.id.slice(0, 8)} projectName={project.name} site={project.site} address={project.address} onEdit={() => setShowEditModal(true)} />

        {/* Tabs */}
        <div className="bg-card border border-border rounded-lg">
          <div className="border-b border-border flex gap-1 px-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 -mb-px",
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.badge && <span className="text-muted-foreground">{tab.badge}</span>}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === "project-plan" && (
            <TimelineV2Tab
              items={timelineItems}
              files={files}
              budget={totalBudget}
              contracted={totalContracted}
              invoiced={totalInvoiced}
              currency={costs[0]?.currency || "EUR"}
              trackingStatus={trackingStatus}
              offTrackMessage={offTrackMessage}
              onCreateItem={createTimelineItem}
              onUpdateItem={updateTimelineItem}
              onDeleteItem={deleteTimelineItem}
            />
          )}
          {activeTab === "contracts" && (
            <ContractsTab contracts={contracts} currency={project?.currency || "EUR"} />
          )}
          {activeTab === "files" && (
            <FilesTab
              files={files}
              timelineItems={timelineItems}
              onCreateFile={createFile}
              onDeleteFile={deleteFile}
            />
          )}
          {activeTab === "details" && <OverviewTab project={project} />}
          {activeTab === "history" && (
            <div className="p-6 text-center text-muted-foreground">
              History tab content coming soon
            </div>
          )}
        </div>
      </div>

      {/* Global File Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {previewFile && isImage(previewFile.type) ? (
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="max-w-full max-h-[60vh] mx-auto rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-16 w-16 mb-4" />
                <p>Preview not available for this file type</p>
                <a
                  href={previewFile?.url}
                  download={previewFile?.name}
                  className="mt-4 text-primary hover:underline"
                >
                  Download file
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Project Modal */}
      <EditProjectModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        project={project}
        onSave={updateProject}
        onDelete={handleDeleteProject}
      />
    </div>
  );
}
