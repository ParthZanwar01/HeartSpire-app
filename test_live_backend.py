#!/usr/bin/env python3
"""
Test the LIVE Hugging Face backend with deployed improvements
"""

import requests
import base64
import json
from pathlib import Path

BACKEND_URL = 'https://MathGenius01-vitamom-backend.hf.space'

print("╔════════════════════════════════════════════════════════════════╗")
print("║                                                                ║")
print("║       🧪 Testing LIVE Hugging Face Backend                     ║")
print("║                                                                ║")
print("╚════════════════════════════════════════════════════════════════╝")
print("")

# Test 1: Health check
print("1️⃣  Health Check")
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
try:
    response = requests.get(f"{BACKEND_URL}/health", timeout=10)
    health = response.json()
    print(f"   Status: {health['status']}")
    print(f"   OCR Available: {health['ocr_available']}")
    print(f"   LLaVA Available: {health['llava_available']}")
    print("   ✅ Backend is healthy!")
except Exception as e:
    print(f"   ❌ Health check failed: {e}")
    exit(1)

print("")

# Test 2: Create a simple test image with text
print("2️⃣  Creating Test Label")
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

from PIL import Image, ImageDraw, ImageFont

# Create a simple vitamin label image
img = Image.new('RGB', (800, 1200), color='white')
draw = ImageDraw.Draw(img)

# Try to use a system font, fall back to default if not available
try:
    font_large = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 40)
    font_medium = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 30)
    font_small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
except:
    font_large = ImageFont.load_default()
    font_medium = ImageFont.load_default()
    font_small = ImageFont.load_default()

# Draw a vitamin label
y_pos = 50

# Title
draw.text((50, y_pos), "PRENATAL MULTIVITAMIN", fill='black', font=font_large)
y_pos += 80

draw.text((50, y_pos), "Supplement Facts", fill='black', font=font_medium)
y_pos += 60

draw.text((50, y_pos), "Serving Size: 1 Tablet", fill='black', font=font_small)
y_pos += 80

# Ingredients
ingredients = [
    ("Vitamin A", "770 mcg", "85%"),
    ("Vitamin C", "85 mg", "94%"),
    ("Vitamin D3", "600 IU", "150%"),
    ("Vitamin E", "15 mg", "100%"),
    ("Thiamin", "1.4 mg", "117%"),
    ("Riboflavin", "1.4 mg", "108%"),
    ("Niacin", "18 mg", "113%"),
    ("Vitamin B6", "1.9 mg", "112%"),
    ("Folic Acid", "600 mcg", "150%"),
    ("Vitamin B12", "2.6 mcg", "108%"),
    ("Biotin", "30 mcg", "100%"),
    ("Calcium", "200 mg", "15%"),
    ("Iron", "27 mg", "150%"),
    ("Zinc", "11 mg", "100%"),
    ("Iodine", "220 mcg", "147%"),
]

for name, amount, dv in ingredients:
    line = f"{name}  {amount}  {dv}"
    draw.text((50, y_pos), line, fill='black', font=font_small)
    y_pos += 35

# Save the test image
test_image_path = '/tmp/test_vitamin_label.jpg'
img.save(test_image_path, quality=95)
print(f"   ✅ Created test label: {test_image_path}")
print(f"   📏 Size: 800x1200px")
print(f"   📝 Contains: 15 ingredients")

print("")

# Test 3: Send to backend
print("3️⃣  Testing Backend OCR")
print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

try:
    # Read and encode image
    with open(test_image_path, 'rb') as f:
        image_bytes = f.read()
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
    
    print(f"   📤 Sending to backend...")
    print(f"   📦 Image size: {len(base64_image)} characters")
    
    # Send to backend
    response = requests.post(
        f"{BACKEND_URL}/analyze",
        json={
            'image': base64_image,
            'method': 'ocr',
            'includeDescriptions': True
        },
        timeout=60
    )
    
    if response.status_code != 200:
        print(f"   ❌ Backend error: {response.status_code}")
        print(f"   Response: {response.text}")
        exit(1)
    
    result = response.json()
    
    print(f"   ✅ Response received!")
    print("")
    print("   📊 Results:")
    print("   " + "─" * 60)
    print(f"   Success: {result.get('success', False)}")
    print(f"   Product: {result.get('productName', 'N/A')}")
    print(f"   Method: {result.get('method', 'N/A')}")
    print(f"   Processing Time: {result.get('processingTime', 'N/A')}s")
    print(f"   Ingredients Found: {len(result.get('ingredients', []))}")
    
    ingredients = result.get('ingredients', [])
    
    if ingredients:
        print("")
        print("   💊 Extracted Ingredients:")
        print("   " + "─" * 60)
        for i, ing in enumerate(ingredients[:10], 1):  # Show first 10
            name = ing.get('name', 'N/A')
            amount = ing.get('amount', '')
            unit = ing.get('unit', '')
            dv = ing.get('percentDailyValue', '')
            print(f"   {i:2d}. {name:<25} {amount:>6} {unit:<4} {dv}")
        
        if len(ingredients) > 10:
            print(f"   ... and {len(ingredients) - 10} more")
        
        print("")
        print("   ✅ SUCCESS! OCR improvements are working!")
        print(f"   📈 Found {len(ingredients)} ingredients (vs 0 before)")
    else:
        print("")
        print("   ⚠️  Zero ingredients found")
        print("")
        print("   Raw OCR Text (first 500 chars):")
        print("   " + "─" * 60)
        raw_text = result.get('rawText', '')
        if raw_text:
            print(f"   {raw_text[:500]}")
        else:
            print("   (No raw text available)")
    
except Exception as e:
    print(f"   ❌ Test failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

print("")
print("╔════════════════════════════════════════════════════════════════╗")
print("║                                                                ║")
print("║              ✅ BACKEND TESTING COMPLETE!                      ║")
print("║                                                                ║")
print("╚════════════════════════════════════════════════════════════════╝")
print("")

if ingredients and len(ingredients) >= 5:
    print("🎉 IMPROVEMENTS ARE WORKING!")
    print("")
    print(f"   Before: 0 ingredients ❌")
    print(f"   After:  {len(ingredients)} ingredients ✅")
    print("")
    print("   Your app should now work much better!")
    print("")
else:
    print("⚠️  Backend might still be rebuilding")
    print("")
    print("   If you just deployed, wait 2-3 more minutes")
    print("   Then run this test again")
    print("")

print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

