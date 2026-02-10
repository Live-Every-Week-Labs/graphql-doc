import * as fs from 'fs';
import * as path from 'path';
import { GeneratedFile } from '../types.js';
import { SidebarItem } from './sidebar-generator.js';

export interface SidebarFileBuilderConfig {
  sidebarFile?: string;
  sidebarTarget?: string;
  sidebarInsertPosition?: 'replace' | 'append' | 'prepend' | 'before' | 'after';
  sidebarInsertReference?: string;
  sidebarMerge?: boolean;
  outputDir?: string;
}

function mergeSidebarContent(
  content: string,
  sidebarItems: SidebarItem[],
  options: {
    targetKey: string;
    insertPosition: 'replace' | 'append' | 'prepend' | 'before' | 'after';
    insertReference?: string;
  }
): string | null {
  const markerStart = '// <graphql-docs-sidebar>';
  const markerEnd = '// </graphql-docs-sidebar>';
  const cleaned = content.replace(new RegExp(`${markerStart}[\\s\\S]*?${markerEnd}\\n?`, 'g'), '');

  let mergedContent = cleaned;
  let targetExpr: string | null = null;

  if (cleaned.includes('module.exports')) {
    targetExpr = 'module.exports';
  } else {
    const exportMatch = cleaned.match(/export\\s+default\\s+([A-Za-z0-9_$]+)\\s*;?/);
    if (exportMatch) {
      targetExpr = exportMatch[1];
    } else if (cleaned.match(/export\\s+default\\s*\\{/)) {
      const replacement = cleaned.replace(/export\\s+default\\s*\\{/, 'const __gqlSidebars = {');
      mergedContent = replacement;
      if (!replacement.includes('export default __gqlSidebars')) {
        mergedContent = `${replacement}\n\nexport default __gqlSidebars;\n`;
      }
      targetExpr = '__gqlSidebars';
    }
  }

  if (!targetExpr) {
    return null;
  }

  const itemsLiteral = JSON.stringify(sidebarItems, null, 2);
  const mergeOptions = {
    mode: options.insertPosition,
    reference: options.insertReference ?? '',
  };
  const targetKeyLiteral = JSON.stringify(options.targetKey);
  const mergeBlock = [
    markerStart,
    `const __gqlDocsItems = ${itemsLiteral};`,
    `const __gqlDocsTargetKey = ${targetKeyLiteral};`,
    `const __gqlDocsMerge = (items, insert, opts) => {`,
    `  const list = Array.isArray(items) ? items.slice() : [];`,
    `  const mode = opts?.mode ?? 'replace';`,
    `  if (mode === 'replace') return insert;`,
    `  if (mode === 'append') return [...list, ...insert];`,
    `  if (mode === 'prepend') return [...insert, ...list];`,
    `  const reference = opts?.reference;`,
    `  if (!reference) return [...list, ...insert];`,
    `  const findIndex = (item) => {`,
    `    if (typeof item === 'string') return item === reference;`,
    `    if (item && typeof item === 'object') {`,
    `      return item.label === reference || item.id === reference || item.value === reference;`,
    `    }`,
    `    return false;`,
    `  };`,
    `  const index = list.findIndex(findIndex);`,
    `  if (index === -1) return [...list, ...insert];`,
    `  const insertIndex = mode === 'before' ? index : index + 1;`,
    `  return [...list.slice(0, insertIndex), ...insert, ...list.slice(insertIndex)];`,
    `};`,
    `${targetExpr}[__gqlDocsTargetKey] = __gqlDocsMerge(` +
      `${targetExpr}[__gqlDocsTargetKey], __gqlDocsItems, ${JSON.stringify(mergeOptions)});`,
    markerEnd,
    '',
  ].join('\n');

  return `${mergedContent.replace(/\s*$/, '')}\n\n${mergeBlock}`;
}

export function buildSidebarFiles(
  sidebarItems: SidebarItem[],
  config: SidebarFileBuilderConfig
): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const customSidebarFile = config.sidebarFile;
  const targetKey = config.sidebarTarget ?? 'apiSidebar';
  const insertPosition = config.sidebarInsertPosition ?? 'replace';
  const insertReference = config.sidebarInsertReference;
  const shouldMerge = config.sidebarMerge !== false;
  const outputRoot = config.outputDir ?? process.cwd();

  const pushSidebarFile = (filePath: string, content: string, absolutePath?: string) => {
    files.push({
      path: filePath,
      content,
      type: 'js',
      ...(absolutePath ? { absolutePath } : {}),
    });
  };

  if (customSidebarFile) {
    const useArrayExport = customSidebarFile.endsWith('.api.js');
    const isAbsolute = path.isAbsolute(customSidebarFile);
    const resolvedSidebarPath = isAbsolute
      ? customSidebarFile
      : path.join(outputRoot, customSidebarFile);
    const absolutePathIfNeeded =
      isAbsolute || resolvedSidebarPath !== path.join(outputRoot, customSidebarFile)
        ? resolvedSidebarPath
        : undefined;

    if (shouldMerge && !useArrayExport && fs.existsSync(resolvedSidebarPath)) {
      const existing = fs.readFileSync(resolvedSidebarPath, 'utf-8');
      const merged = mergeSidebarContent(existing, sidebarItems, {
        targetKey,
        insertPosition,
        insertReference,
      });
      if (merged) {
        pushSidebarFile(customSidebarFile, merged, absolutePathIfNeeded);
        return files;
      }
    }

    const content = useArrayExport
      ? `module.exports = ${JSON.stringify(sidebarItems, null, 2)};`
      : `module.exports = ${JSON.stringify({ [targetKey]: sidebarItems }, null, 2)};`;
    pushSidebarFile(customSidebarFile, content, absolutePathIfNeeded);
  } else {
    const sidebarsPath = path.join(outputRoot, 'sidebars.js');
    if (shouldMerge && fs.existsSync(sidebarsPath)) {
      const existing = fs.readFileSync(sidebarsPath, 'utf-8');
      const merged = mergeSidebarContent(existing, sidebarItems, {
        targetKey,
        insertPosition,
        insertReference,
      });
      if (merged) {
        pushSidebarFile('sidebars.js', merged);
      } else {
        pushSidebarFile(
          'sidebars.js',
          `module.exports = ${JSON.stringify({ [targetKey]: sidebarItems }, null, 2)};`
        );
      }
    } else if (fs.existsSync(sidebarsPath)) {
      pushSidebarFile(
        'sidebars.api.js',
        `module.exports = ${JSON.stringify(sidebarItems, null, 2)};`
      );
    } else {
      pushSidebarFile(
        'sidebars.js',
        `module.exports = ${JSON.stringify({ [targetKey]: sidebarItems }, null, 2)};`
      );
    }
  }

  return files;
}
