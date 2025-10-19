#!/usr/bin/env python3
"""
Test backend with a real vitamin image from OpenFoodFacts
"""

import requests
import base64
import os
import json

# Backend URL
BACKEND_URL = "https://MathGenius01-vitamom-backend.hf.space"

def test_real_vitamin_image():
    """Test with a real vitamin image"""
    print("🧪 Testing with Real Vitamin Image")
    print("=" * 50)
    
    # Use a real image from our dataset
    image_path = "/Users/parthzanwar/Desktop/HeartSpire-app/python-free-implementation/openfoodfacts_data/images/5411188112709.jpg"
    
    if not os.path.exists(image_path):
        print(f"❌ Image not found: {image_path}")
        return
    
    print(f"📸 Using real image: {os.path.basename(image_path)}")
    
    # Convert to base64
    with open(image_path, 'rb') as f:
        image_data = base64.b64encode(f.read()).decode('utf-8')
    
    print(f"✅ Image loaded: {len(image_data)} characters")
    
    # Send request
    print("\n📤 Sending request to backend...")
    payload = {
        "image": image_data,
        "method": "ocr"
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/analyze",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ SUCCESS!")
            print(f"📋 Product: {result.get('productName', 'Unknown')}")
            print(f"📏 Serving: {result.get('servingSize', 'Unknown')}")
            print(f"🧪 Ingredients: {len(result.get('ingredients', []))}")
            print(f"⏱️  Processing Time: {result.get('processingTime', 0):.2f}s")
            
            # Show raw text
            raw_text = result.get('rawText', '')
            if raw_text:
                print(f"\n📝 Raw Extracted Text:")
                print(f"   {raw_text[:300]}...")
            
            # Show ingredients
            ingredients = result.get('ingredients', [])
            if ingredients:
                print(f"\n🧪 Parsed Ingredients:")
                for i, ingredient in enumerate(ingredients, 1):
                    if isinstance(ingredient, dict):
                        name = ingredient.get('name', 'Unknown')
                        amount = ingredient.get('amount', '')
                        unit = ingredient.get('unit', '')
                        print(f"   {i}. {name} {amount} {unit}".strip())
                    else:
                        print(f"   {i}. {ingredient}")
            else:
                print(f"\n⚠️  No ingredients parsed")
            
            # Check if this is a supplement facts panel
            if "supplement facts" in raw_text.lower() or "nutrition facts" in raw_text.lower():
                print(f"\n✅ This appears to be a supplement/nutrition facts panel!")
            else:
                print(f"\n⚠️  This might be a front label, not supplement facts panel")
                print(f"   (Supplement facts panels work better for ingredient extraction)")
        
        else:
            print(f"❌ FAILED: {response.status_code}")
            print(f"Response: {response.text}")
    
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    test_real_vitamin_image()
