# 🔥 Deploy to Appwrite - Complete Guide

## Appwrite Options

Appwrite is a Backend-as-a-Service (like Firebase). You can use it in two ways:

### Option 1: Appwrite Functions (Recommended!) ⭐
- **Cost**: FREE tier generous
- **Setup**: 10 minutes
- **Deploy**: Via CLI
- **Best for**: Serverless AI calls

### Option 2: Self-Hosted Appwrite + External Backend
- **Cost**: Server cost only
- **Setup**: 30 minutes
- **Best for**: Full control

---

## 🚀 Deploy as Appwrite Function (10 Minutes)

Appwrite Functions let you run serverless code triggered by HTTP requests!

### Step 1: Install Appwrite CLI

```bash
npm install -g appwrite-cli

# Or with brew
brew install appwrite
```

### Step 2: Login to Appwrite

```bash
appwrite login

# Enter your Appwrite endpoint and credentials
# Cloud: https://cloud.appwrite.io/v1
# Or your self-hosted URL
```

### Step 3: Initialize Function

```bash
cd /Users/parthzanwar/Desktop/HeartSpire-app

# Create functions directory
mkdir -p appwrite-functions/analyze-ingredients

cd appwrite-functions/analyze-ingredients

# Initialize function
appwrite init function

# Choose:
# - Runtime: Python 3.11
# - Name: analyze-ingredients
# - Entry point: main.py
```

### Step 4: Create Function Code

Create `appwrite-functions/analyze-ingredients/main.py`:

```python
import json
import base64
import tempfile
import os
import sys
from appwrite.client import Client
from appwrite.services.storage import Storage

def main(req, res):
    """
    Appwrite Function for vitamin ingredient analysis
    
    Request body:
    {
        "image": "base64_encoded_image"
    }
    
    Response:
    {
        "success": true,
        "ingredients": [...],
        "productName": "..."
    }
    """
    
    # Since we can't use LLaVA in serverless (too large),
    # we'll use a lightweight approach or call external API
    
    try:
        # Get request data
        payload = json.loads(req.payload) if req.payload else {}
        
        if 'image' not in payload:
            return res.json({
                'success': False,
                'error': 'No image provided'
            }, 400)
        
        image_data = payload['image']
        
        # Remove data URI prefix
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # For Appwrite functions, we have two options:
        
        # OPTION 1: Call external API (OpenAI)
        # This is simplest for serverless
        import urllib.request
        import urllib.parse
        
        # Use OpenAI (you'll need API key in env var)
        openai_key = os.environ.get('OPENAI_API_KEY', '')
        
        if openai_key:
            # Call OpenAI
            response = call_openai(image_data, openai_key)
            return res.json(response)
        
        # OPTION 2: Use lightweight OCR
        # (Tesseract might be too heavy for serverless)
        # Return error for now
        return res.json({
            'success': False,
            'error': 'OCR/LLaVA not available in serverless. Use OpenAI or deploy to Droplet.',
            'suggestion': 'Add OPENAI_API_KEY to function environment variables'
        }, 501)
    
    except Exception as e:
        return res.json({
            'success': False,
            'error': str(e)
        }, 500)


def call_openai(image_b64, api_key):
    """Call OpenAI Vision API"""
    import urllib.request
    
    request_data = json.dumps({
        'model': 'gpt-4o',
        'messages': [{
            'role': 'user',
            'content': [
                {'type': 'text', 'text': 'Extract all vitamin ingredients and amounts from this label. Return JSON: {"productName":"...","ingredients":[{"name":"...","amount":"...","unit":"..."}]}'},
                {'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{image_b64}'}}
            ]
        }],
        'max_tokens': 1000
    }).encode()
    
    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=request_data,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        }
    )
    
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read())
    
    content = data['choices'][0]['message']['content']
    
    # Parse JSON from response
    import re
    json_match = re.search(r'\{[\s\S]*\}', content)
    if json_match:
        parsed = json.loads(json_match.group(0))
        return {'success': True, **parsed}
    
    return {'success': False, 'error': 'Could not parse response'}
```

Create `appwrite-functions/analyze-ingredients/requirements.txt`:
```txt
appwrite==4.0.0
requests==2.31.0
```

### Step 5: Deploy Function

```bash
cd appwrite-functions/analyze-ingredients

# Deploy
appwrite deploy function

# Get function URL
appwrite get function --functionId analyze-ingredients
```

Your function URL will be something like:
`https://cloud.appwrite.io/v1/functions/[function-id]/executions`

### Step 6: Set Environment Variables

```bash
# Add OpenAI API key to function
appwrite create variable \
  --functionId analyze-ingredients \
  --key OPENAI_API_KEY \
  --value sk-your-openai-key
```

---

## 🔧 Better Approach: Appwrite + External Backend

Since LLaVA is too large for serverless, use this hybrid:

### Architecture:
```
iOS App
  ↓
Appwrite (Auth, Database, Storage)
  ↓
External Backend on DigitalOcean Droplet
  ↓  
LLaVA for FREE AI
```

### Setup:

**1. Use Appwrite for**:
- User authentication
- Store scan history
- File storage (vitamin photos)
- Database (user data)

**2. Use DigitalOcean Droplet for**:
- Python backend with LLaVA
- Heavy AI processing
- Image analysis

**3. Connect them**:

In your React Native app:
```typescript
// Use Appwrite SDK for auth and storage
import { Client, Account, Storage } from 'appwrite';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('your-project-id');

// Upload image to Appwrite
const storage = new Storage(client);
const file = await storage.createFile('bucket-id', 'unique-id', imageFile);

// Send to your DigitalOcean backend for analysis
const result = await fetch('http://your-droplet-ip:5000/analyze', {
  method: 'POST',
  body: JSON.stringify({ imageUrl: file.$id })
});
```

---

## 💰 Cost Comparison

### Appwrite Functions + OpenAI:
- Appwrite: FREE (generous tier)
- OpenAI: $0.01/scan
- **Total**: ~$10/month at 1000 scans

### Appwrite + DigitalOcean Droplet:
- Appwrite: FREE
- Droplet: $4/month
- **Total**: $4/month (unlimited scans!)

### Just DigitalOcean App Platform:
- **Total**: $5/month (simpler setup!)

---

## 🎯 My Recommendation

Since you have **both** DigitalOcean and Appwrite:

### Best Setup:

**For Small App (<1000 scans/month)**:
```
DigitalOcean App Platform ($5/month)
  ↓
Simple, all-in-one
No complexity
```

**For Growing App (1000+ scans/month)**:
```
Appwrite (FREE)           DigitalOcean Droplet ($4/month)
    ↓                              ↓
Auth, Storage, DB          Python + LLaVA AI
    ↓                              ↓
        Both together = $4/month total!
```

**For Maximum Features**:
```
Appwrite (FREE)
  • User auth
  • Database
  • File storage
  • Real-time sync
  
DigitalOcean Droplet ($4/month)
  • LLaVA AI backend
  • Image processing
  • Heavy compute
  
Total: $4/month + amazing features!
```

---

## 🚀 Quick Start: DigitalOcean App Platform

**This is your simplest option:**

```bash
cd /Users/parthzanwar/Desktop/HeartSpire-app

# 1. Create config
mkdir -p python-free-implementation/.do

cat > python-free-implementation/.do/app.yaml << 'EOF'
name: vitamom-backend
services:
  - name: api
    environment_slug: python
    source_dir: /python-free-implementation
    build_command: pip install -r requirements.txt
    run_command: gunicorn production_server:app
    instance_size_slug: basic-xxs
EOF

# 2. Push to GitHub
git add .
git commit -m "Add DO config"
git push

# 3. Deploy
# Go to: https://cloud.digitalocean.com/apps
# Click "Create App" → GitHub → Your repo
# DigitalOcean auto-detects config!
```

**Done!** Your backend is live at:
`https://vitamom-backend-xxxxx.ondigitalocean.app`

**Cost**: $5/month
**Setup time**: 5 minutes
**No cold starts**: Always fast!

---

## 📋 Deployment Checklist

### Pre-Deploy:
- [x] `production_server.py` created
- [x] `requirements.txt` created
- [x] `Procfile` created
- [x] `.do/app.yaml` created
- [ ] Code pushed to GitHub

### Deploy:
- [ ] Go to DigitalOcean dashboard
- [ ] Create App
- [ ] Connect GitHub repo
- [ ] Deploy!
- [ ] Get backend URL

### Post-Deploy:
- [ ] Test: `curl https://your-url.ondigitalocean.app/health`
- [ ] Update `ScanIngredients.tsx` with URL
- [ ] Build iOS app
- [ ] Test on iPhone!

---

## 🎉 Summary

**You have DigitalOcean!** Perfect - here's what to do:

**Simplest**: DigitalOcean App Platform ($5/month)
- 5 minutes to deploy
- No cold starts
- Just works!

**Most Features**: Appwrite + DO Droplet ($4/month)
- Appwrite for auth/storage (free!)
- Droplet for AI (cheap!)
- Best value!

**Choose and deploy!** 🚀

**Read: `DEPLOY_DIGITALOCEAN.md` for complete instructions**

