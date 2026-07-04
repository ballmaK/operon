# Operon

Cross-platform Agent company desktop app (Windows-first). See `docs/prd/`.

## Agent skills

### Issue tracker

Local markdown under `.scratch/issues/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical five-role vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.

### Autonomous build

After PRD finalized, run in Cursor Agent:

```
/prd-build-loop
```

Resume:

```
/prd-build-loop continue
```

**New phase (N+1):** update `docs/prd/` first → user confirms → `parseN` or append plan → then `continue`. See `docs/prd/README.md` §新阶段扩展流程.
