/**
 * These aliases are provided by Docusaurus at consumer build time.
 *
 * The plugin package compiles in isolation, so we declare lightweight module
 * contracts here to keep local type-checking strict without pulling in full
 * Docusaurus app types.
 */
declare module '@theme-init/MDXComponents' {
  const MDXComponents: Record<string, unknown>;
  export default MDXComponents;
}

declare module '@theme-init/DocItem/Layout' {
  import type { ComponentType, PropsWithChildren } from 'react';

  const Layout: ComponentType<PropsWithChildren<Record<string, unknown>>>;
  export default Layout;
}

declare module '@docusaurus/plugin-content-docs/client' {
  export function useDoc(): {
    frontMatter?: {
      api?: boolean;
      [key: string]: unknown;
    };
    metadata?: {
      examplesByOperation?: Map<string, any[]> | Record<string, any[]>;
      [key: string]: unknown;
    };
  };
}
