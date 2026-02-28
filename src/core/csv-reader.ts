import { parse } from 'csv-parse/sync';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as XLSX from 'xlsx';

export interface CsvReaderOptions {
  skip?: number;
  limit?: number;
}

export function readCsvFile<T extends Record<string, string>>(
  filePath: string,
  options: CsvReaderOptions = {},
): T[] {
  const ext = path.extname(filePath).toLowerCase();
  let rows: T[];

  if (ext === '.xlsx' || ext === '.xls') {
    rows = readExcel<T>(filePath);
  } else {
    rows = readCsv<T>(filePath);
  }

  if (options.skip) {
    rows = rows.slice(options.skip);
  }
  if (options.limit) {
    rows = rows.slice(0, options.limit);
  }

  return rows;
}

function readCsv<T extends Record<string, string>>(filePath: string): T[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  // Remove BOM if present
  const cleaned = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;

  return parse(cleaned, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as T[];
}

function readExcel<T extends Record<string, string>>(filePath: string): T[] {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<T>(sheet, { defval: '' });
}
