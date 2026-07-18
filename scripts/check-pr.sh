#!/usr/bin/env bash
set -euo pipefail

required_paths=(
  ".github/pull_request_template.md"
  ".github/ISSUE_TEMPLATE/feature.md"
  ".github/ISSUE_TEMPLATE/change-request.md"
  ".github/ISSUE_TEMPLATE/bug.md"
  ".github/ISSUE_TEMPLATE/chore.md"
  ".github/ISSUE_TEMPLATE/docs.md"
)

for path in "${required_paths[@]}"; do
  if [ ! -s "$path" ]; then
    echo "Missing or empty pull request/issue template: $path" >&2
    exit 1
  fi
done

echo "Pull request policy check passed."
