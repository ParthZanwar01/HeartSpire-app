#!/usr/bin/env python3
"""
Improved OCR parser for vitamin labels
Better at extracting ingredients from supplement facts panels
"""

import re
from typing import List, Dict, Optional

def parse_supplement_facts_text(text: str) -> Dict:
    """
    Parse supplement facts text to extract ingredients
    More flexible than regex patterns
    """
    print(f"🔍 Parsing text: {text[:200]}...")
    
    ingredients = []
    product_name = "Unknown Product"
    serving_size = "Unknown"
    
    lines = text.split('\n')
    
    # Find product name (usually in first few lines)
    for i, line in enumerate(lines[:5]):
        line = line.strip()
        if len(line) > 3 and not line.isdigit():
            # Skip common non-product words
            skip_words = ['supplement', 'facts', 'serving', 'size', 'tablet', 'capsule']
            if not any(word in line.lower() for word in skip_words):
                product_name = line.title()
                break
    
    # Find serving size
    for line in lines:
        if 'serving size' in line.lower():
            serving_size = line.strip()
            break
    
    # Look for supplement facts section
    in_supplement_facts = False
    for line in lines:
        line = line.strip()
        
        # Start of supplement facts
        if 'supplement facts' in line.lower():
            in_supplement_facts = True
            continue
            
        # Skip empty lines
        if not line:
            continue
            
        # Skip headers
        if any(header in line.lower() for header in ['supplement facts', 'serving size', 'amount per serving']):
            continue
            
        # Skip footnotes
        if line.startswith('†') or 'daily value not established' in line.lower():
            continue
            
        # Look for ingredient patterns
        if in_supplement_facts and len(line) > 5:
            # Pattern 1: "Vitamin C (as Ascorbic Acid) 1g (1,000 mg)"
            vitamin_match = re.search(r'([^()]+(?:vitamin|folic|iron|calcium|magnesium|zinc|biotin|niacin|thiamin|riboflavin|pyridoxine|cobalamin)[^()]*)', line, re.IGNORECASE)
            if vitamin_match:
                ingredient_text = vitamin_match.group(1).strip()
                
                # Extract amount and unit
                amount_match = re.search(r'(\d+(?:\.\d+)?)\s*(g|mg|mcg|μg|iu|mcg)', ingredient_text, re.IGNORECASE)
                if amount_match:
                    amount = amount_match.group(1)
                    unit = amount_match.group(2).upper()
                    
                    # Clean up ingredient name
                    name = re.sub(r'\s*\d+.*$', '', ingredient_text).strip()
                    name = re.sub(r'\s*\([^)]*\)$', '', name).strip()
                    
                    ingredients.append({
                        'name': name.title(),
                        'amount': amount,
                        'unit': unit
                    })
                    continue
            
            # Pattern 2: "Rose Hips Powder (Rosa canina) (Fruit) 25 mg"
            powder_match = re.search(r'([^()]+(?:powder|complex|extract|oil|acid)[^()]*)', line, re.IGNORECASE)
            if powder_match:
                ingredient_text = powder_match.group(1).strip()
                
                # Extract amount and unit
                amount_match = re.search(r'(\d+(?:\.\d+)?)\s*(g|mg|mcg|μg|iu)', ingredient_text, re.IGNORECASE)
                if amount_match:
                    amount = amount_match.group(1)
                    unit = amount_match.group(2).upper()
                    
                    # Clean up ingredient name
                    name = re.sub(r'\s*\d+.*$', '', ingredient_text).strip()
                    name = re.sub(r'\s*\([^)]*\)$', '', name).strip()
                    
                    ingredients.append({
                        'name': name.title(),
                        'amount': amount,
                        'unit': unit
                    })
                    continue
            
            # Pattern 3: Simple ingredient with amount
            simple_match = re.search(r'^([^0-9]+?)\s+(\d+(?:\.\d+)?)\s*(g|mg|mcg|μg|iu)', line, re.IGNORECASE)
            if simple_match:
                name = simple_match.group(1).strip()
                amount = simple_match.group(2)
                unit = simple_match.group(3).upper()
                
                # Skip if it's just a number or percentage
                if not name.isdigit() and '%' not in name:
                    ingredients.append({
                        'name': name.title(),
                        'amount': amount,
                        'unit': unit
                    })
    
    print(f"✅ Found {len(ingredients)} ingredients")
    for i, ing in enumerate(ingredients, 1):
        print(f"   {i}. {ing['name']} - {ing['amount']} {ing['unit']}")
    
    return {
        'success': True,
        'productName': product_name,
        'servingSize': serving_size,
        'ingredients': ingredients,
        'rawText': text,
        'method': 'improved_ocr'
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
    
    result = parse_supplement_facts_text(test_text)
    print(f"\n🎯 RESULT:")
    print(f"Product: {result['productName']}")
    print(f"Serving: {result['servingSize']}")
    print(f"Ingredients: {len(result['ingredients'])}")
    for ing in result['ingredients']:
        print(f"  - {ing['name']}: {ing['amount']} {ing['unit']}")
