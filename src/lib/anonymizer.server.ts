// Server-only PII detection + tokenization.
// Stateless: returns the anonymized text + the token map.
// The extension stores the map locally and sends it back for deanonymization.

type Patterns = { name: string; regex: RegExp }[];

const PATTERNS: Patterns = [
  { name: "EMAIL", regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  // French phone numbers (loose)
  { name: "PHONE", regex: /\b(?:\+?33|0)[\s.-]?[1-9](?:[\s.-]?\d{2}){4}\b/g },
  // International / generic
  { name: "PHONE_INTL", regex: /\b\+?\d{1,3}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/g },
  // IBAN (FR + generic)
  { name: "IBAN", regex: /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g },
  // Credit card (13–19 digits with optional spaces/dashes)
  { name: "CC", regex: /\b(?:\d[ -]*?){13,19}\b/g },
  // French SIRET / SIREN
  { name: "SIRET", regex: /\b\d{14}\b/g },
  { name: "SIREN", regex: /\b\d{9}\b/g },
  // IPv4
  { name: "IP", regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
  // URLs
  { name: "URL", regex: /\bhttps?:\/\/[^\s]+/g },
];

export function anonymize(text: string): { anonymized: string; map: Record<string, string> } {
  let output = text;
  const map: Record<string, string> = {};

  // Track counters per type to generate [EMAIL_1], [EMAIL_2], etc.
  const counters: Record<string, number> = {};

  for (const { name, regex } of PATTERNS) {
    output = output.replace(regex, (match) => {
      // Reuse token if same value already replaced
      const existing = Object.entries(map).find(([, v]) => v === match);
      if (existing) return existing[0];

      counters[name] = (counters[name] ?? 0) + 1;
      const token = `[${name}_${counters[name]}]`;
      map[token] = match;
      return token;
    });
  }

  return { anonymized: output, map };
}

export function deanonymize(text: string, map: Record<string, string>): string {
  let output = text;
  // Replace longer tokens first to avoid partial overlaps
  const tokens = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const token of tokens) {
    output = output.split(token).join(map[token]);
  }
  return output;
}
