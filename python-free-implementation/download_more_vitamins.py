#!/usr/bin/env python3
"""
Download more vitamin images with better search terms
"""

import requests
import json
from pathlib import Path
import time
import urllib.request

def search_and_download(query, category="", max_results=20):
    """Search OpenFoodFacts and download images"""
    
    base_url = "https://world.openfoodfacts.org"
    output_dir = Path("openfoodfacts_data")
    images_dir = output_dir / "images"
    images_dir.mkdir(parents=True, exist_ok=True)
    
    # Try different API endpoints
    urls_to_try = [
        f"{base_url}/cgi/search.pl?search_terms={query}&page_size={max_results}&json=1",
        f"{base_url}/api/v0/search?search_terms={query}&page_size={max_results}",
        f"{base_url}/category/vitamins.json?page_size={max_results}",
        f"{base_url}/category/dietary-supplements.json?page_size={max_results}",
    ]
    
    print(f"\n🔍 Searching: {query}")
    
    for url in urls_to_try:
        try:
            print(f"  Trying: {url[:80]}...")
            response = requests.get(url, timeout=10)
            
            if response.status_code != 200:
                continue
                
            data = response.json()
            products = data.get('products', [])
            
            if products:
                print(f"  ✅ Found {len(products)} products!")
                return products
                
        except Exception as e:
            continue
    
    print(f"  ⚠️  No products found")
    return []

def download_image(url, filename, images_dir):
    """Download image"""
    filepath = images_dir / filename
    
    if filepath.exists():
        return True
    
    try:
        headers = {'User-Agent': 'VitaMomApp/1.0 (Educational)'}
        request = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(request, timeout=10) as response:
            data = response.read()
        
        with open(filepath, 'wb') as f:
            f.write(data)
        
        return True
    except:
        return False

def main():
    """Download vitamins"""
    print("\n💊 Downloading More Real Vitamin Images")
    print("=" * 60)
    
    # Better search terms
    searches = [
        "vitamin",
        "supplement",
        "multivitamin", 
        "prenatal",
        "calcium",
        "vitamin d",
        "iron supplement",
        "omega 3",
    ]
    
    all_products = []
    downloaded = 0
    
    for search in searches:
        products = search_and_download(search, max_results=10)
        
        for product in products[:5]:  # Take first 5 from each search
            code = product.get('code', product.get('id', ''))
            if not code:
                continue
                
            name = product.get('product_name', 'Unknown')[:50]
            
            # Get image URL (try different fields)
            image_url = (
                product.get('image_nutrition_url') or 
                product.get('image_front_url') or
                product.get('image_url') or
                product.get('image_small_url')
            )
            
            if not image_url:
                continue
            
            print(f"  📥 {name}")
            
            images_dir = Path("openfoodfacts_data/images")
            filename = f"{code}.jpg"
            
            if download_image(image_url, filename, images_dir):
                print(f"    ✅ Downloaded")
                downloaded += 1
                
                all_products.append({
                    'code': code,
                    'name': name,
                    'image_url': image_url,
                    'local_path': str(images_dir / filename),
                    'downloaded': True
                })
            
            time.sleep(0.3)
    
    # Save
    output_file = Path("openfoodfacts_data/dataset.json")
    with open(output_file, 'w') as f:
        json.dump({
            'source': 'OpenFoodFacts',
            'total': len(all_products),
            'downloaded': downloaded,
            'products': all_products
        }, f, indent=2)
    
    print(f"\n✅ Downloaded {downloaded} real vitamin images!")
    print(f"💾 Saved to: openfoodfacts_data/images/")
    print(f"📄 Metadata: {output_file}")

if __name__ == '__main__':
    main()

