// Client-side JSON engine. Runs entirely in the browser using the native
// JSON parser. Parse errors are allowed to propagate — the SyntaxError message
// includes the position, so the caller can show it to the user.

/** Parse then re-serialise with the given indentation. */
export function formatJson(input: string, indent: number | '\t' = 2): string {
  return JSON.stringify(JSON.parse(input), null, indent);
}

/** Parse then re-serialise with no whitespace — the smallest valid JSON. */
export function minifyJson(input: string): string {
  return JSON.stringify(JSON.parse(input));
}

/** Check whether input is valid JSON without transforming it. */
export function validateJson(input: string): { valid: boolean; error?: string } {
  try {
    JSON.parse(input);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}

/** Serialise one CSV field per RFC 4180: quote it only when it contains a
 *  comma, a double quote, or a line break, and double any inner quotes. */
function csvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Turn one primitive/complex JSON value into its CSV cell text. Primitives
 *  become their plain string form; objects/arrays are JSON.stringify'd. */
function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Convert a JSON array of objects (or a single object, treated as one row) to
 * RFC-4180 CSV. The header is the union of every row's keys in first-seen
 * order; missing keys become empty cells and non-primitive cells are
 * JSON-stringified. Rows are joined with CRLF.
 */
export function jsonToCsv(input: string): string {
  const parsed: unknown = JSON.parse(input);

  let rows: Record<string, unknown>[];
  if (Array.isArray(parsed)) {
    rows = parsed as Record<string, unknown>[];
  } else if (parsed !== null && typeof parsed === 'object') {
    rows = [parsed as Record<string, unknown>];
  } else {
    throw new Error('JSON must be an array of objects or a single object.');
  }

  // Collect the union of keys across all rows, preserving first-seen order.
  const header: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (row === null || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error('Each item in the JSON array must be an object.');
    }
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        header.push(key);
      }
    }
  }

  const lines: string[] = [header.map(csvField).join(',')];
  for (const row of rows) {
    const cells = header.map((key) =>
      Object.prototype.hasOwnProperty.call(row, key) ? csvField(cellText(row[key])) : ''
    );
    lines.push(cells.join(','));
  }
  return lines.join('\r\n');
}

/**
 * Parse RFC-4180 CSV with a state machine: handles quoted fields, escaped `""`
 * inside quotes, commas and line breaks inside quoted fields, and both CRLF and
 * LF line endings. The first row is the header; returns pretty-printed JSON
 * where each subsequent row is an object mapping header → cell (all strings).
 * A trailing newline does not produce an extra blank row.
 */
export function csvToJson(input: string): string {
  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let inQuotes = false;
  let fieldStarted = false; // any char (incl. an opening quote) seen for this field

  const endField = (): void => {
    record.push(field);
    field = '';
    fieldStarted = false;
  };
  const endRecord = (): void => {
    endField();
    records.push(record);
    record = [];
  };

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++; // consume the escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      fieldStarted = true;
    } else if (char === ',') {
      endField();
    } else if (char === '\r') {
      // Treat CRLF (and a lone CR) as one record terminator.
      endRecord();
      if (input[i + 1] === '\n') i++;
    } else if (char === '\n') {
      endRecord();
    } else {
      field += char;
      fieldStarted = true;
    }
  }

  // Flush the final field/record unless the input ended exactly on a newline
  // (in which case there is no trailing partial record to emit).
  if (fieldStarted || field !== '' || record.length > 0) {
    endRecord();
  }

  if (records.length === 0) {
    return JSON.stringify([], null, 2);
  }

  const header = records[0];
  const objects = records.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    header.forEach((key, idx) => {
      obj[key] = cells[idx] ?? '';
    });
    return obj;
  });

  return JSON.stringify(objects, null, 2);
}
