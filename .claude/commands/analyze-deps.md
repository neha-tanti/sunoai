# Analyze Dependencies

Analyze dependencies for updates, breaking changes, deprecations, and migration paths using the DevOps agent.

## Agent Used

| Agent                         | Skill                                                       | Purpose                    |
| ----------------------------- | ----------------------------------------------------------- | -------------------------- |
| [DevOps](../agents/devops.md) | [analyze-deps-guide](../skills/analyze-deps-guide/SKILL.md) | Dependency analysis report |

## Input

- **$ARGUMENTS**: Package name or "all"

```
Examples:
  /analyze-deps @tanstack/react-query    → Analyze single package
  /analyze-deps all                      → Analyze all dependencies
  /analyze-deps                          → Defaults to "all"
```

## Input Detection

Parse `$ARGUMENTS` for:

| Pattern        | Scope                                     |
| -------------- | ----------------------------------------- |
| A package name | Single package in the root package.json   |
| `all` or empty | All dependencies in the root package.json |

## Flow

```
┌─────────────────────────────────────────┐
│    /analyze-deps @tanstack/react-query  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│           Parse Input                   │
│  • Determine scope (package/all)        │
│  • Read the root package.json           │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Spawn DevOps Agent              │
│  • Use Agent tool with subagent_type     │
│  • Pass scope in prompt                 │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│   DevOps Executes analyze-deps skill    │
│  • Query npm registry                   │
│  • Research breaking changes            │
│  • Scan codebase impact                 │
│  • Generate report                      │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Report Generated                │
│  • Saved to .deps-reports/{name}-{date}  │
│  • Summary displayed to user            │
└─────────────────────────────────────────┘
```

## Execution

### Phase 1: Parse Input

1. **Determine analysis scope:**

   ```
   If "all" or empty → All dependencies mode
   Otherwise         → Single package mode
   ```

2. **Resolve target:**
   - Single package: Find it in the root `package.json`
   - All: Read every dependency in the root `package.json`

### Phase 2: Spawn DevOps Agent

**IMPORTANT: You MUST use the Agent tool to spawn the DevOps agent. Do NOT execute the skill yourself.**

```
Agent(
  subagent_type: "devops",
  description: "Analyze dependencies",
  prompt: """
  Analyze dependencies and generate a report.

  ## Scope
  - Target: {package name | all}
  - Mode: {single-package | all}

  ## Instructions
  1. Follow the 5-phase workflow:
     - Read package.json
     - Query npm registry
     - Research breaking changes (for updates)
     - Scan codebase impact
     - Generate report
  2. Save report to `.deps-reports/{target}-{YYYY-MM-DD}.md`
  3. Return summary of findings
  """
)
```

The DevOps agent will:

- Follow the analyze-deps skill workflow
- Research thoroughly using WebSearch for migration guides
- Verify the current API surface against the official docs with WebFetch before flagging breakage
- Generate actionable report with file:line references
- Prioritize by risk (security > deprecated > major > minor > patch)

### Phase 3: Report Output

After analysis is complete, output:

```markdown
## 📦 Dependency Analysis Complete

### Scope

{Package: @tanstack/react-query | All dependencies}

### Summary

| Metric            | Count |
| ----------------- | ----- |
| Packages analyzed | X     |
| Updates available | X     |
| Deprecated        | X     |
| Up to date        | X     |

### Risk Overview

| Risk      | Count | Examples                    |
| --------- | ----- | --------------------------- |
| 🔴 High   | X     | package-a (1.0→4.0, major)  |
| 🟡 Medium | X     | package-b (1.2→1.5, minor)  |
| 🟢 Low    | X     | package-c (3.0→3.0.5 patch) |

### Report Location

`.deps-reports/{target}-{YYYY-MM-DD}.md`

### Next Steps

1. Review full report for migration details
2. Address deprecated packages first
3. Plan major version upgrades
```

## Output Files

Reports are saved to `.deps-reports/` with naming:

| Scope            | Filename Example                     |
| ---------------- | ------------------------------------ |
| Single package   | `tanstack-react-query-2026-10-09.md` |
| All dependencies | `all-2026-10-09.md`                  |

## Error Handling

| Error                    | Action                                  |
| ------------------------ | --------------------------------------- |
| Package not found        | Note as "not found in package.json"     |
| npm registry unreachable | Skip package, note as "unable to check" |
| GitHub API rate limited  | Fall back to WebSearch for changelogs   |

## Important Notes

- **Research depth:** Major version bumps get full changelog research; patches get quick scan
- **Official sources:** Prioritizes maintainer docs over blog posts
- **Actionable output:** Every finding includes specific migration steps where available
