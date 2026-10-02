/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// getViteConfig adds Astro's Vite plugins so tests can render .astro components
// with the container API.
export default getViteConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**'],
      reporter: ['text', 'json-summary'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
