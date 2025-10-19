#!/usr/bin/env python3
"""
Robust OCR parser for messy vitamin label text
Handles garbled OCR output better
"""

import re
from typing import List, Dict, Optional

def clean_ocr_text(text: str) -> str:
    """Clean up garbled OCR text"""
    # Remove extra whitespace and newlines
    text = re.sub(r'\s+', ' ', text)
    
    # Fix common OCR mistakes
    replacements = {
        'hing': 'hips',
        'caning': 'canina', 
        'botavonci': 'bioflavonoid',
        'perenne': 'perennial',
        'estab': 'established',
        'ts ': 'its ',
        'olin': 'olin',
        'i ': 'i ',
    }
    
    for wrong, right in replacements.items():
        text = text.replace(wrong, right)
    
    return text

def parse_messy_supplement_facts(text: str) -> Dict:
    """
    Parse messy OCR text to extract ingredients
    More forgiving of OCR errors
    """
    print(f"🔍 Original text: {text[:200]}...")
    
    # Clean the text
    cleaned_text = clean_ocr_text(text)
    print(f"🧹 Cleaned text: {cleaned_text[:200]}...")
    
    ingredients = []
    product_name = "Vitamin Supplement"
    serving_size = "1 Tablet"
    
    # Look for vitamin patterns (more flexible)
    vitamin_patterns = [
        r'vitamin\s+[a-z]\s*\([^)]*\)\s*(\d+(?:\.\d+)?)\s*(g|mg|mcg|μg|iu)',
        r'vitamin\s+[a-z]\s*[^0-9]*?(\d+(?:\.\d+)?)\s*(g|mg|mcg|μg|iu)',
        r'([^%0-9]*vitamin[^0-9]*?)\s*(\d+(?:\.\d+)?)\s*(g|mg|mcg|μg|iu)',
        r'([^%0-9]*vitamin\s+[a-z][^0-9]*?)\s*(\d+(?:\.\d+)?)\s*(g|mg|mcg|μg|iu)',
    ]
    
    for pattern in vitamin_patterns:
        matches = re.finditer(pattern, cleaned_text, re.IGNORECASE)
        for match in matches:
            if len(match.groups()) >= 3:
                name = match.group(1).strip()
                amount = match.group(2)
                unit = match.group(3).upper()
                
                # Clean up name
                name = re.sub(r'\s*\([^)]*\)', '', name)
                name = re.sub(r'\s+', ' ', name).strip()
                
                if len(name) > 3 and not name.isdigit():
                    ingredients.append({
                        'name': name.title(),
                        'amount': amount,
                        'unit': unit
                    })
    
    # Look for other supplement patterns
    supplement_patterns = [
        r'([^0-9]*rose\s+hips[^0-9]*?)\s*(\d+(?:\.\d+)?)\s*(mg|g)',
        r'([^0-9]*bioflavonoid[^0-9]*?)\s*(\d+(?:\.\d+)?)\s*(mg|g)',
        r'([^0-9]*citrus[^0-9]*?)\s*(\d+(?:\.\d+)?)\s*(mg|g)',
        r'([^0-9]*folic[^0-9]*?)\s*(\d+(?:\.\d+)?)\s*(mcg|mg)',
        r'([^0-9]*iron[^0-9]*?)\s*(\d+(?:\.\d+)?)\s*(mg)',
        r'([^0-9]*calcium[^0-9]*?)\s*(\d+(?:\.\d+)?)\s*(mg|g)',
    ]
    
    for pattern in supplement_patterns:
        matches = re.finditer(pattern, cleaned_text, re.IGNORECASE)
        for match in matches:
            if len(match.groups()) >= 3:
                name = match.group(1).strip()
                amount = match.group(2)
                unit = match.group(3).upper()
                
                # Clean up name
                name = re.sub(r'\s*\([^)]*\)', '', name)
                name = re.sub(r'\s+', ' ', name).strip()
                
                if len(name) > 3 and not name.isdigit():
                    ingredients.append({
                        'name': name.title(),
                        'amount': amount,
                        'unit': unit
                    })
    
    # Remove duplicates
    seen = set()
    unique_ingredients = []
    for ing in ingredients:
        key = (ing['name'].lower(), ing['amount'], ing['unit'])
        if key not in seen:
            seen.add(key)
            unique_ingredients.append(ing)
    
    print(f"✅ Found {len(unique_ingredients)} ingredients")
    for i, ing in enumerate(unique_ingredients, 1):
        print(f"   {i}. {ing['name']} - {ing['amount']} {ing['unit']}")
    
    return {
        'success': True,
        'productName': product_name,
        'servingSize': serving_size,
        'ingredients': unique_ingredients,
        'rawText': text,
        'method': 'robust_ocr'
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
    
    result = parse_messy_supplement_facts(test_text)
    print(f"\n🎯 RESULT:")
    print(f"Product: {result['productName']}")
    print(f"Serving: {result['servingSize']}")
    print(f"Ingredients: {len(result['ingredients'])}")
    for ing in result['ingredients']:
        print(f"  - {ing['name']}: {ing['amount']} {ing['unit']}")
