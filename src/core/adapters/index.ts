import { DocusaurusAdapter } from './docusaurus/docusaurus-adapter';
import type { Adapter } from './types';
import type { Config } from '../config/schema';

export function createAdapter(config: Config): Adapter {
  switch (config.framework) {
    case 'docusaurus':
      return new DocusaurusAdapter({
        outputDir: config.outputDir,
        typeExpansion: config.typeExpansion,
        ...config.adapters?.docusaurus,
      });
    default:
      throw new Error(`Unsupported framework: ${config.framework}`);
  }
}
