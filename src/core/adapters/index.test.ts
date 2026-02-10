import { describe, it, expect } from 'vitest';
import { createAdapter } from './index.js';
import { DocusaurusAdapter } from './docusaurus/docusaurus-adapter.js';
import { createTestConfig } from '../../test/test-utils.js';

describe('createAdapter', () => {
  it('returns a DocusaurusAdapter when framework is docusaurus', () => {
    const config = createTestConfig({ framework: 'docusaurus' });
    const adapter = createAdapter(config);
    expect(adapter).toBeInstanceOf(DocusaurusAdapter);
  });

  it('returns a DocusaurusAdapter for the default framework', () => {
    const config = createTestConfig();
    const adapter = createAdapter(config);
    expect(adapter).toBeInstanceOf(DocusaurusAdapter);
  });

  it('throws for an unknown framework name', () => {
    const config = createTestConfig();
    // Force an unsupported framework value to exercise the default branch
    (config as Record<string, unknown>).framework = 'hugo';
    expect(() => createAdapter(config)).toThrow('Unsupported framework: hugo');
  });
});
