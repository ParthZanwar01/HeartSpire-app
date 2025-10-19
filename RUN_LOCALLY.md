# 💻 Run Backend Locally - Simplest Option!

## ✅ Zero Deployment Needed!

Instead of deploying to a server, run the backend on your Mac and connect from your iPhone over WiFi!

**Perfect for**:
- Development and testing
- No deployment hassle
- 100% FREE
- Works immediately

---

## 🚀 3 Simple Steps

### STEP 1: Start Python Backend (30 seconds)

Open terminal and run:

```bash
cd /Users/parthzanwar/Desktop/HeartSpire-app/python-free-implementation

# Activate virtual environment
source venv/bin/activate

# Start server
python production_server.py
```

**You'll see**:
```
🚀 Starting VitaMom Ingredient Extraction API
============================================================
✅ OCR loaded successfully
============================================================

Server starting on http://0.0.0.0:5000
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
 * Running on http://192.168.1.X:5000  ← USE THIS IP!
```

**IMPORTANT**: Look for the line with `192.168.1.X` - that's your local IP address!

**Copy that IP**: `192.168.1.X`

---

### STEP 2: Update React Native App (1 minute)

**Open**: `components/ScanIngredients.tsx`

**Line 30-31**, update to:

```typescript
const USE_BACKEND = true;
const BACKEND_URL = 'http://192.168.1.X:5000';  // YOUR IP HERE!
```

**Line 38**:
```typescript
const USE_MOCK = false;
```

**Replace `192.168.1.X` with your actual IP from Step 1!**

**Save the file!**

---

### STEP 3: Run Your App (30 seconds)

**In a NEW terminal window**:

```bash
cd /Users/parthzanwar/Desktop/HeartSpire-app

# Start app
npm start
```

**On your iPhone**:
1. Make sure iPhone is on **same WiFi** as your Mac
2. Open Expo Go app
3. Scan QR code
4. App loads!
5. Go to Scan tab
6. Take vitamin photo
7. **See REAL AI results!** 🎉

---

## ✅ That's It!

**No deployment needed!**  
**No Railway login!**  
**No DigitalOcean setup!**

Just:
1. ✅ Run Python server on your Mac
2. ✅ Update app with your Mac's IP
3. ✅ Test on iPhone!

**Cost**: $0  
**Time**: 2 minutes  
**Works**: Immediately!

---

## 💡 Important Tips

### Find Your Mac's IP Address

If you can't see it in the Python output:

```bash
# Method 1: Easy way
ifconfig | grep "inet " | grep -v 127.0.0.1

# Method 2: System Preferences
# System Preferences → Network → WiFi → Your IP is shown
```

Should look like:
- `192.168.1.5`
- `192.168.0.10`
- `10.0.0.5`

### Keep Both Terminals Running

**Terminal 1**: Python server (keep running!)
```bash
python production_server.py
# Don't close this!
```

**Terminal 2**: React Native app
```bash
npm start
```

### Make Sure Same WiFi

- Your Mac and iPhone must be on the **same WiFi network**
- Won't work on cellular data
- Won't work if iPhone is on different WiFi

---

## 🎯 When to Deploy to Cloud

Use local backend for:
- ✅ Development
- ✅ Testing
- ✅ Demos
- ✅ Learning how it works

Deploy to cloud (Railway/DigitalOcean) when:
- ❌ You need it to work from anywhere
- ❌ You want it always running
- ❌ You're launching to real users

**For now, local is perfect!** 🎉

---

## 🆘 Troubleshooting

### "Connection refused" in app?

**Check**:
1. Python server is running (Terminal 1)
2. IP address is correct in `ScanIngredients.tsx`
3. Both devices on same WiFi
4. Use `http://` not `https://`

**Fix**:
```bash
# Get your IP again
ifconfig | grep "inet " | grep -v 127.0.0.1

# Update ScanIngredients.tsx with correct IP
```

### "Module not found" when starting server?

```bash
# Install dependencies
cd python-free-implementation
source venv/bin/activate
pip install flask flask-cors gunicorn requests pillow
```

### Can't find your IP?

```bash
# This will show it clearly
python3 -c "import socket; print(socket.gethostbyname(socket.gethostname()))"
```

---

## ✨ Ready to Start!

**Open 2 terminal windows and run:**

**Terminal 1** (Python Backend):
```bash
cd /Users/parthzanwar/Desktop/HeartSpire-app/python-free-implementation
source venv/bin/activate
python production_server.py
```

**Terminal 2** (React Native App):
```bash
cd /Users/parthzanwar/Desktop/HeartSpire-app
npm start
```

**Then use your iPhone to scan QR code and test!** 🎉

Want me to start the Python server for you?

