export type Row = Readonly<Record<string, string | number | boolean | null>>;

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/;

export class UnsafeIdentifierError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafeIdentifierError';
  }
}

const assertIdentifier = (value: string, what: string): string => {
  if (!IDENTIFIER.test(value)) {
    throw new UnsafeIdentifierError(
      `${what} must match ${IDENTIFIER.source}, got: ${value}`,
    );
  }
  return value;
};

const sqlValue = (v: string | number | boolean | null): string => {
  if (v === null) return 'NULL';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') return String(v);
  return `'${v.replaceAll('\\', '\\\\').replaceAll("'", "''")}'`;
};

export function toSql(table: string, rows: readonly Row[]): string {
  if (rows.length === 0) return '';

  const safeTable = assertIdentifier(table, 'table name');
  const columns = Object.keys(rows[0] ?? {}).map((c) =>
    assertIdentifier(c, 'column name'),
  );

  const lines = rows.map(
    (row) => `  (${columns.map((c) => sqlValue(row[c] ?? null)).join(', ')})`,
  );

  return `INSERT INTO ${safeTable} (${columns.join(', ')}) VALUES\n${lines.join(',\n')};\n`;
}

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

const csvField = (v: string | number | boolean | null): string => {
  if (v === null) return '';
  const s = String(v);
  const safe = FORMULA_PREFIX.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
};

export function toCsv(rows: readonly Row[]): string {
  if (rows.length === 0) return '';
  const columns = Object.keys(rows[0] ?? {});
  const header = columns.join(',');
  const body = rows.map((row) => columns.map((c) => csvField(row[c] ?? null)).join(','));
  return `${header}\n${body.join('\n')}\n`;
}

export const toNdjson = (rows: readonly Row[]): string =>
  `${rows.map((r) => JSON.stringify(r)).join('\n')}\n`;