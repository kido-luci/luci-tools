// Wires the [data-pdf-tool] block rendered by ToolShell to the PDF engine. The
// operation is read from `data-mode`, so both tool pages reuse this exact
// script — only the attribute differs.
import { mergePdfs, imagesToPdf, rotatePdf, splitPdf } from '../lib/pdf';

type Mode = 'merge' | 'images' | 'rotate' | 'split';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function init(): void {
  const root = document.querySelector<HTMLElement>('[data-pdf-tool]');
  if (!root) return;

  const mode = (root.dataset.mode ?? 'merge') as Mode;
  const input = root.querySelector<HTMLInputElement>('input[type="file"]');
  const dropzone = root.querySelector<HTMLElement>('[data-dropzone]');
  const fileList = root.querySelector<HTMLElement>('[data-files]');
  const action = root.querySelector<HTMLButtonElement>('[data-action]');
  const results = root.querySelector<HTMLElement>('[data-results]');
  const status = root.querySelector<HTMLElement>('[data-status]');
  const rotateSelect = root.querySelector<HTMLSelectElement>('[data-rotate-degrees]');
  if (!input || !fileList || !action || !results || !status) return;

  // Rotate & split operate on a single file; merge & images queue several.
  const single = mode === 'rotate' || mode === 'split';

  // Files accumulate across multiple picks/drops in user-visible order.
  let files: File[] = [];

  // Merge needs at least two PDFs; every other tool needs at least one.
  const minFiles = mode === 'merge' ? 2 : 1;

  function refresh(): void {
    fileList!.innerHTML = '';
    files.forEach((file, i) => {
      const row = document.createElement('div');
      row.className =
        'flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm';

      const name = document.createElement('span');
      name.className = 'truncate text-slate-700';
      name.textContent = `${file.name} · ${formatBytes(file.size)}`;

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'shrink-0 text-slate-400 hover:text-red-600';
      remove.textContent = 'Remove';
      remove.addEventListener('click', () => {
        files.splice(i, 1);
        refresh();
      });

      row.append(name, remove);
      fileList!.appendChild(row);
    });

    action!.disabled = files.length < minFiles;
    results!.innerHTML = '';
    status!.textContent = '';
  }

  function addFiles(list: FileList | null): void {
    if (!list || list.length === 0) return;
    // Single-file tools keep only the most recent pick; others accumulate.
    files = single ? [Array.from(list).at(-1)!] : files.concat(Array.from(list));
    refresh();
  }

  input.addEventListener('change', () => {
    addFiles(input.files);
    input.value = ''; // allow re-picking the same file
  });

  action.addEventListener('click', async () => {
    if (files.length < minFiles) return;
    action.disabled = true;
    results.innerHTML = '';
    status.className = 'mt-4 text-sm text-slate-500';
    status.textContent = 'Processing…';

    function offerDownload(blob: Blob, filename: string, label: string): void {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.textContent = `${label} · ${formatBytes(blob.size)}`;
      link.className =
        'inline-block rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark';
      results!.appendChild(link);
    }

    function baseName(name: string): string {
      return name.replace(/\.pdf$/i, '');
    }

    try {
      if (mode === 'split') {
        // Split returns one PDF per page; zip them into a single download.
        const parts = await splitPdf(files[0]);
        const { default: JSZip } = await import('jszip');
        const zip = new JSZip();
        for (const part of parts) zip.file(part.name, part.blob);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        offerDownload(zipBlob, `${baseName(files[0].name)}-pages.zip`, `Download ZIP (${parts.length} pages)`);
      } else if (mode === 'rotate') {
        const deg = Number(rotateSelect?.value ?? 90) as 90 | 180 | 270;
        const blob = await rotatePdf(files[0], deg);
        offerDownload(blob, `${baseName(files[0].name)}-rotated.pdf`, 'Download PDF');
      } else {
        const blob = mode === 'merge' ? await mergePdfs(files) : await imagesToPdf(files);
        offerDownload(blob, mode === 'merge' ? 'merged.pdf' : 'images.pdf', 'Download PDF');
      }

      status.textContent = 'Done.';
    } catch (err) {
      status.className = 'mt-4 text-sm text-red-600';
      status.textContent = `Failed: ${(err as Error).message}`;
    } finally {
      action.disabled = files.length < minFiles;
    }
  });

  if (dropzone) {
    dropzone.addEventListener('click', () => input.click());

    const activate = (e: Event) => {
      e.preventDefault();
      dropzone.classList.add('border-brand', 'bg-brand-tint');
    };
    const deactivate = (e: Event) => {
      e.preventDefault();
      dropzone.classList.remove('border-brand', 'bg-brand-tint');
    };

    dropzone.addEventListener('dragover', activate);
    dropzone.addEventListener('dragenter', activate);
    dropzone.addEventListener('dragleave', deactivate);
    dropzone.addEventListener('drop', (e) => {
      deactivate(e);
      addFiles((e as DragEvent).dataTransfer?.files ?? null);
    });
  }
}

init();
