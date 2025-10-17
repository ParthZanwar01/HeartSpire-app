# 🌊 Deploy to DigitalOcean - Complete Guide

## DigitalOcean Options

### Option 1: App Platform (Easiest - Like Render) ⭐
- **Cost**: $5/month (cheapest tier)
- **Setup**: 5 minutes
- **Auto-deploy**: Yes (from GitHub)
- **Best for**: Simple deployment

### Option 2: Droplet (Most Flexible)
- **Cost**: $4-6/month (basic droplet)
- **Setup**: 15 minutes
- **Control**: Full server access
- **Best for**: Custom configuration

### Option 3: Functions (Serverless)
- **Cost**: Pay per use (~$0.0000024 per request)
- **Setup**: 10 minutes
- **Scale**: Auto-scales to zero
- **Best for**: Variable traffic

---

## 🚀 Deploy to DigitalOcean App Platform (5 Minutes)

### Step 1: Prepare Code

Your code is ready! Just need to add one file:

Create `python-free-implementation/.do/app.yaml`:

```yaml
name: vitamom-backend
region: nyc

services:
  - name: api
    environment_slug: python
    github:
      repo: your-username/HeartSpire-app
      branch: main
      deploy_on_push: true
    source_dir: /python-free-implementation
    
    build_command: pip install -r requirements.txt
    run_command: gunicorn production_server:app --bind 0.0.0.0:$PORT --timeout 120
    
    http_port: 8080
    
    instance_count: 1
    instance_size_slug: basic-xxs  # $5/month
    
    routes:
      - path: /
    
    envs:
      - key: PYTHON_VERSION
        value: "3.11.0"
```

### Step 2: Deploy

**Via GitHub** (Easiest):

1. Push to GitHub:
```bash
cd /Users/parthzanwar/Desktop/HeartSpire-app
git add .
git commit -m "Add DigitalOcean config"
git push
```

2. Go to https://cloud.digitalocean.com/apps
3. Click "Create App"
4. Select "GitHub" → Choose your repo
5. DigitalOcean auto-detects `.do/app.yaml`!
6. Click "Next" → "Skip to Review"
7. Click "Create Resources"

**Done! URL**: `https://vitamom-backend-xxxxx.ondigitalocean.app`

**Or via doctl CLI**:
```bash
# Install doctl
brew install doctl

# Authenticate
doctl auth init

# Deploy
cd /Users/parthzanwar/Desktop/HeartSpire-app/python-free-implementation
doctl apps create --spec .do/app.yaml
```

---

## 🖥️ Deploy to DigitalOcean Droplet (Full Control)

### Step 1: Create Droplet

```bash
# Via Web UI
# 1. Go to https://cloud.digitalocean.com/droplets
# 2. Click "Create Droplet"
# 3. Choose:
#    - Ubuntu 22.04
#    - Basic plan: $4/month
#    - Region: Nearest to you
# 4. Add SSH key
# 5. Create!

# Or via doctl
doctl compute droplet create vitamom-backend \
  --image ubuntu-22-04-x64 \
  --size s-1vcpu-1gb \
  --region nyc1
```

### Step 2: Setup Server

SSH into your droplet:
```bash
ssh root@your-droplet-ip
```

Run setup script:
```bash
# Update system
apt-get update && apt-get upgrade -y

# Install Python
apt-get install -y python3 python3-pip python3-venv

# Install Ollama (for LLaVA)
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama
ollama serve &

# Download LLaVA model
ollama pull llava

# Install Nginx (reverse proxy)
apt-get install -y nginx

# Install supervisor (keep app running)
apt-get install -y supervisor
```

### Step 3: Deploy Your App

```bash
# Clone your repo
cd /var/www
git clone https://github.com/your-username/HeartSpire-app.git
cd HeartSpire-app/python-free-implementation

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn

# Test it works
python production_server.py
# Press Ctrl+C after confirming it works
```

### Step 4: Configure Supervisor

Create `/etc/supervisor/conf.d/vitamom.conf`:

```ini
[program:vitamom-backend]
directory=/var/www/HeartSpire-app/python-free-implementation
command=/var/www/HeartSpire-app/python-free-implementation/venv/bin/gunicorn production_server:app --bind 0.0.0.0:5000 --workers 2 --timeout 120
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/vitamom/err.log
stdout_logfile=/var/log/vitamom/out.log
```

```bash
# Create log directory
mkdir -p /var/log/vitamom

# Start service
supervisorctl reread
supervisorctl update
supervisorctl start vitamom-backend
```

### Step 5: Configure Nginx

Create `/etc/nginx/sites-available/vitamom`:

```nginx
server {
    listen 80;
    server_name your-droplet-ip;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # For large images
        client_max_body_size 10M;
        
        # Longer timeout for AI processing
        proxy_read_timeout 120s;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/vitamom /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

**Done!** Backend running at `http://your-droplet-ip`

---

## 📱 Deploy to DigitalOcean Functions (Serverless)

### Step 1: Install doctl

```bash
brew install doctl
doctl auth init
```

### Step 2: Create Function

Create `python-free-implementation/packages/vitamom/analyze/__main__.py`:

```python
def main(args):
    """
    DigitalOcean Function for ingredient analysis
    
    Args from HTTP request:
    {
        "image": "base64_encoded_image"
    }
    """
    import json
    import base64
    import tempfile
    import os
    
    # Note: LLaVA won't work in serverless (too large)
    # Use OCR instead
    
    try:
        from ocr_approach import OCRIngredientExtractor
        
        image_data = args.get('image', '')
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name
        
        extractor = OCRIngredientExtractor()
        result = extractor.analyze_image(tmp_path)
        
        os.unlink(tmp_path)
        
        return {
            "body": result,
            "statusCode": 200
        }
    
    except Exception as e:
        return {
            "body": {"success": False, "error": str(e)},
            "statusCode": 500
        }
```

Create `project.yml`:
```yaml
packages:
  - name: vitamom
    environment:
      PYTHON_VERSION: "3.11"
    functions:
      - name: analyze
        runtime: python:3.11
```

Deploy:
```bash
cd python-free-implementation
doctl serverless deploy .
```

---

## 💰 Cost Comparison

### DigitalOcean Pricing:

| Option | Cost | Best For |
|--------|------|----------|
| **App Platform** | $5/month | Always-on, simple |
| **Droplet** | $4-6/month | Full control |
| **Functions** | ~$0.001/scan | Variable traffic |

### vs Other Options:

| Service | Cost |
|---------|------|
| DigitalOcean App | $5/month |
| DigitalOcean Droplet | $4/month |
| Render Free | $0 (with cold starts) |
| Railway Free | ~$0 (limited hours) |
| OpenAI API | $10/month (1000 scans) |

**Best value**: DigitalOcean Droplet at $4/month!

---

## 🎯 My Recommendation for You

Since you already have DigitalOcean:

### Best Option: App Platform ($5/month)

**Why**:
- ✅ Easiest deployment (like Render)
- ✅ Auto-deploy from GitHub
- ✅ No server management
- ✅ $5/month flat rate
- ✅ Better than Render (no cold starts!)

**How**:
1. Push code to GitHub
2. Create app on DigitalOcean
3. Deploy!

### Alternative: Droplet ($4/month)

**Why**:
- ✅ Cheapest option ($4 vs $5)
- ✅ Full control
- ✅ Can run multiple services
- ✅ Better performance

**But**:
- ⚠️ More setup (15 min vs 5 min)
- ⚠️ Manual server management

---

## 🚀 Deploy to App Platform NOW!

```bash
cd /Users/parthzanwar/Desktop/HeartSpire-app

# 1. Create the config file
mkdir -p python-free-implementation/.do
cat > python-free-implementation/.do/app.yaml << 'EOF'
name: vitamom-backend
region: nyc
services:
  - name: api
    environment_slug: python
    source_dir: /python-free-implementation
    build_command: pip install -r requirements.txt
    run_command: gunicorn production_server:app
    http_port: 8080
    instance_count: 1
    instance_size_slug: basic-xxs
EOF

# 2. Commit and push
git add .
git commit -m "Add DigitalOcean deployment config"
git push

# 3. Go to DigitalOcean dashboard
# https://cloud.digitalocean.com/apps
# Click "Create App" → Connect repo
```

**Done in 5 minutes! URL**: `https://vitamom-backend.ondigitalocean.app`

---

## 🎉 Summary

**You have DigitalOcean?** Perfect!

**Best option**: App Platform
- **Cost**: $5/month
- **Setup**: 5 minutes
- **No cold starts** (better than free options!)
- **Auto-deploy** from GitHub

**Alternative**: Droplet
- **Cost**: $4/month
- **Setup**: 15 minutes
- **Full control**

**Both are excellent and affordable!**

Ready to deploy? Follow the App Platform steps above! 🚀

**Read: `DEPLOY_DIGITALOCEAN.md` for complete guide**

