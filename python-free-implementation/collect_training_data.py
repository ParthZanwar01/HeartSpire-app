#!/usr/bin/env python3
"""
Collect vitamin label images from online sources
Creates a training dataset with real product images
"""

import json
import os
from pathlib import Path
from typing import List, Dict
import urllib.request
import urllib.error
import time

# High-quality vitamin product images (supplement facts visible)
TRAINING_IMAGES = [
    {
        "id": "prenatal_nature_made",
        "name": "Nature Made Prenatal Multi + DHA",
        "url": "https://images-na.ssl-images-amazon.com/images/I/81oR0Z3jqcL._AC_SL1500_.jpg",
        "expected_ingredients": [
            {"name": "Vitamin A", "amount": "770", "unit": "mcg"},
            {"name": "Vitamin C", "amount": "85", "unit": "mg"},
            {"name": "Vitamin D", "amount": "15", "unit": "mcg"},
            {"name": "Vitamin E", "amount": "11", "unit": "mg"},
            {"name": "Vitamin B6", "amount": "1.9", "unit": "mg"},
            {"name": "Folic Acid", "amount": "600", "unit": "mcg"},
            {"name": "Vitamin B12", "amount": "2.6", "unit": "mcg"},
            {"name": "Iron", "amount": "27", "unit": "mg"},
            {"name": "Zinc", "amount": "11", "unit": "mg"},
            {"name": "DHA", "amount": "200", "unit": "mg"},
        ],
    },
    {
        "id": "prenatal_one_a_day",
        "name": "One A Day Women's Prenatal Advanced",
        "url": "https://images-na.ssl-images-amazon.com/images/I/71vxQ0BZZXL._AC_SL1500_.jpg",
        "expected_ingredients": [
            {"name": "Vitamin A", "amount": "770", "unit": "mcg"},
            {"name": "Vitamin C", "amount": "120", "unit": "mg"},
            {"name": "Vitamin D", "amount": "25", "unit": "mcg"},
            {"name": "Vitamin E", "amount": "15", "unit": "mg"},
            {"name": "Thiamin", "amount": "3", "unit": "mg"},
            {"name": "Riboflavin", "amount": "3.4", "unit": "mg"},
            {"name": "Niacin", "amount": "20", "unit": "mg"},
            {"name": "Vitamin B6", "amount": "4", "unit": "mg"},
            {"name": "Folic Acid", "amount": "800", "unit": "mcg"},
            {"name": "Vitamin B12", "amount": "12", "unit": "mcg"},
            {"name": "Biotin", "amount": "30", "unit": "mcg"},
            {"name": "Pantothenic Acid", "amount": "7", "unit": "mg"},
            {"name": "Iron", "amount": "27", "unit": "mg"},
            {"name": "Zinc", "amount": "15", "unit": "mg"},
            {"name": "DHA", "amount": "200", "unit": "mg"},
        ],
    },
    {
        "id": "vitamin_d_nature_made",
        "name": "Nature Made Vitamin D3 2000 IU",
        "url": "https://images-na.ssl-images-amazon.com/images/I/71LMZPvP0wL._AC_SL1500_.jpg",
        "expected_ingredients": [
            {"name": "Vitamin D3", "amount": "2000", "unit": "IU"},
        ],
    },
    {
        "id": "calcium_citracal",
        "name": "Citracal Calcium + D3",
        "url": "https://images-na.ssl-images-amazon.com/images/I/81j3xqK0YeL._AC_SL1500_.jpg",
        "expected_ingredients": [
            {"name": "Calcium", "amount": "630", "unit": "mg"},
            {"name": "Vitamin D3", "amount": "500", "unit": "IU"},
        ],
    },
    {
        "id": "iron_feosol",
        "name": "Feosol Complete Iron Supplement",
        "url": "https://images-na.ssl-images-amazon.com/images/I/71xaC0ZFAJL._AC_SL1500_.jpg",
        "expected_ingredients": [
            {"name": "Iron", "amount": "28", "unit": "mg"},
            {"name": "Vitamin C", "amount": "60", "unit": "mg"},
            {"name": "Vitamin B12", "amount": "6", "unit": "mcg"},
            {"name": "Folic Acid", "amount": "400", "unit": "mcg"},
        ],
    },
    {
        "id": "omega3_nordic_naturals",
        "name": "Nordic Naturals Prenatal DHA",
        "url": "https://images-na.ssl-images-amazon.com/images/I/71NMfqH7HlL._AC_SL1500_.jpg",
        "expected_ingredients": [
            {"name": "DHA", "amount": "480", "unit": "mg"},
            {"name": "EPA", "amount": "205", "unit": "mg"},
            {"name": "Vitamin D3", "amount": "400", "unit": "IU"},
        ],
    },
    {
        "id": "folic_acid_nature_made",
        "name": "Nature Made Folic Acid 400 mcg",
        "url": "https://images-na.ssl-images-amazon.com/images/I/71i4qwCQtXL._AC_SL1500_.jpg",
        "expected_ingredients": [
            {"name": "Folic Acid", "amount": "400", "unit": "mcg"},
        ],
    },
    {
        "id": "multivitamin_centrum",
        "name": "Centrum Women's Multivitamin",
        "url": "https://images-na.ssl-images-amazon.com/images/I/81vqVZGTiEL._AC_SL1500_.jpg",
        "expected_ingredients": [
            {"name": "Vitamin A", "amount": "900", "unit": "mcg"},
            {"name": "Vitamin C", "amount": "90", "unit": "mg"},
            {"name": "Vitamin D", "amount": "20", "unit": "mcg"},
            {"name": "Vitamin E", "amount": "15", "unit": "mg"},
            {"name": "Vitamin K", "amount": "120", "unit": "mcg"},
            {"name": "Thiamin", "amount": "1.5", "unit": "mg"},
            {"name": "Riboflavin", "amount": "1.7", "unit": "mg"},
            {"name": "Niacin", "amount": "20", "unit": "mg"},
            {"name": "Vitamin B6", "amount": "3", "unit": "mg"},
            {"name": "Folic Acid", "amount": "400", "unit": "mcg"},
            {"name": "Vitamin B12", "amount": "25", "unit": "mcg"},
            {"name": "Biotin", "amount": "300", "unit": "mcg"},
            {"name": "Pantothenic Acid", "amount": "10", "unit": "mg"},
            {"name": "Calcium", "amount": "200", "unit": "mg"},
            {"name": "Iron", "amount": "8", "unit": "mg"},
            {"name": "Magnesium", "amount": "100", "unit": "mg"},
            {"name": "Zinc", "amount": "11", "unit": "mg"},
        ],
    },
]


class DatasetCollector:
    """Download and organize training data"""
    
    def __init__(self, output_dir: str = "training_data"):
        self.output_dir = Path(output_dir)
        self.images_dir = self.output_dir / "images"
        self.images_dir.mkdir(parents=True, exist_ok=True)
    
    def download_image(self, url: str, filename: str) -> bool:
        """Download image from URL"""
        filepath = self.images_dir / filename
        
        if filepath.exists():
            print(f"  ✓ Already downloaded: {filename}")
            return True
        
        try:
            print(f"  📥 Downloading: {filename}")
            
            # Set user agent to avoid blocks
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
            request = urllib.request.Request(url, headers=headers)
            
            with urllib.request.urlopen(request, timeout=10) as response:
                data = response.read()
                
            with open(filepath, 'wb') as f:
                f.write(data)
            
            print(f"  ✅ Downloaded: {filename} ({len(data)/1024:.1f} KB)")
            return True
        
        except urllib.error.HTTPError as e:
            print(f"  ❌ HTTP Error {e.code}: {filename}")
            return False
        except urllib.error.URLError as e:
            print(f"  ❌ URL Error: {e.reason}")
            return False
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
            return False
    
    def collect_all(self) -> Dict:
        """Download all training images"""
        print("\n🗂️  Collecting Training Dataset")
        print("=" * 60)
        
        results = {
            "total": len(TRAINING_IMAGES),
            "downloaded": 0,
            "failed": 0,
            "images": []
        }
        
        for i, item in enumerate(TRAINING_IMAGES, 1):
            print(f"\n[{i}/{len(TRAINING_IMAGES)}] {item['name']}")
            
            filename = f"{item['id']}.jpg"
            success = self.download_image(item['url'], filename)
            
            if success:
                results['downloaded'] += 1
                results['images'].append({
                    **item,
                    'local_path': str(self.images_dir / filename),
                    'downloaded': True
                })
            else:
                results['failed'] += 1
                results['images'].append({
                    **item,
                    'local_path': None,
                    'downloaded': False
                })
            
            # Be nice to servers
            time.sleep(0.5)
        
        # Save metadata
        metadata_file = self.output_dir / "dataset.json"
        with open(metadata_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        print("\n" + "=" * 60)
        print(f"📊 Collection Complete!")
        print(f"✅ Downloaded: {results['downloaded']}")
        print(f"❌ Failed: {results['failed']}")
        print(f"💾 Saved to: {self.output_dir}")
        print(f"📄 Metadata: {metadata_file}")
        
        return results


def main():
    """Main collection script"""
    print("\n🎯 Vitamin Label Training Data Collector")
    print("=" * 60)
    print("\nThis will download real vitamin label images from online")
    print("sources to create a training/testing dataset.")
    print("\nImages are from public Amazon product pages.")
    
    collector = DatasetCollector()
    results = collector.collect_all()
    
    if results['downloaded'] > 0:
        print("\n✨ Success! You can now:")
        print("  1. View images: ls training_data/images/")
        print("  2. Run tests: python test_with_real_images.py")
        print("  3. Train model: python train_on_dataset.py")
    else:
        print("\n⚠️  No images downloaded. Check your internet connection.")


if __name__ == '__main__':
    main()

