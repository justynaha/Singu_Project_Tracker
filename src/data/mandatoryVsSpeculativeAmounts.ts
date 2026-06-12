// Shared amounts for Mandatory v Speculative reports (per-property and by-country aggregations).
// Single source of truth — used by both detail and country-aggregated tabs.

export interface MandSpecAmounts {
  mandBudget: number;
  specBudget: number;
  mandContracted: number;
  specContracted: number;
}

export const MAND_SPEC_AMOUNTS: Record<string, MandSpecAmounts> = {
  "Verdant Parks Park Lyon": { mandBudget: 725000, specBudget: 0, mandContracted: 0, specContracted: 0 },
  "Verdant Parks Park Schiphol": { mandBudget: 105839, specBudget: 0, mandContracted: 105839, specContracted: 0 },
  "Verdant Parks Park Marseille": { mandBudget: 650000, specBudget: 0, mandContracted: 0, specContracted: 0 },
  "Verdant Parks Park Piotrków 1": { mandBudget: 2326, specBudget: 0, mandContracted: 2326, specContracted: 0 },
  "Verdant Parks Park Piotrków 2": { mandBudget: 1163, specBudget: 0, mandContracted: 6395, specContracted: 0 },
  "Verdant Parks Park Tilburg": { mandBudget: 42399, specBudget: 0, mandContracted: 42399, specContracted: 0 },
  "Verdant Parks Park Szczecin": { mandBudget: 465, specBudget: 0, mandContracted: 465, specContracted: 0 },
  "Verdant Parks Park Fogars": { mandBudget: 2332908, specBudget: 0, mandContracted: 130710, specContracted: 0 },
  "Verdant Parks Park Sallent": { mandBudget: 3220614, specBudget: 0, mandContracted: 73144, specContracted: 0 },
  "Verdant Parks Park Valls": { mandBudget: 0, specBudget: 0, mandContracted: 0, specContracted: 0 },
};

export const ZERO_AMOUNTS: MandSpecAmounts = {
  mandBudget: 0,
  specBudget: 0,
  mandContracted: 0,
  specContracted: 0,
};