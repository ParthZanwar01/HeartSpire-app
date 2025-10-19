#!/usr/bin/env python3
"""
Simple ingredient extractor for vitamin labels
Focuses on finding key ingredients from messy OCR text
"""

import re
from typing import List, Dict

def extract_ingredients_from_text(text: str) -> List[Dict]:
    """
    Extract ingredients from messy OCR text using simple patterns
    """
    ingredients = []
    
    # Convert to lowercase for easier matching
    text_lower = text.lower()
    
    # Define ingredient patterns with their common names
    ingredient_patterns = {
        'Vitamin C': [
            r'vitamin\s+c[^0-9]*?(\d+(?:\.\d+)?)\s*(g|mg|mcg)',
            r'ascorbic\s+acid[^0-9]*?(\d+(?:\.\d+)?)\s*(g|mg|mcg)',
        ],
        'Rose Hips': [
            r'rose\s+hips[^0-9]*?(\d+(?:\.\d+)?)\s*(mg|g)',
        ],
        'Bioflavonoid Complex': [
            r'bioflavonoid[^0-9]*?(\d+(?:\.\d+)?)\s*(mg|g)',
            r'citrus[^0-9]*?(\d+(?:\.\d+)?)\s*(mg|g)',
        ],
        'Folic Acid': [
            r'folic\s+acid[^0-9]*?(\d+(?:\.\d+)?)\s*(mcg|mg)',
            r'folate[^0-9]*?(\d+(?:\.\d+)?)\s*(mcg|mg)',
        ],
        'Iron': [
            r'iron[^0-9]*?(\d+(?:\.\d+)?)\s*(mg)',
        ],
        'Calcium': [
            r'calcium[^0-9]*?(\d+(?:\.\d+)?)\s*(mg|g)',
        ],
        'Vitamin D': [
            r'vitamin\s+d[^0-9]*?(\d+(?:\.\d+)?)\s*(iu|mcg)',
        ],
        'Vitamin E': [
            r'vitamin\s+e[^0-9]*?(\d+(?:\.\d+)?)\s*(iu|mg)',
        ],
        'Vitamin A': [
            r'vitamin\s+a[^0-9]*?(\d+(?:\.\d+)?)\s*(iu|mcg)',
        ],
        'Biotin': [
            r'biotin[^0-9]*?(\d+(?:\.\d+)?)\s*(mcg|mg)',
        ],
        'Zinc': [
            r'zinc[^0-9]*?(\d+(?:\.\d+)?)\s*(mg)',
        ],
        'Magnesium': [
            r'magnesium[^0-9]*?(\d+(?:\.\d+)?)\s*(mg)',
        ],
    }
    
    # Look for each ingredient type
    for ingredient_name, patterns in ingredient_patterns.items():
        for pattern in patterns:
            matches = re.finditer(pattern, text_lower)
            for match in matches:
                if len(match.groups()) >= 2:
                    amount = match.group(1)
                    unit = match.group(2).upper()
                    
                    # Check if we already found this ingredient
                    if not any(ing['name'] == ingredient_name for ing in ingredients):
                        ingredients.append({
                            'name': ingredient_name,
                            'amount': amount,
                            'unit': unit
                        })
                        break  # Move to next ingredient type
    
    return ingredients

def analyze_vitamin_text(text: str) -> Dict:
    """
    Analyze vitamin label text and return structured data
    """
    print(f"🔍 Analyzing text: {text[:100]}...")
    
    # Extract ingredients
    ingredients = extract_ingredients_from_text(text)
    
    # Try to find product name
    product_name = "Vitamin Supplement"
    lines = text.split('\n')
    for line in lines[:5]:
        line = line.strip()
        if len(line) > 3 and not line.isdigit() and '%' not in line:
            if any(word in line.lower() for word in ['vitamin', 'supplement', 'prenatal', 'multivitamin']):
                product_name = line.title()
                break
    
    # Try to find serving size
    serving_size = "1 Tablet"
    for line in lines:
        if 'serving size' in line.lower():
            serving_size = line.strip()
            break
    
    print(f"✅ Found {len(ingredients)} ingredients:")
    for i, ing in enumerate(ingredients, 1):
        print(f"   {i}. {ing['name']}: {ing['amount']} {ing['unit']}")
    
    return {
        'success': True,
        'productName': product_name,
        'servingSize': serving_size,
        'ingredients': ingredients,
        'rawText': text,
        'method': 'simple_extraction'
    }

# Test with your actual text
if __name__ == "__main__":
    test_text = """unt
perenne

1111%
vitamin c (as ascorbic acid) 1g (1,000 mg)

i
rose hing powder olin

(rosa caning) (fruit)

ts botavonci complex ——
day value not estab'

lished."""
    
    result = analyze_vitamin_text(test_text)
    print(f"\n🎯 FINAL RESULT:")
    print(f"Product: {result['productName']}")
    print(f"Serving: {result['servingSize']}")
    print(f"Ingredients: {len(result['ingredients'])}")
    for ing in result['ingredients']:
        print(f"  - {ing['name']}: {ing['amount']} {ing['unit']}")
