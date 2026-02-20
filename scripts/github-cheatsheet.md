# GitHub Commit Cheatsheet

## Check what changed
```bash
cd /home/kburki/KTOO/ktt
git status
```

## Commit and push changes
```bash
git add .
git commit -m "Your message here"
git push origin main
```

## Example messages:
- `git commit -m "Fix tooltip positioning in daily breakdown"`
- `git commit -m "Add percentage display to analytics"`
- `git commit -m "Update analytics calculations"`

## View commit history
```bash
git log --oneline
```

## If you need to undo the last commit (before pushing)
```bash
git reset --soft HEAD~1
```
