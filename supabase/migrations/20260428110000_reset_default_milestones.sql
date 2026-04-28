-- Reset milestones for all existing projects to the new default set.
-- Cleans up cashflow rows attached to old milestones, then deletes existing milestones,
-- and finally inserts the four new default milestones per project.

DELETE FROM public.milestone_cashflow
WHERE timeline_item_id IN (
  SELECT id FROM public.timeline_items WHERE type = 'milestone'
);

-- Detach any tasks that were nested under milestones (so they aren't orphaned by FK constraints).
UPDATE public.timeline_items
SET parent_id = NULL
WHERE parent_id IN (
  SELECT id FROM public.timeline_items WHERE type = 'milestone'
);

DELETE FROM public.timeline_items WHERE type = 'milestone';

INSERT INTO public.timeline_items (project_id, name, type, status, sort_order)
SELECT p.id, m.name, 'milestone', 'not-started', m.sort_order
FROM public.projects p
CROSS JOIN (
  VALUES
    ('Preparation start', 0),
    ('Tendering start', 1),
    ('Works on site start', 2),
    ('Works completed', 3)
) AS m(name, sort_order);
