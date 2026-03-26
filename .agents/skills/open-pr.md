# Open PR

Open a pull request for the current branch with a clean title, a useful
description, and enough verification context for reviewers.

## Instructions

1. **Check branch state**:
   - confirm the current branch
   - confirm it is not the default branch
   - inspect `git status --short`
   - inspect the diff against the intended base branch

2. **Sanity-check what is being proposed**:
   - summarize the user-facing change
   - look for accidental unrelated edits
   - if the branch mixes unrelated work, stop and say so

3. **Run the relevant verification**:
   - tests
   - lint
   - typecheck
   - build

   Use the repo's actual commands. If something cannot be run, say so in the PR body.

4. **Push the branch** if needed:

   ```bash
   git push -u origin <branch>
   ```

5. **Write a good PR title**:
   - short
   - specific
   - outcome-oriented
   - neutral in tone

6. **Write a useful PR body** with:
   - what changed
   - why it changed
   - any important design choice or tradeoff
   - verification performed
   - any remaining risk or follow-up

7. **Open the PR**:

   ```bash
   gh pr create
   ```

   Prefer an explicit title/body rather than interactive editing.

8. **After opening**, fetch the PR URL/number and report it back.

## Guidelines

- Do not mention internal tool provenance unless the user wants that.
- Do not hide failing checks or missing verification.
- Keep the title/body reviewer-friendly, not changelog-like.
- If the repo has a PR template, follow it.
