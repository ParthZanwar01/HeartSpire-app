#!/usr/bin/env python3
"""
Test script to simulate your app's behavior
This tests the same flow your iOS app will use
"""

import requests
import base64
import os
from PIL import Image, ImageDraw, ImageFont

# Backend URL (same as your app)
BACKEND_URL = "https://MathGenius01-vitamom-backend.hf.space"

def create_test_vitamin_image():
    """Create a test vitamin label image"""
    img = Image.new('RGB', (400, 300), color='white')
    draw = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
    except:
        font = ImageFont.load_default()
    
    # Draw vitamin label content
    y_pos = 20
    draw.text((20, y_pos), "PRENATAL VITAMIN", fill='black', font=font)
    y_pos += 30
    
    draw.text((20, y_pos), "Supplement Facts", fill='black', font=font)
    y_pos += 25
    
    ingredients = [
        "Folic Acid - 800 mcg",
        "Iron - 27 mg", 
        "Vitamin D3 - 400 IU",
        "Calcium - 200 mg"
    ]
    
    for ingredient in ingredients:
        draw.text((20, y_pos), f"• {ingredient}", fill='black', font=font)
        y_pos += 20
    
    # Save image
    img.save('/tmp/test_vitamin.png')
    return '/tmp/test_vitamin.png'

def test_app_flow():
    """Test the complete app flow"""
    print("🧪 TESTING YOUR APP FLOW")
    print("=" * 50)
    
    # Step 1: Create test image (simulates taking photo)
    print("📸 Step 1: Creating test vitamin image...")
    image_path = create_test_vitamin_image()
    print(f"   ✅ Image created: {image_path}")
    
    # Step 2: Convert to base64 (simulates FileSystem.readAsStringAsync)
    print("\n🔄 Step 2: Converting to base64...")
    try:
        with open(image_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        print(f"   ✅ Base64 conversion successful: {len(image_data)} characters")
    except Exception as e:
        print(f"   ❌ Base64 conversion failed: {e}")
        return
    
    # Step 3: Send to backend (simulates your app's request)
    print("\n📤 Step 3: Sending to backend...")
    try:
        payload = {
            "image": image_data,
            "method": "ocr"
        }
        
        response = requests.post(
            f"{BACKEND_URL}/analyze",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Backend response received")
            print(f"   📊 Success: {result.get('success')}")
            print(f"   ⏱️  Processing time: {result.get('processingTime', 0):.2f}s")
            
            # Step 4: Process results (simulates your app's processing)
            print("\n📋 Step 4: Processing results...")
            
            # Convert ingredients to frontend format (same as your app)
            ingredients = []
            if result.get('ingredients') and isinstance(result['ingredients'], list):
                ingredients = result['ingredients']
                print(f"   🧪 Found {len(ingredients)} ingredients")
                
                for i, ingredient in enumerate(ingredients[:3], 1):
                    if isinstance(ingredient, dict):
                        name = ingredient.get('name', 'Unknown')
                        amount = ingredient.get('amount', '')
                        unit = ingredient.get('unit', '')
                        print(f"      {i}. {name} {amount} {unit}".strip())
                    else:
                        print(f"      {i}. {ingredient}")
            else:
                print(f"   ⚠️  No ingredients found")
            
            # Show raw text
            raw_text = result.get('rawText', '')
            if raw_text:
                print(f"\n📝 Raw extracted text:")
                print(f"   {raw_text[:100]}...")
            
            # Final assessment
            print(f"\n🎯 FINAL RESULT:")
            if result.get('success') and len(ingredients) > 0:
                print(f"   ✅ SUCCESS! Your app should work!")
                print(f"   📱 Backend is responding correctly")
                print(f"   🤖 AI is extracting ingredients")
            else:
                print(f"   ⚠️  PARTIAL SUCCESS - Backend working but limited results")
                print(f"   💡 This is normal for OCR - works better with supplement facts panels")
            
        else:
            print(f"   ❌ Backend error: {response.status_code}")
            print(f"   Response: {response.text}")
    
    except Exception as e:
        print(f"   ❌ Backend request failed: {e}")
    
    finally:
        # Clean up
        if os.path.exists(image_path):
            os.remove(image_path)

if __name__ == "__main__":
    test_app_flow()
