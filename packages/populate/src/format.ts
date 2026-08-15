export type Row = Readonly<Record<string, string | number | boolean | null>>;

const sqlValue = (v: string | number | boolean | null): string => {
  if (v === null) return 'NULL';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') return String(v);
  return `'${v.replaceAll('\\', '\\\\').replaceAll("'", "''")}'`;
};

export function toSql(table: string, rows: readonly Row[]): string {
  if (rows.length === 0) return '';
  const columns = Object.keys(rows[0] ?? {});

  const lines = rows.map(
    (row) => `  (${columns.map((c) => sqlValue(row[c] ?? null)).join(', ')})`,
  );

  return `INSERT INTO ${table} (${columns.join(', ')}) VALUES\n${lines.join(',\n')};\n`;
}

const csvField = (v: string | number | boolean | null): string => {
  if (v === null) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
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