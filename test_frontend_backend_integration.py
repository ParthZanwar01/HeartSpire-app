#!/usr/bin/env python3
"""
Test frontend-backend integration
Simulates the exact request the frontend makes to the backend
"""

import requests
import base64
import os
from PIL import Image, ImageDraw, ImageFont

# Backend URL
BACKEND_URL = "https://MathGenius01-vitamom-backend.hf.space"

def create_vitamin_label_image():
    """Create a realistic vitamin label image"""
    img = Image.new('RGB', (600, 400), color='white')
    draw = ImageDraw.Draw(img)
    
    # Try to use a default font
    try:
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
        font_medium = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Draw vitamin label content
    y_pos = 20
    
    # Product name
    draw.text((20, y_pos), "PREGNANCY MULTIVITAMIN", fill='black', font=font_large)
    y_pos += 40
    
    # Serving size
    draw.text((20, y_pos), "Serving Size: 1 Tablet", fill='black', font=font_medium)
    y_pos += 30
    
    # Supplement Facts
    draw.text((20, y_pos), "Supplement Facts", fill='black', font=font_medium)
    y_pos += 30
    
    # Ingredients list
    ingredients = [
        "Vitamin A (as Beta Carotene) - 5000 IU",
        "Vitamin C (as Ascorbic Acid) - 100 mg",
        "Vitamin D3 (as Cholecalciferol) - 400 IU",
        "Vitamin E (as d-Alpha Tocopherol) - 30 IU",
        "Folic Acid - 800 mcg",
        "Iron (as Ferrous Fumarate) - 27 mg",
        "Calcium (as Calcium Carbonate) - 200 mg"
    ]
    
    for ingredient in ingredients:
        draw.text((20, y_pos), f"• {ingredient}", fill='black', font=font_small)
        y_pos += 25
    
    # Save image
    img.save('/tmp/vitamin_label.png')
    return '/tmp/vitamin_label.png'

def test_frontend_request():
    """Test the exact request format the frontend sends"""
    print("🧪 Testing Frontend-Backend Integration")
    print("=" * 50)
    
    # Create test image
    print("📸 Creating test vitamin label...")
    image_path = create_vitamin_label_image()
    
    # Convert to base64 (same as frontend)
    with open(image_path, 'rb') as f:
        image_data = base64.b64encode(f.read()).decode('utf-8')
    
    print(f"✅ Image created: {len(image_data)} characters")
    
    # Send request (exact same format as frontend)
    print("\n📤 Sending frontend-style request...")
    payload = {
        "image": image_data,  # Raw base64 (not data URL)
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
            
            # Show extracted text
            raw_text = result.get('rawText', '')
            if raw_text:
                print(f"\n📝 Extracted Text:")
                print(f"   {raw_text[:200]}...")
            
            # Show ingredients
            ingredients = result.get('ingredients', [])
            if ingredients:
                print(f"\n🧪 Parsed Ingredients:")
                for i, ingredient in enumerate(ingredients[:5], 1):
                    print(f"   {i}. {ingredient}")
                if len(ingredients) > 5:
                    print(f"   ... and {len(ingredients) - 5} more")
            else:
                print(f"\n⚠️  No ingredients parsed from text")
            
            # Test frontend conversion
            print(f"\n📱 Frontend Conversion Test:")
            frontend_ingredients = [{
                'name': ingredient.get('name', ingredient) if isinstance(ingredient, dict) else str(ingredient),
                'amount': ingredient.get('amount', '') if isinstance(ingredient, dict) else '',
                'unit': ingredient.get('unit', '') if isinstance(ingredient, dict) else '',
                'percentDailyValue': ''
            } for ingredient in ingredients]
            print(f"   ✅ Converted {len(frontend_ingredients)} ingredients to frontend format")
            
        else:
            print(f"❌ FAILED: {response.status_code}")
            print(f"Response: {response.text}")
    
    except Exception as e:
        print(f"❌ ERROR: {e}")
    
    finally:
        # Clean up
        if os.path.exists(image_path):
            os.remove(image_path)

if __name__ == "__main__":
    test_frontend_request()
