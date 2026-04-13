import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Send, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { toast } from "sonner";

interface Comment {
  id: string;
  timeline_item_id: string;
  author_name: string;
  content: string;
  created_at: string;
  visibility: string;
}

interface CommentsPanelProps {
  timelineItemId: string;
  timelineItemName: string;
  onClose: () => void;
  onCountChange: (itemId: string, count: number) => void;
}

export default function CommentsPanel({
  timelineItemId,
  timelineItemName,
  onClose,
  onCountChange,
}: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from("timeline_item_comments")
      .select("*")
      .eq("timeline_item_id", timelineItemId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load comments");
      return;
    }
    setComments(data || []);
    onCountChange(timelineItemId, (data || []).length);
    setLoading(false);
  }, [timelineItemId, onCountChange]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    const { data, error } = await supabase
      .from("timeline_item_comments")
      .insert({
        timeline_item_id: timelineItemId,
        content: newComment.trim(),
        author_name: "User",
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add comment");
      return;
    }

    setComments((prev) => [...prev, data]);
    onCountChange(timelineItemId, comments.length + 1);
    setNewComment("");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("timeline_item_comments")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete comment");
      return;
    }

    setComments((prev) => prev.filter((c) => c.id !== id));
    onCountChange(timelineItemId, comments.length - 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-[400px] border-l border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="font-medium truncate">{timelineItemName}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Comments list */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="group">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{comment.author_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), "MMM d, HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-opacity flex-shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a comment..."
            className="min-h-[60px] resize-none"
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!newComment.trim()}
            className="flex-shrink-0 self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
