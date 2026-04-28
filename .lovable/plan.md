## Goal

Ensure every existing project has exactly these 4 milestones, in this order:
1. Preparation start
2. Tendering start
3. Works on site start
4. Works completed

## Approach

Run a data operation (via the insert/update tool) that:

1. Detaches any tasks currently nested under a milestone by setting `timeline_items.parent_id = NULL` where the parent is a milestone (preserves tasks).
2. Deletes related `milestone_cashflow` rows for existing milestones (avoids orphans).
3. Deletes all rows in `timeline_items` where `type = 'milestone'`.
4. Inserts the 4 milestones for every project via `INSERT ... SELECT ... CROSS JOIN`, with `sort_order` 0–3 and `status = 'not-started'`.

## Notes

- Tasks remain in the project but become unparented (top-level) — same behavior as the prior reset.
- No schema changes; no code changes. Frontend already uses these 4 as defaults for new projects.
