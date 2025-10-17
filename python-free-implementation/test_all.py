#!/usr/bin/env python3
"""
Test all free extraction methods and compare results
"""

import json
import time
from pathlib import Path
from typing import Dict, List
import sys


def test_ocr_approach(image_path: str) -> Dict:
    """Test OCR extraction"""
    try:
        from ocr_approach import OCRIngredientExtractor
        
        print("\n" + "="*60)
        print("🔍 Testing OCR Approach")
        print("="*60)
        
        start = time.time()
        extractor = OCRIngredientExtractor()
        result = extractor.analyze_image(image_path)
        duration = time.time() - start
        
        result['duration'] = duration
        return result
    
    except ImportError as e:
        print(f"⚠️  OCR approach not available: {e}")
        print("   Install: pip install pytesseract pillow")
        print("   Install tesseract: brew install tesseract")
        return {'success': False, 'error': str(e)}
    except Exception as e:
        print(f"❌ OCR error: {e}")
        return {'success': False, 'error': str(e)}


def test_llava_approach(image_path: str) -> Dict:
    """Test LLaVA extraction"""
    try:
        from llava_approach import LLaVAIngredientExtractor
        
        print("\n" + "="*60)
        print("🤖 Testing LLaVA Approach")
        print("="*60)
        
        start = time.time()
        extractor = LLaVAIngredientExtractor()
        result = extractor.analyze_image(image_path)
        duration = time.time() - start
        
        result['duration'] = duration
        return result
    
    except ImportError as e:
        print(f"⚠️  LLaVA approach not available: {e}")
        print("   Install: pip install requests")
        return {'success': False, 'error': str(e)}
    except RuntimeError as e:
        print(f"⚠️  {e}")
        return {'success': False, 'error': str(e)}
    except Exception as e:
        print(f"❌ LLaVA error: {e}")
        return {'success': False, 'error': str(e)}


def compare_results(results: Dict[str, Dict]):
    """Compare and display results"""
    print("\n\n" + "="*60)
    print("📊 COMPARISON")
    print("="*60)
    
    # Summary table
    print(f"\n{'Method':<15} {'Success':<10} {'Ingredients':<15} {'Time':<10}")
    print("-" * 60)
    
    for method, result in results.items():
        if result['success']:
            ing_count = len(result.get('ingredients', []))
            duration = result.get('duration', 0)
            print(f"{method:<15} {'✅':<10} {ing_count:<15} {duration:.2f}s")
        else:
            print(f"{method:<15} {'❌':<10} {'-':<15} {'-':<10}")
    
    # Detailed comparison
    print("\n" + "-"*60)
    print("Detailed Ingredient Comparison:")
    print("-"*60)
    
    all_ingredients = set()
    for result in results.values():
        if result['success']:
            for ing in result.get('ingredients', []):
                all_ingredients.add(ing['name'])
    
    for ing_name in sorted(all_ingredients):
        print(f"\n{ing_name}:")
        for method, result in results.items():
            if result['success']:
                found = next(
                    (ing for ing in result.get('ingredients', []) 
                     if ing['name'] == ing_name),
                    None
                )
                if found:
                    print(f"  {method:<12}: {found.get('amount')} {found.get('unit')}")
                else:
                    print(f"  {method:<12}: Not found")


def main():
    if len(sys.argv) < 2:
        print("Usage: python test_all.py <image_path>")
        print("\nExample:")
        print("  python test_all.py ../assets/test-images/prenatal_1.jpg")
        print("\nThis will test all available extraction methods and compare results.")
        return
    
    image_path = sys.argv[1]
    
    if not Path(image_path).exists():
        print(f"❌ Image not found: {image_path}")
        return
    
    print("\n🧪 Testing All Free Extraction Methods")
    print("Testing image:", image_path)
    
    results = {}
    
    # Test OCR
    results['OCR'] = test_ocr_approach(image_path)
    time.sleep(1)
    
    # Test LLaVA
    results['LLaVA'] = test_llava_approach(image_path)
    
    # Compare
    compare_results(results)
    
    # Save results
    output_file = 'comparison_results.json'
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n\n💾 Full results saved to: {output_file}")
    
    # Recommendations
    print("\n" + "="*60)
    print("💡 RECOMMENDATIONS")
    print("="*60)
    
    successful = [m for m, r in results.items() if r['success']]
    
    if 'LLaVA' in successful:
        print("\n🏆 Best: LLaVA")
        print("   - Highest accuracy")
        print("   - Handles complex labels well")
        print("   - Free, runs locally")
        print("   - Recommended for production")
    
    if 'OCR' in successful:
        print("\n⚡ Fastest: OCR")
        print("   - Very fast (<1s)")
        print("   - Good for clear, simple labels")
        print("   - No GPU needed")
        print("   - Great for development/testing")
    
    if not successful:
        print("\n⚠️  No methods succeeded!")
        print("\nTroubleshooting:")
        print("1. OCR: Install tesseract (brew install tesseract)")
        print("2. LLaVA: Install Ollama and run 'ollama serve'")
        print("3. Check image quality and format")


if __name__ == '__main__':
    main()

