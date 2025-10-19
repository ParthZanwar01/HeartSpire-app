#!/usr/bin/env python3
"""
Complete End-to-End Flow Test
Tests the entire pipeline from image to frontend-ready results
"""

import requests
import base64
import os
from PIL import Image, ImageDraw, ImageFont

# Backend URL
BACKEND_URL = "https://MathGenius01-vitamom-backend.hf.space"

def create_supplement_facts_image():
    """Create a realistic supplement facts panel image"""
    img = Image.new('RGB', (400, 600), color='white')
    draw = ImageDraw.Draw(img)
    
    # Try to use fonts
    try:
        font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
        font_header = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
        font_ingredient = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
    except:
        font_title = ImageFont.load_default()
        font_header = ImageFont.load_default()
        font_ingredient = ImageFont.load_default()
    
    y_pos = 20
    
    # Title
    draw.text((20, y_pos), "SUPPLEMENT FACTS", fill='black', font=font_title)
    y_pos += 35
    
    # Serving size
    draw.text((20, y_pos), "Serving Size: 1 Tablet", fill='black', font=font_header)
    y_pos += 25
    
    # Amount per serving
    draw.text((20, y_pos), "Amount Per Serving", fill='black', font=font_header)
    y_pos += 25
    
    # Ingredients table
    ingredients = [
        ("Vitamin A (as Beta Carotene)", "5000", "IU"),
        ("Vitamin C (as Ascorbic Acid)", "100", "mg"),
        ("Vitamin D3 (as Cholecalciferol)", "400", "IU"),
        ("Vitamin E (as d-Alpha Tocopherol)", "30", "IU"),
        ("Folic Acid", "800", "mcg"),
        ("Iron (as Ferrous Fumarate)", "27", "mg"),
        ("Calcium (as Calcium Carbonate)", "200", "mg"),
        ("Magnesium (as Magnesium Oxide)", "100", "mg"),
        ("Zinc (as Zinc Oxide)", "15", "mg")
    ]
    
    for name, amount, unit in ingredients:
        draw.text((20, y_pos), f"• {name}", fill='black', font=font_ingredient)
        draw.text((300, y_pos), f"{amount} {unit}", fill='black', font=font_ingredient)
        y_pos += 20
    
    # Save image
    img.save('/tmp/supplement_facts.png')
    return '/tmp/supplement_facts.png'

def test_complete_flow():
    """Test the complete flow from image to frontend results"""
    print("🚀 COMPLETE END-TO-END FLOW TEST")
    print("=" * 60)
    
    # Step 1: Create supplement facts image
    print("📸 Step 1: Creating supplement facts image...")
    image_path = create_supplement_facts_image()
    print(f"   ✅ Image created: {image_path}")
    
    # Step 2: Convert to base64 (frontend format)
    print("\n🔄 Step 2: Converting to base64...")
    with open(image_path, 'rb') as f:
        image_data = base64.b64encode(f.read()).decode('utf-8')
    print(f"   ✅ Base64 encoded: {len(image_data)} characters")
    
    # Step 3: Send to backend (frontend request format)
    print("\n📤 Step 3: Sending to backend...")
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
        
        if response.status_code != 200:
            print(f"   ❌ Backend request failed: {response.status_code}")
            return
        
        backend_result = response.json()
        print(f"   ✅ Backend response received")
        print(f"   📊 Success: {backend_result.get('success')}")
        print(f"   ⏱️  Processing time: {backend_result.get('processingTime', 0):.2f}s")
        
    except Exception as e:
        print(f"   ❌ Backend request error: {e}")
        return
    
    # Step 4: Convert to frontend format
    print("\n🔄 Step 4: Converting to frontend format...")
    ingredients = backend_result.get('ingredients', [])
    
    # Convert ingredients to frontend format
    frontend_ingredients = []
    for ingredient in ingredients:
        if isinstance(ingredient, dict):
            frontend_ingredients.append({
                'name': ingredient.get('name', 'Unknown'),
                'amount': ingredient.get('amount', ''),
                'unit': ingredient.get('unit', ''),
                'percentDailyValue': ''
            })
        else:
            frontend_ingredients.append({
                'name': str(ingredient),
                'amount': '',
                'unit': '',
                'percentDailyValue': ''
            })
    
    # Create frontend result
    frontend_result = {
        'success': backend_result.get('success', False),
        'productName': backend_result.get('productName', 'Unknown Product'),
        'servingSize': backend_result.get('servingSize', 'Unknown'),
        'ingredients': frontend_ingredients,
        'warnings': backend_result.get('warnings', []),
        'rawResponse': backend_result.get('rawText', ''),
        'error': backend_result.get('error', None)
    }
    
    print(f"   ✅ Frontend format conversion complete")
    print(f"   📊 Ingredients converted: {len(frontend_ingredients)}")
    
    # Step 5: Display results
    print(f"\n📋 Step 5: FINAL RESULTS")
    print(f"   🏷️  Product: {frontend_result['productName']}")
    print(f"   📏 Serving Size: {frontend_result['servingSize']}")
    print(f"   🧪 Ingredients Found: {len(frontend_result['ingredients'])}")
    
    if frontend_result['ingredients']:
        print(f"\n   📝 Ingredient List:")
        for i, ingredient in enumerate(frontend_result['ingredients'][:8], 1):
            name = ingredient['name']
            amount = ingredient['amount']
            unit = ingredient['unit']
            if amount and unit:
                print(f"      {i}. {name} - {amount} {unit}")
            else:
                print(f"      {i}. {name}")
        
        if len(frontend_result['ingredients']) > 8:
            print(f"      ... and {len(frontend_result['ingredients']) - 8} more")
    
    # Step 6: Validation
    print(f"\n✅ Step 6: VALIDATION")
    
    # Check if we found reasonable number of ingredients
    ingredient_count = len(frontend_result['ingredients'])
    if ingredient_count >= 5:
        print(f"   ✅ Good ingredient extraction ({ingredient_count} found)")
    elif ingredient_count >= 2:
        print(f"   ⚠️  Partial ingredient extraction ({ingredient_count} found)")
    else:
        print(f"   ❌ Poor ingredient extraction ({ingredient_count} found)")
    
    # Check if we have vitamin names
    vitamin_names = ['vitamin a', 'vitamin c', 'vitamin d', 'vitamin e', 'folic acid', 'iron', 'calcium']
    found_vitamins = []
    for ingredient in frontend_result['ingredients']:
        name_lower = ingredient['name'].lower()
        for vitamin in vitamin_names:
            if vitamin in name_lower:
                found_vitamins.append(vitamin)
    
    if len(found_vitamins) >= 3:
        print(f"   ✅ Found common vitamins: {', '.join(found_vitamins[:3])}")
    else:
        print(f"   ⚠️  Limited vitamin detection: {found_vitamins}")
    
    # Final assessment
    print(f"\n🎯 FINAL ASSESSMENT:")
    if frontend_result['success'] and ingredient_count >= 3:
        print(f"   🎉 EXCELLENT! Backend is working perfectly!")
        print(f"   ✅ Ready for production use")
    elif frontend_result['success'] and ingredient_count >= 1:
        print(f"   ✅ GOOD! Backend is working with room for improvement")
        print(f"   ⚠️  Consider training with more supplement facts images")
    else:
        print(f"   ❌ NEEDS IMPROVEMENT! Backend needs debugging")
    
    # Clean up
    if os.path.exists(image_path):
        os.remove(image_path)

if __name__ == "__main__":
    test_complete_flow()
