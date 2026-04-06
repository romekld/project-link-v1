#!/usr/bin/env bash
# Claude Code status line for project-link
# Shows: git branch | model name | context usage % | effort indicator

input=$(cat)

# --- Git branch (skip optional locks to avoid conflicts) ---
cwd=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // ""')
git_branch=$(git -C "$cwd" --no-optional-locks rev-parse --abbrev-ref HEAD 2>/dev/null)

# --- Model ---
model=$(echo "$input" | jq -r '.model.display_name // .model.id // "Unknown"')

# --- Context usage (pre-calculated field) ---
used_pct=$(echo "$input" | jq -r '.context_window.used_percentage // empty')

# --- Effort: output tokens as share of total tokens generated this session ---
total_in=$(echo "$input"  | jq -r '.context_window.total_input_tokens  // 0')
total_out=$(echo "$input" | jq -r '.context_window.total_output_tokens // 0')

# Assemble parts array
parts=()

# 1) Git branch (cyan)
if [ -n "$git_branch" ]; then
  printf -v branch_part "\033[36m\ue0a0 %s\033[0m" "$git_branch"
  parts+=("$branch_part")
fi

# 2) Model name (magenta)
printf -v model_part "\033[35m%s\033[0m" "$model"
parts+=("$model_part")

# 3) Context usage with traffic-light coloring
if [ -n "$used_pct" ]; then
  used_int=$(printf "%.0f" "$used_pct")
  if   [ "$used_int" -ge 80 ]; then color="\033[31m"   # red
  elif [ "$used_int" -ge 50 ]; then color="\033[33m"   # yellow
  else                               color="\033[32m"   # green
  fi
  printf -v ctx_part "${color}ctx %s%%\033[0m" "$used_int"
  parts+=("$ctx_part")
fi

# 4) Effort level (blue) — output tokens as % of all tokens
total=$(( total_in + total_out ))
if [ "$total" -gt 0 ]; then
  effort_pct=$(( total_out * 100 / total ))
  if   [ "$effort_pct" -ge 30 ]; then effort_label="high"
  elif [ "$effort_pct" -ge 12 ]; then effort_label="med"
  else                                 effort_label="low"
  fi
  printf -v effort_part "\033[34meffort:%s\033[0m" "$effort_label"
  parts+=("$effort_part")
fi

# Join with a dim bullet separator
sep=$(printf "\033[2m \xe2\x80\xa2 \033[0m")
result=""
for i in "${!parts[@]}"; do
  [ "$i" -gt 0 ] && result+="$sep"
  result+="${parts[$i]}"
done

printf "%b" "$result"
