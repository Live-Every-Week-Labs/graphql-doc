import { Config } from './config/schema.js';
import fs from 'fs-extra';
import path from 'path';
import { SchemaLoader } from './parser/schema-loader.js';
import { SchemaParser } from './parser/schema-parser.js';
import { getExamplePatterns } from './metadata/example-sources.js';
import { loadExamples } from './metadata/example-loader.js';
import { Transformer } from './transformer/transformer.js';
import { createAdapter } from './adapters/index.js';
import { LlmDocsGenerator } from './llm-docs/generator.js';
import { validateOperationExampleCoverage } from './validation/operation-example-validator.js';
import { generateAgentSkillArtifacts } from './skills/agent-skill-generator.js';

import { FileWriter } from './file-writer.js';
import { Logger, silentLogger } from './logger.js';
import { serializeDocData } from './serialization/doc-data.js';
import type { SerializedDocData } from './serialization/doc-data.js';
import { formatPathForMessage } from './utils/index.js';
import type { GeneratedFile } from './types.js';

function hasMinimumDepth(resolvedPath: string): boolean {
  const segments = resolvedPath.split(path.sep).filter(Boolean);
  return segments.length >= 3;
}

export interface GenerateRunOptions {
  dryRun?: boolean;
}

export interface GenerateRunResult {
  dryRun: boolean;
  generatedFiles: GeneratedFile[];
  llmFiles: GeneratedFile[];
  filesWritten: number;
  llmFilesWritten: number;
}

export class Generator {
  constructor(
    private config: Config,
    private logger: Logger = silentLogger
  ) {}

  private async cleanOutputDirIfEnabled() {
    if (!this.config.cleanOutputDir) {
      return;
    }

    const resolvedOutputDir = path.resolve(this.config.outputDir);
    const rootDir = path.parse(resolvedOutputDir).root;

    if (resolvedOutputDir === rootDir) {
      throw new Error(
        `Refusing to clean outputDir because it resolves to filesystem root: ${formatPathForMessage(
          resolvedOutputDir
        )}`
      );
    }

    if (!hasMinimumDepth(resolvedOutputDir)) {
      throw new Error(
        `Refusing to clean outputDir because it is too shallow (fewer than 3 path segments): ${formatPathForMessage(
          resolvedOutputDir
        )}`
      );
    }

    // Refuse to clean a symlinked directory to avoid following links to unintended locations
    try {
      const stat = await fs.lstat(resolvedOutputDir);
      if (stat.isSymbolicLink()) {
        throw new Error(
          `Refusing to clean outputDir because it is a symbolic link: ${formatPathForMessage(
            resolvedOutputDir
          )}`
        );
      }
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        'code' in err &&
        (err as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        // Path does not exist yet, safe to proceed
      } else {
        throw err;
      }
    }

    this.logger.info(`Cleaning output directory: ${formatPathForMessage(resolvedOutputDir)}`);
    await fs.emptyDir(resolvedOutputDir);
  }

  private async cleanAgentSkillArtifactsIfEnabled() {
    if (!this.config.agentSkill?.enabled) {
      return;
    }

    const skillOutputDir =
      this.config.agentSkill.outputDir ??
      path.join(this.config.outputDir, 'agent-skills', this.config.agentSkill.name);
    const resolvedSkillOutputDir = path.resolve(skillOutputDir);
    const rootDir = path.parse(resolvedSkillOutputDir).root;

    if (resolvedSkillOutputDir === rootDir) {
      throw new Error(
        `Refusing to clean agentSkill.outputDir because it resolves to filesystem root: ${formatPathForMessage(
          resolvedSkillOutputDir
        )}`
      );
    }

    if (!hasMinimumDepth(resolvedSkillOutputDir)) {
      throw new Error(
        `Refusing to clean agentSkill.outputDir because it is too shallow (fewer than 3 path segments): ${formatPathForMessage(
          resolvedSkillOutputDir
        )}`
      );
    }

    if (!(await fs.pathExists(resolvedSkillOutputDir))) {
      return;
    }

    // Refuse to clean a symlinked directory to avoid following links to unintended locations
    const stat = await fs.lstat(resolvedSkillOutputDir);
    if (stat.isSymbolicLink()) {
      throw new Error(
        `Refusing to clean agentSkill.outputDir because it is a symbolic link: ${formatPathForMessage(
          resolvedSkillOutputDir
        )}`
      );
    }

    this.logger.info(
      `Refreshing agent skill artifacts in: ${formatPathForMessage(resolvedSkillOutputDir)}`
    );

    await fs.remove(path.join(resolvedSkillOutputDir, 'SKILL.md'));
    await fs.remove(path.join(resolvedSkillOutputDir, 'scripts'));
    await fs.remove(path.join(resolvedSkillOutputDir, '_data'));

    const entries = await fs.readdir(resolvedSkillOutputDir);
    await Promise.all(
      entries
        .filter((entry) => entry.toLowerCase().endsWith('.zip'))
        .map((entry) => fs.remove(path.join(resolvedSkillOutputDir, entry)))
    );
  }

  async generate(
    schemaPointer: string | string[],
    options: GenerateRunOptions = {}
  ): Promise<GenerateRunResult> {
    const dryRun = options.dryRun === true;
    const schemaLabel = Array.isArray(schemaPointer) ? schemaPointer.join(', ') : schemaPointer;
    this.logger.info(`Loading schema from ${schemaLabel}...`);
    const schemaLoader = new SchemaLoader();
    const schema = await schemaLoader.load({
      schemaPointer,
      schemaExtensions: this.config.schemaExtensions,
      allowRemoteSchema: this.config.allowRemoteSchema,
    });

    this.logger.info('Parsing schema...');
    const parser = new SchemaParser();
    const { operations, types, warnings: parserWarnings } = parser.parse(schema);
    for (const warning of parserWarnings) {
      this.logger.warn(warning.message);
    }

    this.logger.info('Loading metadata...');
    const examplePatterns = getExamplePatterns(this.config);
    const examples = await loadExamples(examplePatterns);

    if (this.config.requireExamplesForDocumentedOperations) {
      const coverageErrors = validateOperationExampleCoverage(operations, examples, {
        excludeDocGroups: this.config.excludeDocGroups,
        examplesLocation: examplePatterns.join(', '),
      });

      if (coverageErrors.length > 0) {
        const details = coverageErrors.map((error) => `- ${error.message}`).join('\n');
        throw new Error(`Missing required operation examples:\n${details}`);
      }
    }

    this.logger.info('Transforming data...');
    const transformer = new Transformer(types, {
      ...this.config.typeExpansion,
      excludeDocGroups: this.config.excludeDocGroups,
    });
    const docModel = transformer.transform(operations, examples);
    const serializedData: SerializedDocData = serializeDocData(docModel);

    const skillArtifacts = await generateAgentSkillArtifacts(docModel, this.config, serializedData);
    const adapterConfig =
      skillArtifacts.introDoc !== undefined
        ? {
            ...this.config,
            adapters: {
              ...(this.config.adapters ?? {}),
              docusaurus: {
                ...(this.config.adapters?.docusaurus ?? {}),
                introDocs: [
                  ...(this.config.adapters?.docusaurus?.introDocs ?? []),
                  skillArtifacts.introDoc,
                ],
              },
            },
          }
        : this.config;

    this.logger.info('Generating documentation...');
    const adapter = createAdapter(adapterConfig);
    const files: GeneratedFile[] = [
      ...skillArtifacts.files,
      ...adapter.adapt(docModel, serializedData),
    ];
    let llmFiles: GeneratedFile[] = [];

    if (!dryRun) {
      this.logger.info('Writing files...');
      await this.cleanOutputDirIfEnabled();
      await this.cleanAgentSkillArtifactsIfEnabled();
      const fileWriter = new FileWriter(this.config.outputDir);
      await fileWriter.write(files);
    } else {
      this.logger.info(`Dry run enabled. Skipping writes for ${files.length} files.`);
    }

    if (this.config.llmDocs?.enabled) {
      this.logger.info('Generating LLM-optimized docs...');
      const llmGenerator = new LlmDocsGenerator(this.config.llmDocs);
      const llmResult = llmGenerator.generate(docModel);
      llmFiles = llmResult.files;

      if (!dryRun) {
        const llmWriter = new FileWriter(this.config.llmDocs.outputDir);
        await llmWriter.write(llmFiles);
      } else {
        this.logger.info(`Dry run enabled. Skipping writes for ${llmFiles.length} LLM docs files.`);
      }

      if (llmResult.warnings.length > 0) {
        for (const warning of llmResult.warnings) {
          this.logger.warn(warning);
        }
      }
    }

    this.logger.info('Documentation generated successfully!');

    return {
      dryRun,
      generatedFiles: files,
      llmFiles,
      filesWritten: dryRun ? 0 : files.length,
      llmFilesWritten: dryRun ? 0 : llmFiles.length,
    };
  }
}
