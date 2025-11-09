# Security Checklist ✅

## Before Pushing to GitHub

- [ ] Verify `.env` is in `.gitignore`
- [ ] Check that no API keys are hardcoded in source files
- [ ] Ensure `.env.example` doesn't contain real keys
- [ ] Review git status before committing

## Quick Check Command

Run this to check for exposed keys:
```bash
# Check if .env is ignored
git check-ignore .env

# Search for potential API keys in tracked files (should return nothing)
git grep -i "sk-proj-"
git grep -i "api.key"
```

## If You Accidentally Committed a Key

1. **Immediately revoke** the exposed API key at https://platform.openai.com/api-keys
2. Generate a new API key
3. Update your `.env` file
4. Remove the key from git history:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/file" \
     --prune-empty --tag-name-filter cat -- --all
   ```
5. Force push (⚠️ dangerous - coordinate with team):
   ```bash
   git push origin --force --all
   ```

## Best Practices

✅ **DO:**
- Use environment variables for all secrets
- Keep `.env` file local only
- Rotate API keys periodically
- Use different keys for development and production
- Set up EAS secrets for production builds

❌ **DON'T:**
- Commit `.env` files
- Share API keys in Slack/email
- Use production keys in development
- Hardcode secrets in code
- Include secrets in screenshots or logs

## Current Status

🔒 **Protected:** All API keys are now in environment variables
🔒 **Hidden:** `.env` is in `.gitignore`
✅ **Safe:** Code uses `import from '@env'`

