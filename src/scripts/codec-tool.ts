// Wires the [data-codec-tool] block rendered by CodecTool to the codec
// engine. The operation is read from `data-op`, so every tool page reuses
// this exact script — only the attribute differs.
import {
  base64Encode,
  base64Decode,
  urlEncode,
  urlDecode,
  htmlEntityEncode,
  htmlEntityDecode,
  jwtDecode,
} from '../lib/codec';

type CodecOp =
  | 'base64-encode'
  | 'base64-decode'
  | 'url-encode'
  | 'url-decode'
  | 'html-entity-encode'
  | 'html-entity-decode'
  | 'jwt-decode';

function init(): void {
  const root = document.querySelector<HTMLElement>('[data-codec-tool]');
  if (!root) return;

  const op = (root.dataset.op ?? 'base64-encode') as CodecOp;
  const input = root.querySelector<HTMLTextAreaElement>('[data-input]');
  const errorBox = root.querySelector<HTMLElement>('[data-error]');
  if (!input || !errorBox) return;

  const isJwt = op === 'jwt-decode';
  const outputEl = root.querySelector<HTMLTextAreaElement>('textarea[data-output="output"]');
  const headerEl = root.querySelector<HTMLElement>('code[data-output="header"]');
  const payloadEl = root.querySelector<HTMLElement>('code[data-output="payload"]');

  function showError(message: string): void {
    errorBox!.textContent = message;
    errorBox!.classList.remove('hidden');
  }

  function clearError(): void {
    errorBox!.textContent = '';
    errorBox!.classList.add('hidden');
  }

  function run(): void {
    const text = input!.value;

    if (text === '') {
      clearError();
      if (outputEl) outputEl.value = '';
      if (headerEl) headerEl.textContent = '';
      if (payloadEl) payloadEl.textContent = '';
      return;
    }

    try {
      if (isJwt) {
        const { header, payload } = jwtDecode(text);
        if (headerEl) headerEl.textContent = JSON.stringify(header, null, 2);
        if (payloadEl) payloadEl.textContent = JSON.stringify(payload, null, 2);
      } else if (outputEl) {
        let result: string;
        switch (op) {
          case 'base64-encode':
            result = base64Encode(text);
            break;
          case 'base64-decode':
            result = base64Decode(text);
            break;
          case 'url-encode':
            result = urlEncode(text);
            break;
          case 'url-decode':
            result = urlDecode(text);
            break;
          case 'html-entity-encode':
            result = htmlEntityEncode(text);
            break;
          case 'html-entity-decode':
            result = htmlEntityDecode(text);
            break;
          default:
            result = '';
        }
        outputEl.value = result;
      }
      clearError();
    } catch (err) {
      showError((err as Error).message);
      if (outputEl) outputEl.value = '';
      if (headerEl) headerEl.textContent = '';
      if (payloadEl) payloadEl.textContent = '';
    }
  }

  input.addEventListener('input', run);

  root.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.copy;
      const text =
        target === 'header'
          ? (headerEl?.textContent ?? '')
          : target === 'payload'
            ? (payloadEl?.textContent ?? '')
            : (outputEl?.value ?? '');
      if (!text) return;
      void navigator.clipboard.writeText(text).then(() => {
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
          btn.textContent = original;
        }, 1500);
      });
    });
  });
}

init();
