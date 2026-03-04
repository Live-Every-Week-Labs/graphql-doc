import { defineConfig } from 'tsup';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const packageJson = require('./package.json') as { version: string };

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      cli: 'src/cli/index.ts',
      'components/index': 'src/components/index.ts',
      'components/docusaurus': 'src/components/docusaurus.ts',
      'docusaurus-plugin': 'src/core/adapters/docusaurus/plugin/index.ts',
      // Ship runtime-safe theme wrappers as plain JS for consumer Docusaurus sites.
      'theme/DocItem/Layout/index': 'src/core/adapters/docusaurus/theme/DocItem/Layout/index.tsx',
    },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    target: 'node18',
    external: [
      'react',
      'react-dom',
      '@lewl/graphql-doc/components',
      '@theme-init/DocItem/Layout',
      '@theme-init/MDXComponents',
      '@docusaurus/plugin-content-docs/client',
    ],
    define: {
      __PKG_VERSION__: JSON.stringify(packageJson.version),
    },
    esbuildOptions(options) {
      options.jsx = 'automatic';
    },
  },
]);
