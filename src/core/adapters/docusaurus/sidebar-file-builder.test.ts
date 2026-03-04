import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildSidebarFiles } from './sidebar-file-builder';
import { SidebarItem } from './sidebar-generator';

const sidebarItems: SidebarItem[] = [{ type: 'doc', id: 'api/ping', label: 'ping' }];
const tempDirs: string[] = [];

const createTempDir = (): string => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gql-sidebar-builder-'));
  tempDirs.push(tempDir);
  return tempDir;
};

describe('sidebar-file-builder', () => {
  afterEach(() => {
    for (const tempDir of tempDirs.splice(0, tempDirs.length)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('merges sidebars for esm files exporting a named variable', () => {
    const outputDir = createTempDir();
    fs.writeFileSync(
      path.join(outputDir, 'sidebars.js'),
      `const sidebars = { docs: [{ type: 'doc', id: 'intro' }] };\nexport default sidebars;\n`,
      'utf-8'
    );

    const files = buildSidebarFiles(sidebarItems, { outputDir, sidebarMerge: true });
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('sidebars.js');
    expect(files[0].content).toContain('export default sidebars;');
    expect(files[0].content).toContain('// <graphql-doc-sidebar>');
    expect(files[0].content).toContain('sidebars[__gqlDocsTargetKey] = __gqlDocsMerge(');
  });

  it('merges sidebars for esm files exporting an object literal', () => {
    const outputDir = createTempDir();
    fs.writeFileSync(
      path.join(outputDir, 'sidebars.js'),
      `export default {\n  docs: [{ type: 'doc', id: 'intro' }],\n};\n`,
      'utf-8'
    );

    const files = buildSidebarFiles(sidebarItems, { outputDir, sidebarMerge: true });
    expect(files).toHaveLength(1);
    expect(files[0].content).toContain('const __gqlSidebars = {');
    expect(files[0].content).toContain('export default __gqlSidebars;');
    expect(files[0].content).toContain('__gqlSidebars[__gqlDocsTargetKey] = __gqlDocsMerge(');
  });

  it('merges sidebars for cjs files using module.exports', () => {
    const outputDir = createTempDir();
    fs.writeFileSync(
      path.join(outputDir, 'sidebars.js'),
      `module.exports = { docs: [{ type: 'doc', id: 'intro' }] };\n`,
      'utf-8'
    );

    const files = buildSidebarFiles(sidebarItems, { outputDir, sidebarMerge: true });
    expect(files).toHaveLength(1);
    expect(files[0].content).toContain('module.exports[__gqlDocsTargetKey] = __gqlDocsMerge(');
    expect(files[0].content).toContain('// <graphql-doc-sidebar>');
  });

  it('merges JSON sidebars by target key', () => {
    const outputDir = createTempDir();
    fs.writeFileSync(
      path.join(outputDir, 'versioned-sidebars.json'),
      JSON.stringify(
        {
          apiSidebar: [{ type: 'doc', id: 'intro', label: 'Intro' }],
        },
        null,
        2
      ),
      'utf-8'
    );

    const files = buildSidebarFiles(sidebarItems, {
      outputDir,
      sidebarFile: 'versioned-sidebars.json',
      sidebarFormat: 'json',
      sidebarTarget: 'apiSidebar',
      sidebarMerge: true,
      sidebarInsertPosition: 'append',
    });

    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('versioned-sidebars.json');
    expect(files[0].type).toBe('json');
    const parsed = JSON.parse(files[0].content) as { apiSidebar: SidebarItem[] };
    expect(parsed.apiSidebar).toEqual([
      { type: 'doc', id: 'intro', label: 'Intro' },
      { type: 'doc', id: 'api/ping', label: 'ping' },
    ]);
  });

  it('infers JSON sidebars format from a .json sidebar file path', () => {
    const outputDir = createTempDir();
    const files = buildSidebarFiles(sidebarItems, {
      outputDir,
      sidebarFile: 'versioned-sidebars.json',
      sidebarTarget: 'apiSidebar',
      sidebarMerge: false,
    });

    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('versioned-sidebars.json');
    expect(files[0].type).toBe('json');
    expect(JSON.parse(files[0].content)).toEqual({
      apiSidebar: sidebarItems,
    });
  });

  it('falls back to rewriting JSON when existing content is invalid', () => {
    const outputDir = createTempDir();
    fs.writeFileSync(path.join(outputDir, 'sidebars.json'), '{ invalid json', 'utf-8');

    const files = buildSidebarFiles(sidebarItems, {
      outputDir,
      sidebarFormat: 'json',
      sidebarTarget: 'apiSidebar',
      sidebarMerge: true,
    });

    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('sidebars.json');
    expect(files[0].type).toBe('json');
    expect(JSON.parse(files[0].content)).toEqual({
      apiSidebar: sidebarItems,
    });
  });
});
