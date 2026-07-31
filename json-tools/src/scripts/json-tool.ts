// Wires the [data-json-tool] block rendered by ToolShell to the JSON engine.
// The mode is read from `data-mode`, so both tool pages reuse this exact
// script — only the attribute (and the optional indent selector) differs.
import { formatJson, minifyJson, validateJson, jsonToCsv, csvToJson } from '../lib/json';

type Mode = 'format' | 'minify' | 'validate' | 'json-to-csv' | 'csv-to-json';

function parseIndent(value: string): number | '\t' {
  return value === 'tab' ? '\t' : Number(value);
}

function init(): void {
  const root = document.querySelector<HTMLElement>('[data-json-tool]');
  if (!root) return;

  const mode = (root.dataset.mode ?? 'format') as Mode;
  const input = root.querySelector<HTMLTextAreaElement>('[data-input]');
  const output = root.querySelector<HTMLElement>('[data-output]');
  const status = root.querySelector<HTMLElement>('[data-status]');
  const runBtn = root.querySelector<HTMLButtonElement>('[data-run]');
  const copyBtn = root.querySelector<HTMLButtonElement>('[data-copy]');
  const downloadBtn = root.querySelector<HTMLButtonElement>('[data-download]');
  const indent = root.querySelector<HTMLSelectElement>('[data-indent]');
  if (!input || !output || !status) return;

  function run(): void {
    const text = input!.value;
    if (text.trim() === '') {
      output!.textContent = '';
      status!.textContent = '';
      return;
    }
    if (mode === 'json-to-csv' || mode === 'csv-to-json') {
      try {
        const result = mode === 'json-to-csv' ? jsonToCsv(text) : csvToJson(text);
        output!.textContent = result;
        status!.textContent = mode === 'json-to-csv' ? 'Converted to CSV' : 'Converted to JSON';
        status!.className = 'mt-2 text-sm text-green-600';
      } catch (err) {
        output!.textContent = '';
        status!.textContent = (err as Error).message;
        status!.className = 'mt-2 text-sm text-red-600';
      }
      return;
    }
    if (mode === 'validate') {
      const result = validateJson(text);
      if (result.valid) {
        output!.textContent = text;
        status!.textContent = 'Valid JSON ✓';
        status!.className = 'mt-2 text-sm text-green-600';
      } else {
        output!.textContent = '';
        status!.textContent = result.error ?? 'Invalid JSON';
        status!.className = 'mt-2 text-sm text-red-600';
      }
      return;
    }

    try {
      const result =
        mode === 'minify'
          ? minifyJson(text)
          : formatJson(text, indent ? parseIndent(indent.value) : 2);
      output!.textContent = result;
      status!.textContent = 'Valid JSON';
      status!.className = 'mt-2 text-sm text-green-600';
    } catch (err) {
      output!.textContent = '';
      status!.textContent = (err as Error).message;
      status!.className = 'mt-2 text-sm text-red-600';
    }
  }

  input.addEventListener('input', run);
  runBtn?.addEventListener('click', run);
  indent?.addEventListener('change', run);

  copyBtn?.addEventListener('click', () => {
    const text = output.textContent ?? '';
    if (text === '') return;
    void navigator.clipboard.writeText(text).then(() => {
      const original = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = original;
      }, 1500);
    });
  });

  downloadBtn?.addEventListener('click', () => {
    const text = output.textContent ?? '';
    if (text === '') return;
    const isCsv = mode === 'json-to-csv';
    const type = isCsv ? 'text/csv' : 'application/json';
    const filename = isCsv ? 'data.csv' : 'data.json';
    const blob = new Blob([text], { type: `${type};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}

init();
