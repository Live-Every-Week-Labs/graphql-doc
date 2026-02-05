import path from 'path';
import { DocusaurusAdapter } from './docusaurus/docusaurus-adapter';
import type { Adapter } from './types';
import type { Config } from '../config/schema';

const inferLlmDocsBasePath = (outputDir: string) => {
  const normalized = outputDir.replace(/\\/g, '/');
  const marker = '/static/';
  const idx = normalized.lastIndexOf(marker);
  const segment =
    idx !== -1
      ? normalized.slice(idx + marker.length)
      : path.posix.basename(normalized.replace(/\/+$/g, ''));
  return `/${segment.replace(/^\/+|\/+$/g, '')}`;
};

export function createAdapter(config: Config): Adapter {
  switch (config.framework) {
    case 'docusaurus': {
      const docusaurusConfig = {
        ...config.adapters?.docusaurus,
      };
      if (!docusaurusConfig.llmDocsBasePath && config.llmDocs?.enabled) {
        docusaurusConfig.llmDocsBasePath = inferLlmDocsBasePath(config.llmDocs.outputDir);
      }
      return new DocusaurusAdapter({
        outputDir: config.outputDir,
        typeExpansion: config.typeExpansion,
        ...docusaurusConfig,
      });
    }
    default:
      throw new Error(`Unsupported framework: ${config.framework}`);
  }
}
