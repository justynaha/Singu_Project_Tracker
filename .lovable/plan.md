

## Plan: Comments and Files columns — side panel behavior (like reference project)

### Overview
Replace the current inline editable text for **Comments** and static file count for **Files** with clickable cells that open side panels, matching [Project Tracker Base](/projects/58776ceb-2a8f-4fe6-95c8-e3cece811f67). The **Responsible** column stays as editable text (current project has no contributors system).

### What changes

**Comments column**: Instead of inline text editing, clicking shows a count badge (MessageSquare icon + number). Clicking opens a slide-out panel on the right where users can add, edit, and delete threaded comments per timeline item.

**Files column**: Instead of a static count, clicking shows a count badge (FileText icon + number). Clicking opens a slide-out panel where users can upload, preview, download, and delete files attached to that specific timeline item.

### Database Migration
Create `timeline_item_comments` table:
```sql
CREATE TABLE public.timeline_item_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timeline_item_id UUID NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'User',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  visibility TEXT NOT NULL DEFAULT 'private'
);
ALTER TABLE public.timeline_item_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.timeline_item_comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.timeline_item_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.timeline_item_comments FOR DELETE USING (true);
CREATE POLICY "Allow public update" ON public.timeline_item_comments FOR UPDATE USING (true);
CREATE INDEX idx_tic_item_id ON public.timeline_item_comments(timeline_item_id);
```

Create `project-files` storage bucket (for file uploads per timeline item):
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', true);
CREATE POLICY "Allow public upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'project-files');
CREATE POLICY "Allow public read" ON storage.objects FOR SELECT USING (bucket_id = 'project-files');
CREATE POLICY "Allow public delete" ON storage.objects FOR DELETE USING (bucket_id = 'project-files');
```

### New Components
1. **`CommentsPanel.tsx`** — Side panel (400px wide, right side) with:
   - Header with item name + close button
   - Scrollable comment list with author, timestamp, content
   - Edit/delete per comment
   - Text input + send button at bottom
   - Fetches from `timeline_item_comments` table

2. **`FilesPanel.tsx`** — Side panel (400px wide, right side) with:
   - Header with item name + close button
   - File list with icon/thumbnail, name, size, date
   - Download + delete buttons per file
   - Upload button at bottom (uploads to `project-files` bucket, inserts into `project_files` table)
   - Image preview inline

### Changes to `ProjectDetail.tsx`
- Add state for comment/file counts, panel open/close, selected item
- Fetch initial counts from `timeline_item_comments` and `project_files` on load
- Pass `commentCounts`, `fileCounts`, `onOpenComments`, `onOpenFiles` to `TimelineV2Tab`
- Render `CommentsPanel` and `FilesPanel` conditionally alongside main content

### Changes to `TimelineV2Tab.tsx`
- Add props: `commentCounts`, `fileCounts`, `onOpenComments`, `onOpenFiles`
- Replace `case "comments"` — show MessageSquare icon + count, onClick calls `onOpenComments(item)`
- Replace `case "files"` — show FileText icon + count, onClick calls `onOpenFiles(item)`
- Remove `handleCommentsChange` (no longer inline editing)
- Remove `comments` field from the `timeline_items` table usage (keep DB column, just not used inline)

### Files to create
- `src/components/project-detail/CommentsPanel.tsx`
- `src/components/project-detail/FilesPanel.tsx`

### Files to edit
- `src/pages/ProjectDetail.tsx`
- `src/components/project-detail/TimelineV2Tab.tsx`

### Technical details
- Side panels render as siblings to the main content area, pushing or overlaying from the right
- Comment counts and file counts are fetched once on load, then updated via callbacks when panels add/delete items
- The `comments` column in `timeline_items` table remains but is no longer used for inline editing

