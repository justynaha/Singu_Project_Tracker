
## Plan: Seed Work Categories from Screenshot

Insert the following 8 work categories into the `project_types` table via a database migration:

1. LIFE SAFETY & FIRE PROTECTION SYSTEMS
2. STRUCTURAL FRAME & BUILDING ENVELOPE
3. HEATING, VENTILATION & AIR CONDITIONING (HVAC)
4. ESG
5. SITE
6. MECHANICAL & ELECTRICAL SYSTEMS
7. ELECTRICAL SYSTEMS
8. INTERIOR ELEMENTS, EQUIPMENT

### Technical Details
- Single SQL migration with 8 `INSERT` statements into `project_types`
- All entries: top-level (no `parent_id`), status `active`, no description or template
