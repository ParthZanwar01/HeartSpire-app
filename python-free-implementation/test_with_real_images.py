#!/usr/bin/env python3
"""
Test AI extraction on real vitamin label images
Compares AI results with expected ingredients
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List
import time

# Import our extraction methods
try:
    from llava_approach import LLaVAIngredientExtractor
    LLAVA_AVAILABLE = True
except:
    LLAVA_AVAILABLE = False

try:
    from ocr_approach import OCRIngredientExtractor
    OCR_AVAILABLE = True
except:
    OCR_AVAILABLE = False


def normalize_ingredient(ing: Dict) -> str:
    """Normalize ingredient for comparison"""
    name = ing['name'].lower().strip()
    # Remove common variations
    name = name.replace('vitamin ', '').replace('acid', '').strip()
    return name


def calculate_accuracy(expected: List[Dict], found: List[Dict]) -> Dict:
    """Calculate accuracy metrics"""
    expected_names = {normalize_ingredient(ing) for ing in expected}
    found_names = {normalize_ingredient(ing) for ing in found}
    
    # Find matches
    matched = expected_names & found_names
    missed = expected_names - found_names
    extra = found_names - expected_names
    
    # Calculate metrics
    precision = len(matched) / len(found_names) if found_names else 0
    recall = len(matched) / len(expected_names) if expected_names else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
    
    return {
        'matched': list(matched),
        'missed': list(missed),
        'extra': list(extra),
        'precision': precision * 100,
        'recall': recall * 100,
        'f1_score': f1 * 100,
        'expected_count': len(expected_names),
        'found_count': len(found_names),
        'matched_count': len(matched),
    }


def test_single_image(image_path: str, expected: List[Dict], method: str = 'llava') -> Dict:
    """Test single image with specified method"""
    
    if method == 'llava':
        if not LLAVA_AVAILABLE:
            return {
                'success': False,
                'error': 'LLaVA not available. Install Ollama and run: ollama serve'
            }
        
        extractor = LLaVAIngredientExtractor()
        result = extractor.analyze_image(image_path)
    
    elif method == 'ocr':
        if not OCR_AVAILABLE:
            return {
                'success': False,
                'error': 'OCR not available. Install: brew install tesseract && pip install pytesseract'
            }
        
        extractor = OCRIngredientExtractor()
        result = extractor.analyze_image(image_path)
    
    else:
        return {'success': False, 'error': f'Unknown method: {method}'}
    
    if not result['success']:
        return result
    
    # Calculate accuracy
    accuracy = calculate_accuracy(expected, result.get('ingredients', []))
    
    return {
        **result,
        'accuracy': accuracy
    }


def test_dataset(dataset_path: str = "training_data/dataset.json", method: str = 'llava'):
    """Test all images in dataset"""
    
    print(f"\n🧪 Testing with {method.upper()}")
    print("=" * 60)
    
    # Load dataset
    if not Path(dataset_path).exists():
        print(f"❌ Dataset not found: {dataset_path}")
        print("Run: python collect_training_data.py first")
        return
    
    with open(dataset_path) as f:
        dataset = json.load(f)
    
    results = []
    successful_tests = 0
    total_f1 = 0
    
    for i, item in enumerate(dataset['images'], 1):
        if not item.get('downloaded'):
            continue
        
        print(f"\n[{i}/{dataset['total']}] {item['name']}")
        print("-" * 60)
        
        image_path = item['local_path']
        expected = item['expected_ingredients']
        
        print(f"Expected ingredients: {len(expected)}")
        
        start = time.time()
        result = test_single_image(image_path, expected, method)
        duration = time.time() - start
        
        if result['success']:
            accuracy = result['accuracy']
            
            print(f"✅ Found: {accuracy['found_count']} ingredients")
            print(f"🎯 Matched: {accuracy['matched_count']}/{accuracy['expected_count']}")
            print(f"📊 Precision: {accuracy['precision']:.1f}%")
            print(f"📊 Recall: {accuracy['recall']:.1f}%")
            print(f"📊 F1 Score: {accuracy['f1_score']:.1f}%")
            print(f"⏱️  Time: {duration:.2f}s")
            
            if accuracy['missed']:
                print(f"⚠️  Missed: {', '.join(accuracy['missed'])}")
            if accuracy['extra']:
                print(f"ℹ️  Extra: {', '.join(accuracy['extra'])}")
            
            successful_tests += 1
            total_f1 += accuracy['f1_score']
            
            results.append({
                'id': item['id'],
                'name': item['name'],
                'success': True,
                'accuracy': accuracy,
                'duration': duration
            })
        else:
            print(f"❌ Failed: {result.get('error', 'Unknown error')}")
            results.append({
                'id': item['id'],
                'name': item['name'],
                'success': False,
                'error': result.get('error')
            })
        
        time.sleep(0.5)
    
    # Summary
    print("\n\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    print(f"\n✅ Successful tests: {successful_tests}/{dataset['total']}")
    
    if successful_tests > 0:
        avg_f1 = total_f1 / successful_tests
        print(f"🎯 Average F1 Score: {avg_f1:.1f}%")
        
        # Categorize results
        excellent = sum(1 for r in results if r['success'] and r['accuracy']['f1_score'] >= 90)
        good = sum(1 for r in results if r['success'] and 70 <= r['accuracy']['f1_score'] < 90)
        fair = sum(1 for r in results if r['success'] and 50 <= r['accuracy']['f1_score'] < 70)
        poor = sum(1 for r in results if r['success'] and r['accuracy']['f1_score'] < 50)
        
        print(f"\n📈 Performance Breakdown:")
        print(f"   🟢 Excellent (90-100%): {excellent}")
        print(f"   🟡 Good (70-89%): {good}")
        print(f"   🟠 Fair (50-69%): {fair}")
        print(f"   🔴 Poor (<50%): {poor}")
    
    # Save results
    output_file = f'test_results_{method}.json'
    with open(output_file, 'w') as f:
        json.dump({
            'method': method,
            'total_tests': dataset['total'],
            'successful_tests': successful_tests,
            'average_f1': total_f1 / successful_tests if successful_tests > 0 else 0,
            'results': results
        }, f, indent=2)
    
    print(f"\n💾 Results saved to: {output_file}")


def main():
    """Main test script"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Test ingredient extraction on real images')
    parser.add_argument('--method', choices=['llava', 'ocr', 'both'], default='llava',
                       help='Extraction method to test')
    parser.add_argument('--dataset', default='training_data/dataset.json',
                       help='Path to dataset JSON')
    
    args = parser.parse_args()
    
    print("\n🎯 Real Image Testing")
    print("=" * 60)
    
    if args.method == 'both':
        if OCR_AVAILABLE:
            test_dataset(args.dataset, 'ocr')
        if LLAVA_AVAILABLE:
            test_dataset(args.dataset, 'llava')
    else:
        test_dataset(args.dataset, args.method)
    
    print("\n✨ Testing complete!")


if __name__ == '__main__':
    main()

