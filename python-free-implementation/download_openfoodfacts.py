#!/usr/bin/env python3
"""
Download real vitamin supplement images from OpenFoodFacts
OpenFoodFacts is a free, open database with 2.8M+ products
"""

import requests
import json
from pathlib import Path
from typing import List, Dict
import time
import urllib.request

class OpenFoodFactsDownloader:
    """Download supplement images from OpenFoodFacts API"""
    
    def __init__(self, output_dir: str = "openfoodfacts_data"):
        self.base_url = "https://world.openfoodfacts.org"
        self.output_dir = Path(output_dir)
        self.images_dir = self.output_dir / "images"
        self.images_dir.mkdir(parents=True, exist_ok=True)
        
    def search_products(self, query: str, page_size: int = 20) -> List[Dict]:
        """Search for products"""
        print(f"\n🔍 Searching for: {query}")
        
        url = f"{self.base_url}/cgi/search.pl"
        params = {
            "search_terms": query,
            "categories": "dietary supplements",
            "page_size": page_size,
            "json": 1,
            "fields": "code,product_name,image_url,image_nutrition_url,ingredients_text"
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            products = data.get('products', [])
            print(f"✅ Found {len(products)} products")
            
            return products
        except Exception as e:
            print(f"❌ Error: {e}")
            return []
    
    def download_image(self, url: str, filename: str) -> bool:
        """Download image from URL"""
        filepath = self.images_dir / filename
        
        if filepath.exists():
            return True
        
        try:
            headers = {'User-Agent': 'VitaMomApp/1.0 (Educational/Research)'}
            request = urllib.request.Request(url, headers=headers)
            
            with urllib.request.urlopen(request, timeout=10) as response:
                data = response.read()
            
            with open(filepath, 'wb') as f:
                f.write(data)
            
            return True
        except Exception as e:
            print(f"  ⚠️  Failed: {str(e)[:50]}")
            return False
    
    def download_dataset(self, queries: List[str], max_per_query: int = 10) -> Dict:
        """Download images for multiple queries"""
        print("\n📦 OpenFoodFacts Real Data Downloader")
        print("=" * 60)
        
        all_products = []
        downloaded_count = 0
        
        for query in queries:
            products = self.search_products(query, max_per_query)
            
            for i, product in enumerate(products, 1):
                code = product.get('code')
                name = product.get('product_name', 'Unknown')
                
                # Try nutrition facts image first (has supplement facts)
                image_url = product.get('image_nutrition_url') or product.get('image_url')
                
                if not image_url:
                    continue
                
                print(f"  [{i}/{len(products)}] {name[:40]}")
                
                filename = f"{code}.jpg"
                if self.download_image(image_url, filename):
                    print(f"    ✅ Downloaded")
                    
                    all_products.append({
                        'code': code,
                        'name': name,
                        'image_url': image_url,
                        'local_path': str(self.images_dir / filename),
                        'ingredients_text': product.get('ingredients_text', ''),
                        'downloaded': True
                    })
                    
                    downloaded_count += 1
                else:
                    all_products.append({
                        'code': code,
                        'name': name,
                        'downloaded': False
                    })
                
                time.sleep(0.5)  # Be nice to the server
        
        # Save metadata
        metadata_file = self.output_dir / "dataset.json"
        with open(metadata_file, 'w') as f:
            json.dump({
                'source': 'OpenFoodFacts',
                'total': len(all_products),
                'downloaded': downloaded_count,
                'products': all_products
            }, f, indent=2)
        
        print("\n" + "=" * 60)
        print(f"📊 Download Complete!")
        print(f"✅ Downloaded: {downloaded_count} images")
        print(f"💾 Saved to: {self.output_dir}")
        print(f"📄 Metadata: {metadata_file}")
        
        return {'downloaded': downloaded_count, 'total': len(all_products)}


def main():
    """Download real supplement images"""
    print("\n🌍 OpenFoodFacts Real Dataset Downloader")
    print("=" * 60)
    print("\nOpenFoodFacts is a free, open database (like Wikipedia for food)")
    print("License: Open Database License (ODbL)")
    print("URL: https://world.openfoodfacts.org\n")
    
    # Search queries for different supplement types
    queries = [
        "prenatal vitamin",
        "prenatal multivitamin",
        "women's multivitamin",
        "vitamin D supplement",
        "calcium supplement",
        "iron supplement prenatal",
        "folic acid supplement",
        "DHA omega-3 prenatal",
    ]
    
    downloader = OpenFoodFactsDownloader()
    results = downloader.download_dataset(queries, max_per_query=5)
    
    if results['downloaded'] > 0:
        print("\n✨ Success! You now have real vitamin label images!")
        print("\nNext steps:")
        print("  1. View images: ls openfoodfacts_data/images/")
        print("  2. Test extraction: python test_with_real_images.py --dataset openfoodfacts_data/dataset.json")
        print("  3. Train model with these real images")
    else:
        print("\n⚠️  No images downloaded. Check your internet connection.")


if __name__ == '__main__':
    main()

