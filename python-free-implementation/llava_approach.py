#!/usr/bin/env python3
"""
Free LLaVA-based Ingredient Extraction
Uses Ollama with LLaVA model (free, runs locally)

Setup:
    # 1. Install Ollama
    brew install ollama  # macOS
    # or download from: https://ollama.ai
    
    # 2. Download LLaVA model
    ollama pull llava
    
    # 3. Install Python requirements
    pip install requests pillow

Accuracy: 80-90%
Speed: 3-10 seconds per image (depends on your hardware)
GPU: Optional but recommended (much faster with GPU)
"""

import json
import base64
import requests
from typing import Dict, List
from pathlib import Path
import re


class LLaVAIngredientExtractor:
    """Extract ingredients using local LLaVA model via Ollama"""
    
    def __init__(self, model: str = "llava", base_url: str = "http://localhost:11434"):
        self.model = model
        self.base_url = base_url
        
        # Check if Ollama is running
        try:
            response = requests.get(f"{base_url}/api/tags")
            if response.status_code != 200:
                raise ConnectionError("Ollama not running")
        except Exception as e:
            raise RuntimeError(
                "Ollama not running. Start it with: ollama serve\n"
                "Or install: brew install ollama"
            )
    
    def encode_image(self, image_path: str) -> str:
        """Encode image to base64"""
        with open(image_path, 'rb') as f:
            return base64.b64encode(f.read()).decode('utf-8')
    
    def create_prompt(self) -> str:
        """Create analysis prompt"""
        return """Analyze this vitamin/supplement label image and extract ALL ingredient information.

For each ingredient, provide:
- Name (exact as shown, including Vitamin A, Vitamin C, etc.)
- Amount (numeric value only)
- Unit (mg, mcg, IU, g, etc.)
- % Daily Value (if shown)

Also extract:
- Product name
- Serving size

Return the information in this EXACT JSON format:
{
  "productName": "Name of product",
  "servingSize": "1 tablet",
  "ingredients": [
    {
      "name": "Vitamin A",
      "amount": "770",
      "unit": "mcg",
      "percentDailyValue": "85%"
    }
  ]
}

Be precise and extract EVERY ingredient visible on the label.
Return ONLY the JSON, no other text."""
    
    def analyze_image(self, image_path: str) -> Dict:
        """
        Analyze vitamin label image
        
        Returns:
            {
                'success': bool,
                'productName': str,
                'servingSize': str,
                'ingredients': List[Dict],
                'rawResponse': str,
                'method': 'llava'
            }
        """
        print(f"🤖 Analyzing {image_path} with LLaVA...")
        
        try:
            # Encode image
            image_b64 = self.encode_image(image_path)
            
            # Create request
            payload = {
                "model": self.model,
                "prompt": self.create_prompt(),
                "images": [image_b64],
                "stream": False
            }
            
            print("⏳ Processing... (this may take 5-15 seconds)")
            
            # Send request
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=60
            )
            
            if response.status_code != 200:
                raise Exception(f"API error: {response.status_code}")
            
            result = response.json()
            content = result.get('response', '')
            
            print(f"✅ Got response ({len(content)} chars)")
            
            # Parse JSON from response
            json_match = re.search(r'\{[\s\S]*\}', content)
            if not json_match:
                return {
                    'success': False,
                    'error': 'Could not parse JSON from response',
                    'rawResponse': content
                }
            
            parsed = json.loads(json_match.group(0))
            
            return {
                'success': True,
                'productName': parsed.get('productName', 'Unknown'),
                'servingSize': parsed.get('servingSize'),
                'ingredients': parsed.get('ingredients', []),
                'rawResponse': content,
                'method': 'llava',
            }
        
        except Exception as e:
            print(f"❌ Error: {e}")
            return {
                'success': False,
                'error': str(e),
                'method': 'llava'
            }


def main():
    """Test the LLaVA extractor"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python llava_approach.py <image_path>")
        print("\nExample:")
        print("  python llava_approach.py ../assets/test-images/prenatal_1.jpg")
        print("\nMake sure Ollama is running:")
        print("  ollama serve")
        return
    
    image_path = sys.argv[1]
    
    print("\n🤖 LLaVA Ingredient Extraction")
    print("=" * 60)
    
    try:
        extractor = LLaVAIngredientExtractor()
        result = extractor.analyze_image(image_path)
        
        if result['success']:
            print(f"\n✅ Analysis Complete!")
            print(f"\n📦 Product: {result['productName']}")
            if result.get('servingSize'):
                print(f"📏 Serving Size: {result['servingSize']}")
            print(f"💊 Ingredients Found: {len(result['ingredients'])}")
            print(f"\nIngredients:")
            print("-" * 60)
            
            for i, ing in enumerate(result['ingredients'], 1):
                line = f"{i}. {ing['name']:<30} {ing.get('amount', 'N/A'):>8} {ing.get('unit', '')}"
                if ing.get('percentDailyValue'):
                    line += f"  ({ing['percentDailyValue']})"
                print(line)
            
            print("\n" + "=" * 60)
            
            # Save result
            output_file = 'llava_result.json'
            with open(output_file, 'w') as f:
                json.dump(result, f, indent=2)
            print(f"\n💾 Results saved to: {output_file}")
        
        else:
            print(f"\n❌ Analysis failed: {result.get('error')}")
            if result.get('rawResponse'):
                print(f"\nRaw response:\n{result['rawResponse']}")
    
    except RuntimeError as e:
        print(f"\n❌ Setup Error: {e}")
        print("\nSetup instructions:")
        print("1. Install Ollama: brew install ollama")
        print("2. Start Ollama: ollama serve")
        print("3. Download model: ollama pull llava")


if __name__ == '__main__':
    main()

