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
    },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    target: 'node18',
    external: ['react', 'react-dom'],
    define: {
      __PKG_VERSION__: JSON.stringify(packageJson.version),
    },
    esbuildOptions(options) {
      options.jsx = 'automatic';
    },
  },
]);
