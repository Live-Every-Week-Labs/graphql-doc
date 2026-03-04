# Agent Skills Guide

Agent skill output packages your generated API knowledge into installable artifacts for coding and
assistant tools.

## What It Generates

When `agentSkill.enabled: true`, graphql-doc emits:

- `SKILL.md`
- `scripts/<pythonScriptName>`
- `_data/operations.json`
- `_data/types.json`
- `<skill-name>.zip`

The zip file is intended for direct download and installation in compatible agent platforms.

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
        description: Download and install this API skill package for agent-assisted workflows.
```

## Generated Intro Page

When `agentSkill.introDoc.enabled: true`, graphql-doc creates a docs intro page that links to the
generated zip artifact so users can download the skill from the docs UI.

## Platform References

- [Claude Code](https://code.claude.com/docs/en/skills)
- [Claude Desktop](https://support.claude.com/en/articles/12512180-using-skills-in-claude)
- [Codex CLI](https://developers.openai.com/codex/skills/)
- [Gemini CLI](https://geminicli.com/docs/cli/skills/)
- [Antigravity](https://antigravity.google/docs/skills)
