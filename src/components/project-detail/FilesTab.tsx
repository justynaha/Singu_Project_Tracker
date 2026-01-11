import { useState, useRef } from "react";
import { Plus, FileText, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ProjectFile, TimelineItem } from "@/hooks/useProjectDetail";

interface FilesTabProps {
  files: ProjectFile[];
  timelineItems: TimelineItem[];
  onCreateFile: (input: {
    name: string;
    file_url: string;
    file_type?: string;
    file_size?: number;
    timeline_item_id?: string;
  }) => Promise<ProjectFile | null>;
  onDeleteFile: (id: string) => Promise<boolean>;
}

export default function FilesTab({ files, timelineItems, onCreateFile, onDeleteFile }: FilesTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [assignedTask, setAssignedTask] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleSave = async () => {
    if (!selectedFile) return;

    // Create a local URL for the file (for demo purposes)
    const fileUrl = URL.createObjectURL(selectedFile);

    await onCreateFile({
      name: selectedFile.name,
      file_url: fileUrl,
      file_type: selectedFile.type || "application/octet-stream",
      file_size: selectedFile.size,
      timeline_item_id: assignedTask || undefined,
    });

    setShowAddModal(false);
    setSelectedFile(null);
    setAssignedTask("");
  };

  const handleDelete = async (id: string) => {
    await onDeleteFile(id);
  };

  const handlePreview = (file: ProjectFile) => {
    setPreviewFile(file);
    setShowPreviewModal(true);
  };

  const openAddModal = () => {
    setSelectedFile(null);
    setAssignedTask("");
    setShowAddModal(true);
  };

  const getAssignedItemName = (itemId: string | null) => {
    if (!itemId) return "-";
    const item = timelineItems.find(i => i.id === itemId);
    return item ? item.name : "-";
  };

  const isImage = (type: string | null) => type?.startsWith("image/");

  const formatSize = (size: number | null) => {
    if (!size) return "-";
    return formatFileSize(size);
  };

  return (
    <div className="p-4">
      {/* Add Button */}
      <div className="mb-4">
        <Button size="sm" onClick={openAddModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add files
        </Button>
      </div>

      {/* Files Table */}
      {files.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Assigned to</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{file.name}</span>
                  </div>
                </TableCell>
                <TableCell>{formatSize(file.file_size)}</TableCell>
                <TableCell>{getAssignedItemName(file.timeline_item_id)}</TableCell>
                <TableCell>{new Date(file.uploaded_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handlePreview(file)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center text-muted-foreground py-12">
          No files uploaded yet
        </div>
      )}

      {/* Add File Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add file</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Attachment*</Label>
              <div
                className={cn(
                  "mt-2 border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                  dragActive ? "border-primary bg-primary/5" : "border-border",
                  selectedFile && "border-primary bg-primary/5"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={handleBrowseClick}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-foreground font-medium">{selectedFile.name}</span>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    Drag & drop files here or{" "}
                    <span className="text-primary font-medium">Click to browse</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>Assign to task (optional)</Label>
              <Select value={assignedTask} onValueChange={setAssignedTask}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  {timelineItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!selectedFile}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {previewFile && isImage(previewFile.file_type) ? (
              <img 
                src={previewFile.file_url} 
                alt={previewFile.name}
                className="max-w-full max-h-[60vh] mx-auto rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-16 w-16 mb-4" />
                <p>Preview not available for this file type</p>
                <a 
                  href={previewFile?.file_url} 
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
    </div>
  );
}
