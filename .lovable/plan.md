

## Plan: Add sample contracts and invoices to 24 projects

### What
Insert 1-3 contracts and 1-2 invoices per contract for the 24 projects that currently have no contracts. All these projects use EUR currency.

### How
Use the database insert tool to run two SQL statements:

**1. Insert ~45 contracts** across 24 projects with realistic data:
- Contract numbers like `CNT-2026-XXX`
- Dates in Q1-Q2 2026
- Amounts between 30-80% of project budget (split across contracts)
- Mix of statuses: mostly "Ongoing", some "Completed"
- Realistic contractor names (construction/industrial companies)

**2. Insert ~60 invoices** linked to the contracts:
- Invoice numbers like `INV-2026-XXX`
- Amounts as portions of contract value (30-70%)
- 1-2 invoices per contract

### Technical details
- All amounts in EUR (`amount_lc`), `amount_eur` set to same value
- No file changes needed — data-only operation via insert tool

