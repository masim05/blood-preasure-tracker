#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
validator="$repo_root/scripts/check-ai-flow-config.sh"
tmp_dir="$(mktemp -d)"

trap 'rm -rf "$tmp_dir"' EXIT

assert_success() {
  name="$1"
  expected="$2"
  shift 2

  if ! output="$(bash "$validator" "$@" 2>&1)"; then
    printf 'FAIL %s: expected success, got failure:\n%s\n' "$name" "$output" >&2
    exit 1
  fi

  if [[ "$output" != *"$expected"* ]]; then
    printf 'FAIL %s: expected output to contain %q, got:\n%s\n' "$name" "$expected" "$output" >&2
    exit 1
  fi
}

assert_failure() {
  name="$1"
  expected="$2"
  shift 2

  set +e
  output="$(bash "$validator" "$@" 2>&1)"
  exit_code=$?
  set -e

  if [[ $exit_code -eq 0 ]]; then
    printf 'FAIL %s: expected failure, got success:\n%s\n' "$name" "$output" >&2
    exit 1
  fi

  if [[ "$output" != *"$expected"* ]]; then
    printf 'FAIL %s: expected output to contain %q, got:\n%s\n' "$name" "$expected" "$output" >&2
    exit 1
  fi
}

write_config() {
  path="$1"
  content="$2"
  printf '%s\n' "$content" > "$path"
}

missing_config="$tmp_dir/missing.yml"
assert_success "missing config" "Communication language: en, Git CLI: glab" "$missing_config"

language_only_config="$tmp_dir/language-only.yml"
write_config "$language_only_config" "version: 1

gitlab:
  language: pt-BR"
assert_success "language without git cli" "Communication language: pt-BR, Git CLI: glab" "$language_only_config"

explicit_glab_config="$tmp_dir/glab.yml"
write_config "$explicit_glab_config" "version: 1

git:
  cli: glab

gitlab:
  language: en"
assert_success "explicit glab" "Communication language: en, Git CLI: glab" "$explicit_glab_config"

explicit_gh_config="$tmp_dir/gh.yml"
write_config "$explicit_gh_config" "version: 1

git:
  cli: gh

gitlab:
  language: en"
assert_success "explicit gh" "Communication language: en, Git CLI: gh" "$explicit_gh_config"

duplicate_git_cli_config="$tmp_dir/duplicate-git-cli.yml"
write_config "$duplicate_git_cli_config" "version: 1

git:
  cli: gh
  cli: glab"
assert_failure "duplicate git cli" "Duplicate .ai-flow.yml key: git.cli" "$duplicate_git_cli_config"

malformed_nesting_config="$tmp_dir/malformed-nesting.yml"
write_config "$malformed_nesting_config" "version: 1
cli: gh"
assert_failure "malformed nesting" "Malformed .ai-flow.yml" "$malformed_nesting_config"

invalid_git_cli_config="$tmp_dir/invalid-git-cli.yml"
write_config "$invalid_git_cli_config" "version: 1

git:
  cli: svn"
assert_failure "invalid git cli" "Invalid git.cli: svn" "$invalid_git_cli_config"

invalid_language_config="$tmp_dir/invalid-language.yml"
write_config "$invalid_language_config" "version: 1

gitlab:
  language: english!"
assert_failure "invalid language" "Invalid gitlab.language: english!" "$invalid_language_config"

printf 'AI flow config integration check passed.\n'