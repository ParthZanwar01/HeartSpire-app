# 🚀 Deploy to Hugging Face Now!

I've created an **automated script** that will do everything for you!

## ⚡ Quick Deploy (2 minutes)

### Step 1: Get Your Hugging Face Token

1. Go to: https://huggingface.co/settings/tokens
2. Click **"New token"**
3. Name it: `deploy`
4. Select: **"Write"** access
5. Click **"Create"**
6. Copy the token (starts with `hf_...`)

### Step 2: Run The Script

Open Terminal and run:

```bash
cd /Users/parthzanwar/Desktop/HeartSpire-app
./auto_deploy_hf.sh
```

The script will:
- ✅ Ask for your token (paste it when prompted)
- ✅ Clone your Hugging Face Space
- ✅ Update ocr_approach.py with improvements
- ✅ Commit the changes
- ✅ Push to Hugging Face
- ✅ Clean up afterwards

### Step 3: Wait & Test

- Wait 2-3 minutes for Space to rebuild
- Open your app
- Scan a vitamin bottle
- Should now find 10+ ingredients! 🎉

---

## 🔒 Security Note

Your token will be stored securely in your git credentials. The script only uses it to authenticate the push to your Space.

---

## 📝 What Gets Deployed

The improved `ocr_approach.py` with:
- ✅ Image resizing (1000px min)
- ✅ Contrast enhancement (2x)
- ✅ Sharpening filter
- ✅ Better Tesseract config
- ✅ Improved error handling

**Expected result:** 10-18 ingredients found (vs 0 before)

---

## ⚠️ Troubleshooting

**"Failed to clone"**
- Make sure you're logged in to Hugging Face
- Check the Space exists: https://huggingface.co/spaces/MathGenius01/vitamom-backend

**"Push failed"**
- Token might not have write access
- Create a new token with "Write" permissions

**"Command not found: hf"**
- The script will install it automatically

---

## 🎯 Alternative: Manual Deploy

If you prefer to do it manually, see: `HUGGINGFACE_DEPLOY_INSTRUCTIONS.md`

---

**Ready?** Run this command:

```bash
./auto_deploy_hf.sh
```

🚀 The script will guide you through everything!

