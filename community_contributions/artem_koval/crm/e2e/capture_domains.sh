#!/usr/bin/env bash
# Captures the desk screenshots for every domain pack. For each pack the
# script seeds the database, starts the dev stack, waits for the health
# check, captures the five desk shots, and stops the stack. Run from crm/:
#   bash e2e/capture_domains.sh
# Set PACKS="insurance library" to capture a subset, and OUT_ROOT to change
# the output root. The shots land in $OUT_ROOT/<pack>/r1..r5*.png.
set -euo pipefail

PACKS="${PACKS:-insurance helpdesk opsdemo library garage}"
OUT_ROOT="${OUT_ROOT:-docs/screenshots}"
# 127.0.0.1, not localhost: the dev auth service allows exactly the
# 127.0.0.1 origin, so a localhost visit fails the sign-in CORS check.
BASE_URL="${BASE_URL:-http://127.0.0.1:5173}"

if ! curl -fsS http://localhost:8000/api/health >/dev/null 2>&1; then
  STACK_DOWN=1
else
  echo "A stack already listens on 8000. Stop it before the capture." >&2
  exit 1
fi

# The npm scripts load --env-file .env. A fresh clone has none until the
# student copies the example.
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Copied .env.example to .env."
fi

for PACK in $PACKS; do
  echo "== $PACK"
  CRM_DOMAIN="$PACK" npm run seed
  LOG="/tmp/crm-dev-${PACK}.log"
  setsid env CRM_DOMAIN="$PACK" npm run dev >"$LOG" 2>&1 &
  STACK_PID=$!
  trap 'kill -- -"$STACK_PID" 2>/dev/null || true' EXIT INT TERM

  READY=0
  for _ in $(seq 1 90); do
    if curl -fsS http://localhost:8000/api/health >/dev/null 2>&1 \
      && curl -fsS "$BASE_URL" >/dev/null 2>&1; then
      READY=1
      break
    fi
    sleep 1
  done
  if [ "$READY" -ne 1 ]; then
    echo "The $PACK stack did not come up. Read $LOG." >&2
    exit 1
  fi

  CRM_DOMAIN="$PACK" SHOT_DIR="$OUT_ROOT/$PACK" BASE_URL="$BASE_URL" \
    node e2e/capture_real.mjs

  kill -- -"$STACK_PID" 2>/dev/null || true
  wait "$STACK_PID" 2>/dev/null || true
  trap - EXIT INT TERM
  sleep 2
  echo "== $PACK done: $OUT_ROOT/$PACK"
done

echo "Captured every pack into $OUT_ROOT"
