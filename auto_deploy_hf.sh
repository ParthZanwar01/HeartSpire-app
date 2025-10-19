#!/bin/bash
# Automated Hugging Face Deployment Script

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║       🚀 Automated Hugging Face Deployment                     ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if already logged in
if hf auth whoami &>/dev/null; then
    echo "✅ Already logged in to Hugging Face"
else
    echo "📝 You need a Hugging Face token to deploy"
    echo ""
    echo "Get your token here:"
    echo "👉 https://huggingface.co/settings/tokens"
    echo ""
    echo "Click 'New token' → Name it 'deploy' → Select 'Write' access → Create"
    echo ""
    
    # Try to open in browser
    if command -v open &>/dev/null; then
        read -p "🌐 Open token page in browser? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open "https://huggingface.co/settings/tokens"
        fi
    fi
    
    echo ""
    read -sp "🔑 Paste your Hugging Face token here: " HF_TOKEN
    echo ""
    
    # Login with token
    echo "$HF_TOKEN" | hf auth login --token "$HF_TOKEN" --add-to-git-credential
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully logged in!"
    else
        echo "❌ Login failed. Please check your token."
        exit 1
    fi
fi

echo ""
echo "📥 Cloning your Hugging Face Space..."
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

git clone https://huggingface.co/spaces/MathGenius01/vitamom-backend

if [ $? -ne 0 ]; then
    echo "❌ Failed to clone Space. Please check the URL and your permissions."
    exit 1
fi

cd vitamom-backend

echo "✅ Space cloned successfully"
echo ""

echo "📝 Updating ocr_approach.py with improvements..."

# Copy the improved file
cp /Users/parthzanwar/Desktop/HeartSpire-app/python-free-implementation/ocr_approach.py ./

if [ $? -eq 0 ]; then
    echo "✅ File updated"
else
    echo "❌ Failed to copy file"
    exit 1
fi

echo ""
echo "📊 Changes made:"
git diff --stat

echo ""
echo "💾 Committing changes..."
git add ocr_approach.py
git commit -m "Improve OCR: Add image preprocessing for better ingredient extraction

- Resize images to 1000px minimum for better OCR
- Enhance contrast by 2x
- Apply sharpening filter
- Use better Tesseract config (--oem 3 --psm 6)
- Improved error handling

Expected result: 10-18 ingredients found (vs 0 before)"

echo ""
echo "🚀 Pushing to Hugging Face..."
git push

if [ $? -eq 0 ]; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║  ✅ DEPLOYMENT SUCCESSFUL!                                    ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "🎉 Your improvements are now live!"
    echo ""
    echo "📱 Next steps:"
    echo "  1. Wait 2-3 minutes for Space to rebuild"
    echo "  2. Check: https://huggingface.co/spaces/MathGenius01/vitamom-backend"
    echo "  3. Open your app and scan a vitamin bottle"
    echo "  4. Should now find 10+ ingredients!"
    echo ""
    echo "🔍 Monitor rebuild:"
    echo "  https://huggingface.co/spaces/MathGenius01/vitamom-backend/logs"
    echo ""
else
    echo ""
    echo "❌ Push failed. Please check the error above."
    exit 1
fi

# Cleanup
cd /Users/parthzanwar/Desktop/HeartSpire-app
rm -rf "$TEMP_DIR"

echo "✅ Cleanup complete"
echo ""
echo "════════════════════════════════════════════════════════════════"

