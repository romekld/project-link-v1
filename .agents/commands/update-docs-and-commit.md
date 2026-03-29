You are executing the `/update-docs-and-commit` slash command for Project LINK.

## Purpose

Update `docs/` files to reflect recent code changes, then commit everything together as one logical unit.

## Steps

### 1. Gather context

Run these in parallel:
- `git diff HEAD` — see all uncommitted changes
- `git diff HEAD~1 HEAD` — see what the last commit changed (if already committed)
- `git status` — list staged/unstaged/untracked files
- `git log --oneline -10` — recent commit history for context

Read the current content of all three docs files:
- `docs/architecture.md`
- `docs/changelog.md`
- `docs/project_status.md`

### 2. Determine which docs need updating

Use the diff and git log to identify what changed. Apply these rules:

| What changed | Docs to update |
| :--- | :--- |
| New DB schema, data flow, new service, new integration, infra change | `docs/architecture.md` |
| Any user-visible feature, bug fix, breaking change, new dependency | `docs/changelog.md` |
| Milestone reached, phase progress, next steps shifted | `docs/project_status.md` |

When in doubt, update `docs/changelog.md` — it captures everything.

### 3. Update the docs

**`docs/architecture.md`** — describe the system design, data flow, and component relationships as they exist *now*. Write in present tense. Structured sections (Overview, Layers, Data Flow, Key Decisions). Replace stale sections rather than appending.

**`docs/changelog.md`** — follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format:
```
## [Unreleased] — YYYY-MM-DD
### Added / Changed / Fixed / Removed
- One concise bullet per logical change. State *what* and *why*.
```
Always add a new `## [Unreleased]` entry at the top (below the header). Do not edit past entries.

**`docs/project_status.md`** — answer three questions as of today:
1. What are the project milestones (from `project_spec.md` if needed)?
2. What has been accomplished (phase, features complete, infra ready)?
3. What is next (immediate next task or milestone)?

Keep it short — bullet lists, not paragraphs.

### 4. Stage and commit

Stage the changed docs alongside any already-staged or recently-changed code files:

```bash
git add docs/architecture.md docs/changelog.md docs/project_status.md
# Also stage any other modified files that belong in this commit
git add <other changed files if applicable>
```

Write a commit message in this format:
```
<short imperative summary of the code change>

- Updated docs/changelog.md: <what was added>
- Updated docs/project_status.md: <what changed>  [if applicable]
- Updated docs/architecture.md: <what changed>     [if applicable]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Commit using a HEREDOC so formatting is preserved:
```bash
git commit -m "$(cat <<'EOF'
<message here>
EOF
)"
```

### 5. Confirm

After committing, run `git log --oneline -3` and show the user the new commit SHA and message.

---

## Constraints

- Never commit directly to `main`. If the current branch is `main`, stop and tell the user to create a feature branch first.
- Never hard-delete or overwrite clinical data references in docs.
- Do not push — only commit locally.
- If there is nothing to commit (clean working tree and no staged changes), tell the user and exit gracefully.
