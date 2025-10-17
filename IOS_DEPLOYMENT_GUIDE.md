# 🚀 Running AI on iOS - Deployment Guide

## Two Options for Production

### Option 1: Python Backend Server (FREE - LLaVA) 🆓
- Run LLaVA on a server
- Users send images, get results
- **Cost**: Server hosting only (~$5-10/month)
- **Accuracy**: 85-92%

### Option 2: Direct OpenAI API (PAID - Easiest) 💳
- Call OpenAI from React Native directly
- No server needed
- **Cost**: $0.01 per scan
- **Accuracy**: 90-95%

---

## Option 1: Python Backend Server (Recommended for Free!)

### Architecture:
```
iOS App (React Native)
    ↓ (sends image)
Your Server (Flask + LLaVA)
    ↓ (returns ingredients)
iOS App (displays results)
```

### Step 1: Create Python Backend

Create `python-free-implementation/server.py`:

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
from llava_approach import LLaVAIngredientExtractor
import base64
import tempfile
import os

app = Flask(__name__)
CORS(app)  # Allow requests from React Native

# Initialize extractor once
extractor = LLaVAIngredientExtractor()

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'model': 'llava'})

@app.route('/analyze', methods=['POST'])
def analyze_ingredient():
    """
    Analyze vitamin label image
    
    Request body:
    {
        "image": "base64_encoded_image_data"
    }
    
    Returns:
    {
        "success": true,
        "ingredients": [...],
        "productName": "...",
        "confidence": 85.5
    }
    """
    try:
        data = request.json
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'No image provided'
            }), 400
        
        # Get base64 image
        image_data = data['image']
        
        # Remove data:image/jpeg;base64, prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decode base64
        image_bytes = base64.b64decode(image_data)
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name
        
        # Analyze with LLaVA
        result = extractor.analyze_image(tmp_path)
        
        # Clean up
        os.unlink(tmp_path)
        
        return jsonify(result)
    
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # For production, use gunicorn instead
    app.run(host='0.0.0.0', port=5000, debug=False)
```

### Step 2: Install Dependencies

```bash
cd python-free-implementation
source venv/bin/activate

pip install flask flask-cors gunicorn
```

### Step 3: Deploy Server

**Option A: Deploy to Railway (FREE tier!)** ⭐ Recommended

1. Create `Procfile`:
```
web: cd python-free-implementation && gunicorn server:app
```

2. Create `requirements.txt`:
```
flask==3.0.0
flask-cors==4.0.0
gunicorn==21.2.0
requests==2.31.0
pillow==10.0.0
```

3. Deploy:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway init
railway up
```

Railway gives you a URL like: `https://your-app.railway.app`

**Option B: Deploy to Render (FREE tier!)**

1. Go to https://render.com
2. Connect your GitHub repo
3. Create new Web Service
4. Set:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `cd python-free-implementation && gunicorn server:app`
5. Deploy!

**Option C: Deploy to your own server**

```bash
# On your server (DigitalOcean, AWS, etc.)
git clone your-repo
cd HeartSpire-app/python-free-implementation

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh
ollama serve &
ollama pull llava

# Install Python dependencies
pip install -r requirements.txt

# Run with gunicorn
gunicorn server:app --bind 0.0.0.0:5000 --workers 2
```

### Step 4: Update React Native App

Update `components/ScanIngredients.tsx`:

```typescript
const analyzeImage = async (imageUri: string) => {
  setAnalyzing(true);
  
  try {
    // Read image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Send to your backend
    const response = await fetch('https://your-app.railway.app/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: `data:image/jpeg;base64,${base64}`
      }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      setAnalysisResult(result);
      Alert.alert(
        '✅ Analysis Complete!',
        `Found ${result.ingredients.length} ingredients`
      );
    } else {
      Alert.alert('Error', result.error || 'Analysis failed');
    }
  } catch (error) {
    console.error('Error:', error);
    Alert.alert('Error', 'Failed to analyze image');
  } finally {
    setAnalyzing(false);
  }
};
```

### Step 5: Add FileSystem Dependency

```bash
cd /Users/parthzanwar/Desktop/HeartSpire-app
npx expo install expo-file-system
```

---

## Option 2: Direct OpenAI API (Easiest, Paid)

### Step 1: Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create new API key
3. Copy it

### Step 2: Update React Native App

The code is already there! Just add your API key:

In `components/ScanIngredients.tsx` (line 28):

```typescript
// Change this:
const OPENAI_API_KEY = ''; 

// To this:
const OPENAI_API_KEY = 'sk-your-actual-api-key-here';
```

That's it! The app already calls OpenAI directly.

### Step 3: Security Best Practice

**Don't hardcode API keys!** Use environment variables:

Create `.env`:
```
OPENAI_API_KEY=sk-your-key-here
```

Update code:
```typescript
import Constants from 'expo-constants';

const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey || '';
```

Update `app.json`:
```json
{
  "expo": {
    "extra": {
      "openaiApiKey": process.env.OPENAI_API_KEY
    }
  }
}
```

---

## Comparison: Backend vs Direct API

| Factor | Python Backend (LLaVA) | Direct OpenAI |
|--------|------------------------|---------------|
| **Setup** | Medium (30 min) | Easy (5 min) |
| **Cost** | $5-10/month server | $0.01/scan |
| **Accuracy** | 85-92% | 90-95% |
| **Speed** | 5-15 seconds | 2-4 seconds |
| **Offline** | No (needs server) | No (needs API) |
| **Privacy** | Your server | OpenAI servers |
| **Scalability** | Need to scale server | Auto-scales |
| **Best for** | Budget apps | Premium apps |

---

## Recommended Approach

### For Your VitaMom App:

**Phase 1: Development** (Now)
→ Use OpenAI directly (easy setup)
→ Cost: ~$10-20 for testing
→ Get app working fast!

**Phase 2: Early Users** (Month 1)
→ Keep OpenAI (< 1000 scans/month)
→ Cost: ~$10-15/month
→ Monitor usage

**Phase 3: Scale** (Month 2+)
→ Switch to Python backend when you hit 1000+ scans/month
→ Cost: $5-10/month server vs $100+/month OpenAI
→ Better economics at scale

---

## Complete Integration Example

Here's the complete updated `ScanIngredients.tsx`:

```typescript
import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

// Choose your backend
const USE_BACKEND = false; // false = OpenAI, true = Your server
const BACKEND_URL = 'https://your-app.railway.app'; // Your server URL
const OPENAI_API_KEY = 'sk-your-key-here'; // Or use env variable

interface AnalysisResult {
  success: boolean;
  productName?: string;
  servingSize?: string;
  ingredients: Array<{
    name: string;
    amount?: string;
    unit?: string;
    percentDailyValue?: string;
  }>;
  warnings?: string[];
  error?: string;
}

const ScanIngredients: React.FC = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const analyzeWithBackend = async (imageUri: string): Promise<AnalysisResult> => {
    // Read image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Send to your Python backend
    const response = await fetch(`${BACKEND_URL}/analyze`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        image: `data:image/jpeg;base64,${base64}`
      }),
    });
    
    return await response.json();
  };

  const analyzeWithOpenAI = async (imageUri: string): Promise<AnalysisResult> => {
    // Read image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Call OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this vitamin label and extract all ingredients with amounts. Return JSON format: {"productName": "...", "ingredients": [{"name": "...", "amount": "...", "unit": "..."}]}'
              },
              {
                type: 'image_url',
                image_url: {url: `data:image/jpeg;base64,${base64}`}
              }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    });
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {success: true, ...parsed};
    }
    
    return {success: false, ingredients: [], error: 'Could not parse response'};
  };

  const analyzeImage = async (imageUri: string) => {
    setAnalyzing(true);
    
    try {
      const result = USE_BACKEND 
        ? await analyzeWithBackend(imageUri)
        : await analyzeWithOpenAI(imageUri);
      
      setAnalysisResult(result);
      
      if (result.success) {
        Alert.alert(
          '✅ Success!',
          `Found ${result.ingredients.length} ingredients`
        );
      } else {
        Alert.alert('Error', result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to analyze image');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCameraPress = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access needed');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      await analyzeImage(result.assets[0].uri);
    }
  };

  const handleLibraryPress = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library access needed');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      await analyzeImage(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Your existing UI code... */}
      
      {analyzing && (
        <View style={styles.analyzing}>
          <ActivityIndicator size="large" color="#FF69B4" />
          <Text>Analyzing ingredients...</Text>
        </View>
      )}
      
      {analysisResult && analysisResult.success && (
        <ScrollView style={styles.results}>
          <Text style={styles.title}>Results</Text>
          {analysisResult.ingredients.map((ing, i) => (
            <Text key={i}>{ing.name}: {ing.amount}{ing.unit}</Text>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default ScanIngredients;
```

---

## Testing on iOS

### Local Testing:

```bash
# 1. Start your backend (if using)
cd python-free-implementation
python server.py

# 2. Run app
cd ..
npm start

# 3. On iOS device:
# - Make sure phone and computer on same WiFi
# - Use computer's IP address: http://192.168.1.x:5000
```

### Production Testing:

```bash
# Build iOS app
eas build --platform ios --profile preview

# Scan QR code on your iPhone
# App will connect to your deployed backend
```

---

## Cost Estimates

### 100 Users, 10 scans each/month = 1,000 scans

**Option 1: Python Backend**
- Server: $5-10/month (Railway free tier or cheapest server)
- Total: $5-10/month

**Option 2: OpenAI**
- API: 1,000 scans × $0.01 = $10/month
- Total: $10/month

**Break-even**: ~1,000 scans/month

### 1,000 Users, 10 scans each/month = 10,000 scans

**Option 1: Python Backend**
- Server: $10-20/month (need better server)
- Total: $10-20/month

**Option 2: OpenAI**
- API: 10,000 scans × $0.01 = $100/month
- Total: $100/month

**Savings with backend**: $80-90/month

---

## Quick Start Checklist

### For OpenAI (Easiest - Start Here!)

- [ ] Get OpenAI API key
- [ ] Add to `ScanIngredients.tsx`
- [ ] Install `expo-file-system`
- [ ] Test on iOS
- [ ] Deploy app!

### For Python Backend (Best for Scale)

- [ ] Create `server.py`
- [ ] Deploy to Railway/Render
- [ ] Get backend URL
- [ ] Update React Native code
- [ ] Test on iOS
- [ ] Deploy app!

---

## 🎯 My Recommendation

**Start with Option 2 (OpenAI Direct)**:
1. Takes 5 minutes to set up
2. Just add API key
3. Works immediately
4. Cost is low while testing

**Switch to Option 1 (Backend) when**:
- You have 1000+ scans/month
- You want to save money
- You want more control

**Best of both**: Keep OpenAI code as fallback if backend is down!

---

Ready to deploy? Choose your option and let's get it live! 🚀

