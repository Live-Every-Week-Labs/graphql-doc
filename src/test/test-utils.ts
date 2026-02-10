import { Config, ConfigSchema } from '../core/config/schema.js';

/**
 * Creates a valid Config object with sensible defaults, allowing tests to
 * override specific fields via a shallow merge.
 *
 * Uses the Zod schema to produce the base config so that all default values
 * are consistent with the production code.
 */
export function createTestConfig(overrides: Partial<Config> = {}): Config {
  const base = ConfigSchema.parse({});
  return { ...base, ...overrides };
}
