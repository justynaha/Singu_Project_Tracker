import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Upload, Trash2, FileText, Download, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { toast } from "sonner";

interface PanelFile {
  id: string;
  name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_at: string;
  timeline_item_id: string | null;
}

interface FilesPanelProps {
  timelineItemId: string;
  timelineItemName: string;
  projectId: string;
  onClose: () => void;
  onCountChange: (itemId: string, count: number) => void;
}

export default function FilesPanel({
  timelineItemId,
  timelineItemName,
  projectId,
  onClose,
  onCountChange,
}: FilesPanelProps) {
  const [files, setFiles] = useState<PanelFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    const { data, error } = await supabase
      .from("project_files")
      .select("*")
      .eq("timeline_item_id", timelineItemId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      toast.error("Failed to load files");
      return;
    }
    setFiles(data || []);
    onCountChange(timelineItemId, (data || []).length);
    setLoading(false);
  }, [timelineItemId, onCountChange]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const filePath = `${projectId}/${timelineItemId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("project-files")
        .getPublicUrl(filePath);

      const { data, error } = await supabase
        .from("project_files")
        .insert({
          project_id: projectId,
          timeline_item_id: timelineItemId,
          name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single();

      if (error) throw error;

      setFiles((prev) => [data, ...prev]);
      onCountChange(timelineItemId, files.length + 1);
      toast.success("File uploaded");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (file: PanelFile) => {
    const { error } = await supabase
      .from("project_files")
      .delete()
      .eq("id", file.id);

    if (error) {
      toast.error("Failed to delete file");
      return;
    }

    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    onCountChange(timelineItemId, files.length - 1);
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (type: string | null) => type?.startsWith("image/");

  return (
    <div className="w-[400px] flex-shrink-0 border-l border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="font-medium truncate">{timelineItemName}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Files list */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
        ) : files.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No files yet</p>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div key={file.id} className="group border border-border rounded-lg p-3">
                {isImage(file.file_type) && (
                  <img
                    src={file.file_url}
                    alt={file.name}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {file.file_size && <span>{formatSize(file.file_size)}</span>}
                      <span>{format(new Date(file.uploaded_at), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a
                      href={file.file_url}
                      download={file.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => handleDelete(file)}
                      className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Upload */}
      <div className="p-4 border-t border-border">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleUpload}
        />
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading..." : "Upload file"}
        </Button>
      </div>
    </div>
  );
}
