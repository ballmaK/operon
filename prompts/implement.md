## Context
Study: specs/README.md, CONTEXT.md

## Task
1. Read `specs/implementation-plans/active-plan.md`
2. Find FIRST unchecked `- [ ]` task
3. Read linked `docs/prd/modules/*.md` for that task
4. Implement ONLY that task using `tdd` discipline

## Execution
1. Search specs/README.md Pin for related code
2. Implement following specs/conventions/
3. Write tests at agreed seams
4. Run: `./test-wrapper.sh`

## On Success
1. Change task from `- [ ]` to `- [x]` in active-plan.md
2. Append log line to `.ralph-logs/session.log`
3. Git commit if repo initialized
4. STOP (unless prd-build-loop session budget allows continue)

## On Failure
1. Fix and retry (max 3 attempts)
2. If still failing, STOP and leave as `- [ ]`
3. Log blocker to `.ralph-logs/session.log`

## CRITICAL
- ONE task only per iteration
- Do NOT read entire docs/prd/ — only the module for current task
- Minimize tool output (test-wrapper, head -50)
