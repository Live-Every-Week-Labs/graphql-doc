import { DocusaurusAdapter } from './docusaurus/docusaurus-adapter.js';
import type { Adapter } from './types.js';
import type { Config } from '../config/schema.js';

export function createAdapter(config: Config): Adapter {
  switch (config.framework) {
    case 'docusaurus':
      return DocusaurusAdapter.fromConfig(config);
    default:
      throw new Error(`Unsupported framework: ${config.framework}`);
  }
}
