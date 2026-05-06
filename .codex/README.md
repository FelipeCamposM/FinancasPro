# Codex Context Bridge

This folder bridges the existing Claude project context into Codex.

- Root `AGENTS.md` tells Codex to load `CLAUDE.md` automatically.
- `.codex/skills/*/SKILL.md` mirrors every skill from `.claude/skills`.
- The wrapper files reference the original Claude skill files instead of duplicating content, so edits to `.claude/skills` remain the source of truth.

If a Claude skill changes, keep the same folder name and the Codex wrapper will continue to point at it.

