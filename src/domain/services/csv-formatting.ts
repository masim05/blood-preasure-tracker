export type CsvCellValue = string | number | null;

export function formatCsvRow(values: readonly CsvCellValue[]): string {
  return values.map(formatCsvCell).join(',');
}

export function formatCsvCell(value: CsvCellValue): string {
  if (value === null) {
    return '';
  }

  const text = String(value);

  if (!/[",\r\n]/.test(text)) {
    return text;
  }

  return `"${text.replaceAll('"', '""')}"`;
}