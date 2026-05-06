# Codex Project Context

Always read and follow [CLAUDE.md](CLAUDE.md) before planning or editing this repository. Treat it as the canonical project context for stack, architecture, security rules, response contracts, migrations, commands, and available project skills.

## Skill References

This repository mirrors the Claude project skills under `.codex/skills`. Each Codex skill wrapper points to the corresponding source in `.claude/skills` so the Claude and Codex context stay aligned.

Use these references automatically:

- `project-architecture-reference`: architecture, data flow, auth, API contracts, and impact analysis.
- `project-code-conventions`: naming, backend/frontend conventions, security, validation, and response shapes.
- `project-engineering-patterns`: CRUD templates, SQL patterns, frontend data patterns, and implementation examples.
- `project-structure-guide`: where to create routes, controllers, schemas, migrations, frontend pages, and components.
- `project-agent-prompts-playbook`: prompt/playbook guidance for agent workflows.
- `project-commands-runbook`: local setup, install, migration, dev, and validation commands.
- `frontend-visual-system-fluid-glass`: visual system, Tailwind tokens, reusable UI, accessibility, and responsive glass styling.

When a task matches one of these areas, consult the matching `.codex/skills/<skill-name>/SKILL.md`, then follow the referenced `.claude/skills/<skill-name>/SKILL.md`.

