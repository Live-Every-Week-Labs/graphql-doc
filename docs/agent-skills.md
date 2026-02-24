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
  graphql-doc:
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

Find details on how to use skills for your favorite AI tools below:

- [Claude Code](https://code.claude.com/docs/en/skills)
- [Claude Desktop](https://support.claude.com/en/articles/12512180-using-skills-in-claude)
- [Codex CLI](https://developers.openai.com/codex/skills/)
- [Gemini CLI](https://geminicli.com/docs/cli/skills/)
- [Antigravity](https://antigravity.google/docs/skills)

## Generated Intro Page

If `agentSkill.introDoc.enabled` is true, the generator also creates an intro page with a download button
for the generated zip so users can install the skill from documentation directly.
