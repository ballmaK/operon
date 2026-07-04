#!/bin/bash
# Minimal test output for Ralph loop (token budget)
TEST_COMMAND="${TEST_COMMAND:-pnpm test}"

RESULT=$($TEST_COMMAND 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "✓ All tests passed"
else
    echo "✗ Tests failed:"
    echo "$RESULT" | grep -A 10 -i "FAIL\|Error\|error:\|FAILED\|panic" | head -30
fi

exit $EXIT_CODE
