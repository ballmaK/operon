#!/bin/bash
# Ralph outer harness — Operon
# Usage: ./scripts/ralph.sh
# Stop:  touch .ralph-stop
#
# Note: Each iteration needs a fresh Cursor Agent session.
# This script prints the prompt; paste into new Agent chat, or use prd-build-loop in Cursor.

set -e

PLAN="specs/implementation-plans/active-plan.md"
PROMPT="prompts/implement.md"
LOG_DIR=".ralph-logs"
MAX_ITERATIONS="${RALPH_MAX_ITERATIONS:-100}"

mkdir -p "$LOG_DIR"

if [ ! -f ".ralph-security" ]; then
    echo "ERROR: Run /prd-build-loop first (creates .ralph-security)"
    exit 1
fi

if [ ! -f "$PLAN" ]; then
    echo "ERROR: No $PLAN — run /prd-build-loop to generate plan"
    exit 1
fi

REMAINING=$(grep -c "^\- \[ \]" "$PLAN" 2>/dev/null || echo "0")
if [ "$REMAINING" -eq 0 ]; then
    echo "✅ All tasks complete!"
    exit 0
fi

echo "════════════════════════════════════════"
echo "Ralph Loop — Operon"
echo "Tasks remaining: $REMAINING"
echo "════════════════════════════════════════"
echo ""
echo "Cursor mode: open NEW Agent chat each iteration with:"
echo ""
echo "  /prd-build-loop continue"
echo ""
echo "Or paste prompts/implement.md content manually."
echo ""
echo "Stop: touch .ralph-stop"
echo ""

ITERATION=0
while [ "$ITERATION" -lt "$MAX_ITERATIONS" ]; do
    if [ -f ".ralph-stop" ]; then
        echo "🛑 Stop file detected"
        rm -f .ralph-stop
        break
    fi

    REMAINING=$(grep -c "^\- \[ \]" "$PLAN" 2>/dev/null || echo "0")
    if [ "$REMAINING" -eq 0 ]; then
        echo "🎉 All tasks complete!"
        break
    fi

    FIRST_TASK=$(grep -m1 "^\- \[ \]" "$PLAN" || true)
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)

    echo "── Iteration $ITERATION ($TIMESTAMP) ──"
    echo "Next task: $FIRST_TASK"
    echo ""
    echo ">>> Waiting for Agent to complete this task in Cursor..."
    echo ">>> After done, press Enter to check progress (or Ctrl+C)"
    read -r _

    REMAINING_AFTER=$(grep -c "^\- \[ \]" "$PLAN" 2>/dev/null || echo "0")
    COMPLETED=$(grep -c "^\- \[x\]" "$PLAN" 2>/dev/null || echo "0")
    echo "Progress: $COMPLETED done, $REMAINING_AFTER remaining"
    echo "" >> "$LOG_DIR/ralph_$TIMESTAMP.log"
    echo "[$TIMESTAMP] iteration=$ITERATION remaining=$REMAINING_AFTER" >> "$LOG_DIR/ralph_$TIMESTAMP.log"

    if [ "$REMAINING_AFTER" -ge "$REMAINING" ]; then
        echo "⚠️  No progress this iteration — review .ralph-logs/"
    fi

    ITERING=$((ITERATION + 1))
    ITERATION=$ITERING
    sleep 1
done

echo ""
echo "Ralph harness finished. Logs: $LOG_DIR/"
