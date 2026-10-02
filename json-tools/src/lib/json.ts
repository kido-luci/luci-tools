// Client-side JSON engine. Runs entirely in the browser using the native
// JSON parser. Parse errors are allowed to propagate — the SyntaxError message
// includes the position, so the caller can show it to the user.

/**
 * Split JSON that JSON.parse has already accepted into its tokens: every
 * string (escapes included), number and literal exactly as written, plus the
 * structural characters; the whitespace between tokens is dropped. A plain
 * loop rather than a regex, so a huge string can't overflow the regex stack.
 */
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') continue;
    if ('{}[]:,'.includes(ch)) {
      tokens.push(ch);
      continue;
    }
    let end = i + 1;
    if (ch === '"') {
      while (end < input.length && input[end] !== '"') end += input[end] === '\\' ? 2 : 1;
      end++;
    } else {
      while (end < input.length && !' \t\n\r,]}'.includes(input[end])) end++;
    }
    tokens.push(input.slice(i, end));
    i = end - 1;
  }
  return tokens;
}

/**
 * Lay tokens out in JSON.stringify's style with `gap` as one indent level
 * ('' = no whitespace at all). Iterative, so nesting depth is limited only by
 * JSON.parse, never by the call stack.
 */
function layout(tokens: string[], gap: string): string {
  const newline = gap === '' ? '' : '\n';
  let out = '';
  let depth = 0;
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok === '{' || tok === '[') {
      const next = tokens[i + 1];
      if (next === '}' || next === ']') {
        out += tok + next; // an empty container stays on one line
        i++;
      } else {
        depth++;
        out += tok + newline + gap.repeat(depth);
      }
    } else if (tok === '}' || tok === ']') {
      depth--;
      out += newline + gap.repeat(depth) + tok;
    } else if (tok === ',') {
      out += ',' + newline + gap.repeat(depth);
    } else if (tok === ':') {
      out += gap === '' ? ':' : ': ';
    } else {
      out += tok;
    }
  }
  return out;
}

/**
 * Validate, then re-indent the input's own tokens: strings, numbers, key
 * order and duplicate keys stay exactly as written — only whitespace changes.
 * (Re-serialising the parsed value would round big numbers, turn 1e400 into
 * null, move integer-like keys first and drop duplicate keys.)
 */
export function formatJson(input: string, indent: number | '\t' = 2): string {
  JSON.parse(input); // validation only: throws a SyntaxError with the position
  // A number indent means 0–10 spaces, as in JSON.stringify.
  const gap = indent === '\t' ? '\t' : ' '.repeat(Math.max(0, Math.min(10, indent)));
  return layout(tokenize(input), gap);
}

/** Validate, then drop all insignificant whitespace; values stay as written. */
export function minifyJson(input: string): string {
  JSON.parse(input); // validation only: throws a SyntaxError with the position
  return layout(tokenize(input), '');
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

/** Turn one JSON value, given as its tokens, into its CSV cell text. Strings
 *  are unescaped, null is empty, numbers and booleans stay as written, and
 *  objects/arrays become their compact JSON text. */
function cellText(tokens: string[]): string {
  if (tokens.length > 1) return tokens.join('');
  const [tok] = tokens;
  if (tok === 'null') return '';
  return tok[0] === '"' ? (JSON.parse(tok) as string) : tok;
}

/**
 * Read the rows of a validated object, or array of objects, from its tokens:
 * each row maps its keys, in written order, to cell text. A repeated key keeps
 * its first position and its last value, as JSON.parse does.
 */
function tokenRows(tokens: string[]): Map<string, string>[] {
  const rows: Map<string, string>[] = [];
  let i = tokens[0] === '[' ? 1 : 0;
  while (tokens[i] === '{') {
    const row = new Map<string, string>();
    i++; // past '{'
    while (tokens[i] !== '}') {
      const key = JSON.parse(tokens[i]) as string;
      const start = i + 2; // past the key and ':'
      let end = start;
      let depth = 0;
      do {
        const tok = tokens[end++];
        if (tok === '{' || tok === '[') depth++;
        else if (tok === '}' || tok === ']') depth--;
      } while (depth > 0);
      row.set(key, cellText(tokens.slice(start, end)));
      i = tokens[end] === ',' ? end + 1 : end;
    }
    rows.push(row);
    i++; // past '}'
    if (tokens[i] === ',') i++;
  }
  return rows;
}

/**
 * Convert a JSON array of objects (or a single object, treated as one row) to
 * RFC-4180 CSV. The header is the union of every row's keys in first-seen
 * order; missing keys become empty cells and non-primitive cells are their
 * compact JSON text. Numbers are copied exactly as written. Rows are joined
 * with CRLF.
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

  for (const row of rows) {
    if (row === null || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error('Each item in the JSON array must be an object.');
    }
  }

  // Cells come from the input's own tokens, not the parsed values, so number
  // literals such as big integers or 1e400 reach the CSV unchanged.
  const cellRows = tokenRows(tokenize(input));

  // Collect the union of keys across all rows, preserving first-seen order.
  const header: string[] = [];
  const seen = new Set<string>();
  for (const row of cellRows) {
    for (const key of row.keys()) {
      if (!seen.has(key)) {
        seen.add(key);
        header.push(key);
      }
    }
  }

  const lines: string[] = [header.map(csvField).join(',')];
  for (const row of cellRows) {
    const cells = header.map((key) => csvField(row.get(key) ?? ''));
    lines.push(cells.join(','));
  }
  return lines.join('\r\n');
}

/**
 * Parse RFC-4180 CSV with a state machine: handles quoted fields, escaped `""`
 * inside quotes, commas and line breaks inside quoted fields, and both CRLF and
 * LF line endings. The first row is the header; returns pretty-printed JSON
 * where each subsequent row is an object mapping header → cell (all strings).
 * A trailing newline does not produce an extra blank row. A quote opens a
 * quoted field only where nothing but spaces or tabs (which are kept) precede
 * it in the field; anywhere else it is a literal character (lenient RFC 4180),
 * so `12" large` stays one value instead of swallowing the rows after it.
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

    if (char === '"' && /^[ \t]*$/.test(field)) {
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
