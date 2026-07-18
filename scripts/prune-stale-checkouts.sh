#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
config_path="$repo_root/.ai-flow.yml"

cd "$repo_root"

if ! config_output="$(bash "$repo_root/scripts/check-ai-flow-config.sh" "$config_path" 2>&1)"; then
  printf '%s\n' "$config_output" >&2
  exit 1
fi

if [[ "$config_output" =~ Git[[:space:]]CLI:[[:space:]](gh|glab)([^A-Za-z0-9_-]|$) ]]; then
  git_cli="${BASH_REMATCH[1]}"
else
  printf 'Unable to parse git CLI from config validator output: %s\n' "$config_output" >&2
  exit 1
fi

current_branch="$(git branch --show-current)"
default_branch=""
origin_head="$(git symbolic-ref -q --short refs/remotes/origin/HEAD 2>/dev/null || true)"
if [[ -n "$origin_head" ]]; then
  default_branch="${origin_head#origin/}"
else
  printf 'Unable to determine default branch from refs/remotes/origin/HEAD. Run `git remote set-head origin --auto` and retry.\n' >&2
  exit 1
fi

worktree_lookup=""
worktree_path=""

while IFS= read -r line; do
  case "$line" in
    worktree\ *)
      worktree_path="${line#worktree }"
      ;;
    branch\ refs/heads/*)
      branch_name="${line#branch refs/heads/}"
      worktree_lookup+="$branch_name"$'\t'"$worktree_path"$'\n'
      ;;
  esac
done < <(git worktree list --porcelain)

worktree_for_branch() {
  lookup_branch="$1"
  while IFS=$'\t' read -r map_branch map_path; do
    if [[ "$map_branch" == "$lookup_branch" ]]; then
      printf '%s\n' "$map_path"
      return 0
    fi
  done <<<"$worktree_lookup"

  return 1
}

is_protected_branch() {
  case "$1" in
    "$current_branch"|main|master|"$default_branch")
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

is_merged_to_default() {
  branch_name="$1"
  git merge-base --is-ancestor "$branch_name" "refs/remotes/origin/$default_branch"
}

has_active_remote_mr() {
  branch_name="$1"

  case "$git_cli" in
    gh)
      gh_output="$(gh pr list --state open --head "$branch_name" --json number --jq 'length > 0')"
      [[ "$gh_output" == "true" ]]
      ;;
    glab)
      glab_output="$(glab mr list --source-branch "$branch_name" -F json)"
      compact_glab_output="$(tr -d '[:space:]' <<<"$glab_output")"
      grep -Fq "\"source_branch\":\"$branch_name\"" <<<"$compact_glab_output" || grep -Fq "\"sourceBranch\":\"$branch_name\"" <<<"$compact_glab_output"
      ;;
    *)
      printf 'Unsupported git CLI: %s\n' "$git_cli" >&2
      exit 1
      ;;
  esac
}

while IFS= read -r branch_name; do
  [[ -n "$branch_name" ]] || continue

  if is_protected_branch "$branch_name"; then
    continue
  fi

  if has_active_remote_mr "$branch_name"; then
    continue
  fi

  if ! is_merged_to_default "$branch_name"; then
    printf 'Skipping unmerged branch: %s\n' "$branch_name"
    continue
  fi

  worktree_path="$(worktree_for_branch "$branch_name" || true)"
  if [[ -n "$worktree_path" && "$worktree_path" != "$repo_root" ]]; then
    printf 'Removing worktree: %s (%s)\n' "$worktree_path" "$branch_name"
    git worktree remove "$worktree_path"
  fi

  printf 'Deleting branch: %s\n' "$branch_name"
  git branch -D "$branch_name"
done < <(git for-each-ref refs/heads --format='%(refname:short)')