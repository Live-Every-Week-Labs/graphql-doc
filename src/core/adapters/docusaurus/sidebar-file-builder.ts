import * as fs from 'fs';
import * as path from 'path';
import { GeneratedFile } from '../types.js';
import { SidebarItem } from './sidebar-generator.js';

type SidebarInsertPosition = 'replace' | 'append' | 'prepend' | 'before' | 'after';
type SidebarFormat = 'auto' | 'js' | 'json';

export interface SidebarFileBuilderConfig {
  sidebarFile?: string;
  sidebarFormat?: SidebarFormat;
  sidebarTarget?: string;
  sidebarInsertPosition?: SidebarInsertPosition;
  sidebarInsertReference?: string;
  sidebarMerge?: boolean;
  outputDir?: string;
}

function mergeSidebarItems(
  items: unknown,
  insert: SidebarItem[],
  options: {
    insertPosition: SidebarInsertPosition;
    insertReference?: string;
  }
): SidebarItem[] {
  const list = Array.isArray(items) ? (items as SidebarItem[]).slice() : [];
  const mode = options.insertPosition;

  if (mode === 'replace') {
    return insert;
  }

  if (mode === 'append') {
    return [...list, ...insert];
  }

  if (mode === 'prepend') {
    return [...insert, ...list];
  }

  const reference = options.insertReference;
  if (!reference) {
    return [...list, ...insert];
  }

  const findIndex = (item: SidebarItem): boolean => {
    if (typeof item === 'string') {
      return item === reference;
    }

    if (item && typeof item === 'object') {
      return item.label === reference || item.id === reference || item.value === reference;
    }

    return false;
  };

  const index = list.findIndex(findIndex);
  if (index === -1) {
    return [...list, ...insert];
  }

  const insertIndex = mode === 'before' ? index : index + 1;
  return [...list.slice(0, insertIndex), ...insert, ...list.slice(insertIndex)];
}

function mergeSidebarContent(
  content: string,
  sidebarItems: SidebarItem[],
  options: {
    targetKey: string;
    insertPosition: SidebarInsertPosition;
    insertReference?: string;
  }
): string | null {
  const markerStart = '// <graphql-doc-sidebar>';
  const markerEnd = '// </graphql-doc-sidebar>';
  const cleaned = content.replace(new RegExp(`${markerStart}[\\s\\S]*?${markerEnd}\\n?`, 'g'), '');

  let mergedContent = cleaned;
  let targetExpr: string | null = null;

  if (cleaned.includes('module.exports')) {
    targetExpr = 'module.exports';
  } else {
    const exportMatch = cleaned.match(/export\s+default\s+([A-Za-z0-9_$]+)\s*;?/);
    if (exportMatch) {
      targetExpr = exportMatch[1];
    } else if (cleaned.match(/export\s+default\s*\{/)) {
      const replacement = cleaned.replace(/export\s+default\s*\{/, 'const __gqlSidebars = {');
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

function mergeJsonSidebarContent(
  content: string,
  sidebarItems: SidebarItem[],
  options: {
    targetKey: string;
    insertPosition: SidebarInsertPosition;
    insertReference?: string;
  }
): string | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }

  const next = {
    ...(parsed as Record<string, unknown>),
  };

  next[options.targetKey] = mergeSidebarItems(next[options.targetKey], sidebarItems, {
    insertPosition: options.insertPosition,
    insertReference: options.insertReference,
  });

  return `${JSON.stringify(next, null, 2)}\n`;
}

function detectSidebarFormat(sidebarFilePath: string, sidebarFormat: SidebarFormat): 'js' | 'json' {
  if (sidebarFormat === 'json') {
    return 'json';
  }

  if (sidebarFormat === 'js') {
    return 'js';
  }

  return sidebarFilePath.toLowerCase().endsWith('.json') ? 'json' : 'js';
}

function buildJsonSidebarContent(sidebarItems: SidebarItem[], targetKey: string): string {
  return `${JSON.stringify({ [targetKey]: sidebarItems }, null, 2)}\n`;
}

export function buildSidebarFiles(
  sidebarItems: SidebarItem[],
  config: SidebarFileBuilderConfig
): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const customSidebarFile = config.sidebarFile;
  const sidebarFormat = config.sidebarFormat ?? 'auto';
  const targetKey = config.sidebarTarget ?? 'apiSidebar';
  const insertPosition = config.sidebarInsertPosition ?? 'replace';
  const insertReference = config.sidebarInsertReference;
  const shouldMerge = config.sidebarMerge !== false;
  const outputRoot = config.outputDir ?? process.cwd();

  const pushSidebarFile = (
    filePath: string,
    content: string,
    absolutePath?: string,
    type: string = 'js'
  ) => {
    files.push({
      path: filePath,
      content,
      type,
      ...(absolutePath ? { absolutePath } : {}),
    });
  };

  if (customSidebarFile) {
    const isAbsolute = path.isAbsolute(customSidebarFile);
    const resolvedSidebarPath = isAbsolute
      ? customSidebarFile
      : path.join(outputRoot, customSidebarFile);
    const absolutePathIfNeeded =
      isAbsolute || resolvedSidebarPath !== path.join(outputRoot, customSidebarFile)
        ? resolvedSidebarPath
        : undefined;

    const resolvedFormat = detectSidebarFormat(customSidebarFile, sidebarFormat);

    if (resolvedFormat === 'json') {
      if (shouldMerge && fs.existsSync(resolvedSidebarPath)) {
        const existing = fs.readFileSync(resolvedSidebarPath, 'utf-8');
        const merged = mergeJsonSidebarContent(existing, sidebarItems, {
          targetKey,
          insertPosition,
          insertReference,
        });
        if (merged) {
          pushSidebarFile(customSidebarFile, merged, absolutePathIfNeeded, 'json');
          return files;
        }
      }

      pushSidebarFile(
        customSidebarFile,
        buildJsonSidebarContent(sidebarItems, targetKey),
        absolutePathIfNeeded,
        'json'
      );
      return files;
    }

    const useArrayExport = customSidebarFile.endsWith('.api.js');

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
    const defaultSidebarFile = sidebarFormat === 'json' ? 'sidebars.json' : 'sidebars.js';
    const sidebarsPath = path.join(outputRoot, defaultSidebarFile);

    if (sidebarFormat === 'json') {
      if (shouldMerge && fs.existsSync(sidebarsPath)) {
        const existing = fs.readFileSync(sidebarsPath, 'utf-8');
        const merged = mergeJsonSidebarContent(existing, sidebarItems, {
          targetKey,
          insertPosition,
          insertReference,
        });
        if (merged) {
          pushSidebarFile(defaultSidebarFile, merged, undefined, 'json');
        } else {
          pushSidebarFile(
            defaultSidebarFile,
            buildJsonSidebarContent(sidebarItems, targetKey),
            undefined,
            'json'
          );
        }
      } else {
        pushSidebarFile(
          defaultSidebarFile,
          buildJsonSidebarContent(sidebarItems, targetKey),
          undefined,
          'json'
        );
      }

      return files;
    }

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
