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

## Claude Desktop

- Open Claude Desktop settings.
- Go to `Capabilities`.
- Upload the generated skill `.zip`.

Reference:

- https://support.claude.com/en/articles/12512198-how-to-create-custom-skills
- https://support.claude.com/en/articles/12512176-what-are-skills

## Claude Code

- Put custom skills under `~/.claude/skills/` (user scope) or `.claude/skills/` (project scope).
- Each skill folder should contain `SKILL.md` and any `scripts/` resources.

Reference:

- https://code.claude.com/docs/en/skills

## Codex CLI / Codex IDE Extension

- Put custom skills in `.agents/skills` at repo root or user config directory.
- You can also use the built-in installer flow (`$skill-installer`) described in the docs.

Reference:

- https://developers.openai.com/codex/prompting/skills
- https://developers.openai.com/codex/local-config

## ChatGPT Desktop

ChatGPT currently uses custom GPTs and custom instructions instead of a native zipped skill format.
You can still reuse generated skill content by copying guidance from `SKILL.md` and using the helper script/data as project assets.

Reference:

- https://help.openai.com/en/articles/8096356-custom-instructions-for-chatgpt
- https://help.openai.com/en/articles/8554397-creating-a-gpt

## Cursor

Cursor does not use the same zipped skill format directly. Recommended mapping:

- Move reusable instructions into Cursor Rules.
- Convert high-value skill actions into slash commands under `.cursor/commands`.

Reference:

- https://docs.cursor.com/chat/slash-commands
- https://docs.cursor.com/context/rules

## Generated Intro Page

If `agentSkill.introDoc.enabled` is true, the generator also creates an intro page with a download button
for the generated zip so users can install the skill from documentation directly.
