// Renders ToolShell with Astro's container API. The file input must sit inside
// the dropzone <label> and stay focusable (sr-only, not display:none), so Tab
// reaches it and Space/Enter opens the picker.
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, it, expect } from 'vitest';
import ToolShell from './ToolShell.astro';

describe('ToolShell dropzone', () => {
  it('is a label holding a focusable file input', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ToolShell, { props: { to: 'png' } });

    const label = html.match(/<label([^>]*data-dropzone[^>]*)>([\s\S]*?)<\/label>/);
    expect(label).not.toBeNull();
    const [, attrs, content] = label!;
    expect(content).toMatch(/<input[^>]*type="file"[^>]*class="sr-only"/);
    expect(content).not.toMatch(/<(p|div)\b/); // a label may only hold phrasing content
    expect(attrs).toContain('has-[:focus-visible]:ring-2');
  });
});
