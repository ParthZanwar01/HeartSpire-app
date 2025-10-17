#!/usr/bin/env python3
"""
Quick test on real downloaded images
Shows what we can actually extract
"""

import json
from pathlib import Path

def analyze_dataset():
    """Analyze what we downloaded"""
    
    dataset_file = Path("openfoodfacts_data/dataset.json")
    if not dataset_file.exists():
        print("No dataset found. Run download_more_vitamins.py first")
        return
    
    with open(dataset_file) as f:
        data = json.load(f)
    
    print("\n📊 Real Dataset Analysis")
    print("=" * 60)
    print(f"Source: {data['source']}")
    print(f"Total products: {data['total']}")
    print(f"Downloaded: {data['downloaded']}")
    
    print("\n📦 Products Downloaded:")
    print("-" * 60)
    
    # Categorize by type
    vitamins = []
    supplements = []
    prenatals = []
    minerals = []
    other = []
    
    for product in data['products']:
        name = product['name'].lower()
        
        if 'prenatal' in name:
            prenatals.append(product)
        elif 'vitamin' in name or 'multi' in name:
            vitamins.append(product)
        elif any(m in name for m in ['calcium', 'magnesium', 'iron', 'zinc']):
            minerals.append(product)
        elif 'supplement' in name or 'protein' in name:
            supplements.append(product)
        else:
            other.append(product)
    
    print(f"\n🔷 Vitamins/Multivitamins: {len(vitamins)}")
    for p in vitamins[:5]:
        print(f"  • {p['name']}")
    if len(vitamins) > 5:
        print(f"  ... and {len(vitamins)-5} more")
    
    print(f"\n🤰 Prenatal Vitamins: {len(prenatals)}")
    for p in prenatals:
        print(f"  • {p['name']}")
    
    print(f"\n⚗️  Minerals: {len(minerals)}")
    for p in minerals[:5]:
        print(f"  • {p['name']}")
    if len(minerals) > 5:
        print(f"  ... and {len(minerals)-5} more")
    
    print(f"\n💊 Other Supplements: {len(supplements)}")
    for p in supplements[:3]:
        print(f"  • {p['name']}")
    if len(supplements) > 3:
        print(f"  ... and {len(supplements)-3} more")
    
    print(f"\n🍎 Other Products: {len(other)}")
    
    # Check images
    images_dir = Path("openfoodfacts_data/images")
    actual_images = list(images_dir.glob("*.jpg"))
    
    print(f"\n📸 Image Files:")
    print(f"  Actual .jpg files: {len(actual_images)}")
    print(f"  Average size: {sum(f.stat().st_size for f in actual_images) / len(actual_images) / 1024:.1f} KB")
    
    print("\n✨ Summary:")
    print(f"  • Total real product images: {len(actual_images)}")
    print(f"  • Prenatal vitamins: {len(prenatals)} ⭐")
    print(f"  • Regular vitamins: {len(vitamins)}")
    print(f"  • Minerals: {len(minerals)}")
    print(f"  • Ready for testing: ✅")
    
    print("\n🚀 Next Steps:")
    print("  1. Install tesseract: brew install tesseract")
    print("  2. Install Python OCR: pip install pytesseract pillow")
    print("  3. Test extraction: python ocr_approach.py openfoodfacts_data/images/[image].jpg")
    print("  4. Or install Ollama + LLaVA for better results")
    
    # Show specific prenatal images
    if prenatals:
        print("\n🎯 Prenatal Vitamin Images Ready for Testing:")
        for p in prenatals:
            print(f"  → {p['local_path']}")
            print(f"     Product: {p['name']}")
            print(f"     Image: {p['image_url']}")

if __name__ == '__main__':
    analyze_dataset()

