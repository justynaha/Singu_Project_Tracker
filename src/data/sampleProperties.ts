// Canonical sample property list — single source of truth for Reports sample data.
// Keep in sync across all Report tabs. Order matters: same row order everywhere.

export interface SampleProperty {
  property: string;
  country: string;
  currency: string; // local currency
}

export const SAMPLE_PROPERTIES: SampleProperty[] = [
  { property: "Mapletree Park Lyon", country: "France", currency: "EUR" },
  { property: "Mapletree Park Schiphol", country: "Netherlands", currency: "EUR" },
  { property: "Mapletree Park Marseille", country: "France", currency: "EUR" },
  { property: "Mapletree Park Piotrków 1", country: "Poland", currency: "PLN" },
  { property: "Mapletree Park Piotrków 2", country: "Poland", currency: "PLN" },
  { property: "Mapletree Park Tilburg", country: "Netherlands", currency: "EUR" },
  { property: "Mapletree Park Szczecin", country: "Poland", currency: "PLN" },
  { property: "Mapletree Park Fogars", country: "Spain", currency: "EUR" },
  { property: "Mapletree Park Sallent", country: "Spain", currency: "EUR" },
  { property: "Mapletree Park Valls", country: "Spain", currency: "EUR" },
];

const byName = new Map(SAMPLE_PROPERTIES.map((p) => [p.property, p]));

export const getPropertyCountry = (name: string): string =>
  byName.get(name)?.country ?? "Other";

export const getPropertyCurrency = (name: string): string =>
  byName.get(name)?.currency ?? "EUR";
