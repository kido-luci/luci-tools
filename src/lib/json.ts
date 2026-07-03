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
