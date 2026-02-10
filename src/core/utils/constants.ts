/**
 * Shared constants used across the generation pipeline.
 */

/** Default sort priority for operations/sections without an explicit @docPriority. */
export const DEFAULT_SORT_PRIORITY = 999;

/** Default group name for operations without a @docGroup directive. */
export const DEFAULT_GROUP_NAME = 'Uncategorized';

/** Maximum number of operations to show in preview/manifest listings. */
export const MAX_PREVIEW_OPERATIONS = 8;

/** Token count threshold for emitting a size warning in LLM docs. */
export const LLM_TOKEN_WARNING_THRESHOLD = 50000;

/** Package name for the component library import. */
export const COMPONENT_PACKAGE_IMPORT = '@graphql-docs/generator/components';
