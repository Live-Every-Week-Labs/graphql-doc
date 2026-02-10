import * as fs from 'fs';
import * as path from 'path';
import { GeneratedFile } from '../types.js';
import { SidebarItem } from './sidebar-generator.js';
import { escapeYamlValue } from '../../utils/yaml-escape.js';
import { slugify } from '../../utils/string-utils.js';
import { formatPathForMessage } from '../../utils/index.js';

export interface IntroDocEntry {
  source?: string;
  content?: string;
  outputPath?: string;
  id?: string;
  label?: string;
  title?: string;
}

function parseFrontMatter(content: string): {
  frontMatter?: Record<string, string>;
  frontMatterBlock?: string;
} {
  if (!content.startsWith('---')) {
    return {};
  }
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) {
    return {};
  }
  const block = match[1];
  const frontMatter: Record<string, string> = {};
  block.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const separator = trimmed.indexOf(':');
    if (separator === -1) return;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    frontMatter[key] = value;
  });
  return { frontMatter, frontMatterBlock: match[0] };
}

function ensureFrontMatter(
  content: string,
  options: { id?: string; title?: string; label?: string }
): string {
  const { id, title, label } = options;
  if (!id && !title && !label) {
    return content;
  }

  if (content.startsWith('---')) {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
    if (!match) {
      return content;
    }
    const block = match[1];
    const lines = block.split('\n');
    const hasId = lines.some((line) => line.trim().startsWith('id:'));
    const hasTitle = lines.some((line) => line.trim().startsWith('title:'));
    const hasLabel = lines.some((line) => line.trim().startsWith('sidebar_label:'));
    const additions: string[] = [];
    if (id && !hasId) additions.push(`id: ${escapeYamlValue(id)}`);
    if (title && !hasTitle) additions.push(`title: ${escapeYamlValue(title)}`);
    if (label && !hasLabel) additions.push(`sidebar_label: ${escapeYamlValue(label)}`);
    if (additions.length === 0) {
      return content;
    }
    const updatedBlock = ['---', ...additions, ...lines, '---'].join('\n');
    return content.replace(match[0], `${updatedBlock}\n`);
  }

  const frontMatterLines = ['---'];
  if (id) frontMatterLines.push(`id: ${escapeYamlValue(id)}`);
  if (title) frontMatterLines.push(`title: ${escapeYamlValue(title)}`);
  if (label) frontMatterLines.push(`sidebar_label: ${escapeYamlValue(label)}`);
  frontMatterLines.push('---');
  return `${frontMatterLines.join('\n')}\n\n${content}`;
}

export function buildIntroDocs(options: {
  introDocs: IntroDocEntry[];
  withDocIdPrefix: (id: string) => string;
}): {
  files: GeneratedFile[];
  sidebarItems: SidebarItem[];
} {
  const { introDocs, withDocIdPrefix } = options;
  if (introDocs.length === 0) {
    return { files: [], sidebarItems: [] };
  }

  const files: GeneratedFile[] = [];
  const sidebarItems: SidebarItem[] = [];

  for (const doc of introDocs) {
    let rawContent = doc.content;
    if (!rawContent) {
      const sourcePath = doc.source;
      if (!sourcePath) {
        throw new Error('Intro doc entries must include either "source" or "content".');
      }
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Intro doc not found: ${formatPathForMessage(sourcePath)}`);
      }
      rawContent = fs.readFileSync(sourcePath, 'utf-8');
    }
    const { frontMatter } = parseFrontMatter(rawContent);
    const sourceExt = doc.source ? path.extname(doc.source) || '.mdx' : '.mdx';
    const outputPathRaw =
      doc.outputPath ??
      (doc.source
        ? path.basename(doc.source)
        : `${slugify(doc.id ?? doc.label ?? doc.title ?? 'intro') || 'intro'}.mdx`);
    const outputPath = path.extname(outputPathRaw) ? outputPathRaw : `${outputPathRaw}${sourceExt}`;
    const rawId =
      doc.id ?? frontMatter?.id ?? outputPath.replace(/\.[^/.]+$/, '').replace(/\\/g, '/');
    const docId = withDocIdPrefix(rawId);
    const label =
      doc.label ?? frontMatter?.sidebar_label ?? frontMatter?.title ?? docId.split('/').pop()!;

    const content = ensureFrontMatter(rawContent, {
      id: doc.id,
      title: doc.title,
      label: doc.label,
    });

    files.push({
      path: outputPath.replace(/\\/g, '/'),
      content,
      type: 'mdx',
    });

    sidebarItems.push({
      type: 'doc',
      id: docId,
      label,
    });
  }

  return { files, sidebarItems };
}
