# Agent Skills Guide

Agent skill output packages your generated API knowledge for AI agents.

When `agentSkill.enabled: true`, the generator creates:

- `SKILL.md`
- `scripts/<pythonScriptName>`
- `_data/operations.json`
- `_data/types.json`
- `<skill-name>.zip`

## Enable Skill Output

```yaml
extensions:
  graphql-docs:
    agentSkill:
      enabled: true
      name: graphql-api-skill
      includeExamples: true
      introDoc:
        enabled: true
        outputPath: intro/ai-agent-skill.mdx
        title: AI Agent Skill
        description: Download and install this skill package to query API docs from an agent.
```

## Platform Setup

### Codex CLI

Install directly from the command line using `$skill-installer`, or place custom skills in `.agents/skills` at repo root or user config directory.

Reference:

- https://developers.openai.com/codex/skills/

### Claude Code

Put custom skills under `~/.claude/skills/` (user scope) or `.claude/skills/` (project scope). Each skill folder should contain `SKILL.md` and any `scripts/` resources.

Reference:

- https://code.claude.com/docs/en/skills

### Claude Desktop

Import the skill package in Claude Desktop settings under Capabilities.

Reference:

- https://support.claude.com/en/articles/12512180-using-skills-in-claude

### Gemini CLI

Configure the skill in your Gemini CLI setup.

Reference:

- https://geminicli.com/docs/cli/skills/

### Antigravity

Add the skill to your Antigravity IDE configuration.

Reference:

- https://antigravity.google/docs/skills

## Generated Intro Page

If `agentSkill.introDoc.enabled` is true, the generator also creates an intro page with a download button
for the generated zip so users can install the skill from documentation directly.
