// Wires the [data-image-tool] block rendered by ToolShell to the conversion
// engine. The target format is read from `data-to`, so every converter page
// reuses this exact script — only the attribute differs.
import { convertImageFile, type TargetFormat } from '../lib/image';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function init(): void {
  const root = document.querySelector<HTMLElement>('[data-image-tool]');
  if (!root) return;

  const to = (root.dataset.to ?? 'jpeg') as TargetFormat;
  const input = root.querySelector<HTMLInputElement>('input[type="file"]');
  const dropzone = root.querySelector<HTMLElement>('[data-dropzone]');
  const results = root.querySelector<HTMLElement>('[data-results]');
  if (!input || !results) return;

  async function handleFiles(files: FileList | null): Promise<void> {
    if (!files || files.length === 0) return;
    results!.innerHTML = '';

    for (const file of Array.from(files)) {
      const row = document.createElement('div');
      row.className =
        'flex items-center justify-between gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm';
      const label = document.createElement('span');
      label.className = 'text-[var(--text-3)]';
      label.textContent = `Converting ${file.name}…`;
      row.appendChild(label);
      results!.appendChild(row);

      try {
        const { blob, filename } = await convertImageFile(file, { to });
        const url = URL.createObjectURL(blob);
        row.innerHTML = '';

        const name = document.createElement('span');
        name.className = 'truncate text-[var(--text-2)]';
        name.textContent = `${filename} · ${formatBytes(blob.size)}`;

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.textContent = 'Download';
        link.className =
          'shrink-0 rounded-md bg-[var(--accent)] px-3 py-1 font-medium text-white hover:bg-[var(--accent-hover)]';

        row.append(name, link);
      } catch (err) {
        row.innerHTML = '';
        label.className = 'text-red-600';
        label.textContent = `Failed: ${file.name} — ${(err as Error).message}`;
        row.appendChild(label);
      }
    }
  }

  input.addEventListener('change', () => void handleFiles(input.files));

  if (dropzone) {
    dropzone.addEventListener('click', () => input.click());

    const activate = (e: Event) => {
      e.preventDefault();
      dropzone.classList.add('border-[var(--accent)]', 'bg-[var(--accent-soft-bg)]');
    };
    const deactivate = (e: Event) => {
      e.preventDefault();
      dropzone.classList.remove('border-[var(--accent)]', 'bg-[var(--accent-soft-bg)]');
    };

    dropzone.addEventListener('dragover', activate);
    dropzone.addEventListener('dragenter', activate);
    dropzone.addEventListener('dragleave', deactivate);
    dropzone.addEventListener('drop', (e) => {
      deactivate(e);
      void handleFiles((e as DragEvent).dataTransfer?.files ?? null);
    });
  }
}

init();
