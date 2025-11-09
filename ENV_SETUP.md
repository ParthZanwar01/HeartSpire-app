# Environment Variables Setup

## 🔐 Security Notice
Your OpenAI API key has been moved to environment variables and is now hidden from the GitHub repository!

## 📁 Files Created

1. **`.env`** - Contains your actual API keys (NOT committed to Git)
2. **`.env.example`** - Template file (CAN be committed to Git)
3. **`env.d.ts`** - TypeScript declarations for environment variables

## 🛠️ Local Development Setup

### Already Done ✅
- ✅ `.env` file created with your API key
- ✅ `.gitignore` already includes `.env` files
- ✅ `react-native-dotenv` installed
- ✅ Babel config updated
- ✅ All code files updated to use environment variables

### Your `.env` file contains:
```bash
OPENAI_API_KEY=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
BACKEND_URL=https://MathGenius01-vitamom-backend.hf.space
```

## ☁️ EAS Production Builds Setup

For production builds with EAS, you need to add the environment variables to EAS:

### Method 1: Using EAS CLI (Recommended)

```bash
# Create environment variable for production
eas env:create --scope project --name OPENAI_API_KEY --value "your-api-key-here" --visibility plaintext

# Verify it was created
eas env:list
```

### Method 2: Using Expo Dashboard

1. Go to https://expo.dev/accounts/themathgenius01/projects/vitamom/environment-variables
2. Click "Create variable"
3. Add:
   - Name: `OPENAI_API_KEY`
   - Value: Your API key
   - Environment: Select `production`
   - Visibility: `Plain text` (since it's used at build time)

## 🚀 Usage in Code

The code now imports from `@env`:

```typescript
import { OPENAI_API_KEY, BACKEND_URL } from '@env';
```

## 📝 For New Team Members

If someone clones this repo, they need to:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in their own API keys in `.env`

3. Install dependencies:
   ```bash
   npm install
   ```

4. Clear Metro bundler cache (important!):
   ```bash
   npm start -- --reset-cache
   ```

## 🔄 After Making Changes

If you update `.env` file, you must:

1. Stop Metro bundler (Ctrl+C)
2. Clear cache and restart:
   ```bash
   npm start -- --reset-cache
   ```

## ⚠️ Important Notes

- **NEVER** commit the `.env` file to Git
- **ALWAYS** use `.env.example` as a template (without real keys)
- Environment variables are embedded at build time, not runtime
- Changes to `.env` require Metro bundler restart with `--reset-cache`

## 🔒 What's Protected Now

The following files now use environment variables instead of hardcoded keys:
- ✅ `services/articlesService.ts`
- ✅ `components/VitaminSearch.tsx`
- ✅ `components/ScanIngredients.tsx`

## 📦 Next Steps

To set up EAS environment variables for production builds, run this in your terminal:

```bash
cd /Users/parthzanwar/Desktop/HeartSpire-app
eas env:create
```

Then follow the prompts to add `OPENAI_API_KEY`.

