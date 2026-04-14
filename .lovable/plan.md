

## Plan: Seed Logistics Projects with Plans, Contracts, and Invoices

### Overview
Insert ~20 logistics-specific projects (3-6 per country: Poland, Hungary, Spain, Italy) with project plans (milestones + tasks), contracts, and invoices using a seed script executed via `code--exec`.

### Data Structure

**Projects** (~20 total, distributed across sites):
- Poland (6): Bedzin, Blonie 2, Gdańsk-Airport, Nadarzyn, Piotrków 1, Szczecin
- Hungary (4): Százhalombatta, Üllő, Fogars
- Spain (4): Les Franqueses, Sallent, Valls
- Italy (3): Bologna Castel San Pietro

Logistics-specific project names like: "Dock Leveler Replacement", "Automated Sorting Line Installation", "Loading Bay LED Upgrade", "Forklift Charging Station Expansion", "Warehouse Fire Suppression System", "Cold Storage Unit Retrofit", "Conveyor Belt Modernization", "Truck Parking Area Resurfacing", etc.

**Per project:**
- 5-6 milestones (e.g. Design, Procurement, Installation, Testing, Handover) with `include_in_cashflow=true`
- 0-4 tasks under each milestone
- `milestone_cashflow` records for each milestone
- 1-3 contracts with contractor names, amounts
- 0-3 invoices per contract

### Technical Details
- Script will use `psql` to insert data via SQL
- Projects will have `budget_line`, `fiscal_year`, `currency` (PLN for Poland, HUF for Hungary, EUR for Spain/Italy), `status` varied across Open/In Progress/Completed
- Timeline items: milestones with start/end dates spread across 2025-2026
- Contracts: realistic contractor names, amounts in local currency
- All IDs generated via `gen_random_uuid()`

### Files
- No codebase changes — data insertion only via SQL script

