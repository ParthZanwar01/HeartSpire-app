#!/usr/bin/env python3
"""
Production Flask server for vitamin ingredient extraction
Supports both LLaVA (free) and fallback options
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import tempfile
import os
import time

app = Flask(__name__)
CORS(app)  # Allow requests from React Native

# Try to load LLaVA
try:
    from llava_approach import LLaVAIngredientExtractor
    extractor = LLaVAIngredientExtractor()
    LLAVA_AVAILABLE = True
    print("✅ LLaVA loaded successfully")
except Exception as e:
    print(f"⚠️  LLaVA not available: {e}")
    LLAVA_AVAILABLE = False

# Try to load OCR as fallback
try:
    from ocr_approach import OCRIngredientExtractor
    ocr_extractor = OCRIngredientExtractor()
    OCR_AVAILABLE = True
    print("✅ OCR loaded successfully")
except Exception as e:
    print(f"⚠️  OCR not available: {e}")
    OCR_AVAILABLE = False


def generate_ingredient_descriptions(ingredients):
    """Generate AI descriptions for each ingredient using LLaVA"""
    if not LLAVA_AVAILABLE or not ingredients:
        return ingredients
    
    try:
        import requests
        
        # Create a prompt for all ingredients at once
        ingredient_names = [ing.get('name', '') for ing in ingredients if ing.get('name')]
        if not ingredient_names:
            return ingredients
        
        prompt = f"""For each of these prenatal vitamin ingredients, explain what it does during pregnancy in 1-2 sentences:
{', '.join(ingredient_names)}

Format your response as JSON:
{{"descriptions": [{{"name": "ingredient name", "description": "what it does during pregnancy"}}]}}

Focus on benefits for mom and baby. Keep each description under 100 characters."""
        
        # Call LLaVA for text generation
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llava",
                "prompt": prompt,
                "stream": False
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            response_text = result.get('response', '')
            
            # Try to parse JSON from response
            import json
            import re
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                descriptions_data = json.loads(json_match.group())
                descriptions_map = {
                    desc['name'].lower(): desc['description']
                    for desc in descriptions_data.get('descriptions', [])
                }
                
                # Add descriptions to ingredients
                for ing in ingredients:
                    ing_name = ing.get('name', '').lower()
                    if ing_name in descriptions_map:
                        ing['description'] = descriptions_map[ing_name]
                
                print(f"✅ Generated descriptions for {len(descriptions_map)} ingredients")
        
    except Exception as e:
        print(f"⚠️ Could not generate descriptions: {e}")
    
    return ingredients


@app.route('/', methods=['GET'])
def home():
    """Home endpoint"""
    return jsonify({
        'service': 'VitaMom Ingredient Extraction API',
        'version': '1.0',
        'endpoints': {
            '/health': 'Health check',
            '/analyze': 'Analyze vitamin label (POST)',
            '/methods': 'Available extraction methods'
        }
    })


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'llava_available': LLAVA_AVAILABLE,
        'ocr_available': OCR_AVAILABLE,
        'timestamp': time.time()
    })


@app.route('/methods', methods=['GET'])
def methods():
    """List available extraction methods"""
    return jsonify({
        'available_methods': {
            'llava': LLAVA_AVAILABLE,
            'ocr': OCR_AVAILABLE
        },
        'default': 'llava' if LLAVA_AVAILABLE else 'ocr' if OCR_AVAILABLE else 'none'
    })


@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Analyze vitamin label image
    
    Request:
    {
        "image": "base64_encoded_image",
        "method": "llava" | "ocr" (optional),
        "includeDescriptions": true (optional) - generate ingredient descriptions
    }
    
    Response:
    {
        "success": true,
        "productName": "...",
        "servingSize": "...",
        "ingredients": [
            {"name": "...", "amount": "...", "unit": "...", "percentDailyValue": "...", "description": "..."}
        ],
        "warnings": [...],
        "method": "llava",
        "processingTime": 6.2
    }
    """
    start_time = time.time()
    
    try:
        # Get request data
        data = request.json
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'No image provided'
            }), 400
        
        # Get method preference
        method = data.get('method', 'llava' if LLAVA_AVAILABLE else 'ocr')
        
        # Get base64 image
        image_data = data['image']
        
        # Remove data URI prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decode base64
        try:
            image_bytes = base64.b64decode(image_data)
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Invalid base64 image: {str(e)}'
            }), 400
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name
        
        # Analyze with requested method
        result = None
        
        if method == 'llava' and LLAVA_AVAILABLE:
            print(f"🤖 Analyzing with LLaVA...")
            result = extractor.analyze_image(tmp_path)
            result['method'] = 'llava'
        
        elif method == 'ocr' and OCR_AVAILABLE:
            print(f"🔍 Analyzing with OCR...")
            result = ocr_extractor.analyze_image(tmp_path)
            result['method'] = 'ocr'
        
        else:
            # Try any available method
            if LLAVA_AVAILABLE:
                print(f"🤖 Falling back to LLaVA...")
                result = extractor.analyze_image(tmp_path)
                result['method'] = 'llava'
            elif OCR_AVAILABLE:
                print(f"🔍 Falling back to OCR...")
                result = ocr_extractor.analyze_image(tmp_path)
                result['method'] = 'ocr'
            else:
                return jsonify({
                    'success': False,
                    'error': 'No extraction method available'
                }), 503
        
        # Clean up temporary file
        try:
            os.unlink(tmp_path)
        except:
            pass
        
        # Generate ingredient descriptions if requested
        if data.get('includeDescriptions', False) and result.get('ingredients'):
            print(f"🤖 Generating ingredient descriptions...")
            result['ingredients'] = generate_ingredient_descriptions(result['ingredients'])
        
        # Add processing time
        result['processingTime'] = round(time.time() - start_time, 2)
        
        print(f"✅ Analysis complete in {result['processingTime']}s")
        
        return jsonify(result)
    
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': str(e),
            'processingTime': round(time.time() - start_time, 2)
        }), 500


@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


if __name__ == '__main__':
    print("\n🚀 Starting VitaMom Ingredient Extraction API")
    print("=" * 60)
    print(f"LLaVA available: {LLAVA_AVAILABLE}")
    print(f"OCR available: {OCR_AVAILABLE}")
    print("=" * 60)
    print("\nServer starting on http://0.0.0.0:5000")
    print("Endpoints:")
    print("  GET  /         - API info")
    print("  GET  /health   - Health check")
    print("  POST /analyze  - Analyze image")
    print("\n")
    
    # For production, use gunicorn instead:
    # gunicorn production_server:app --bind 0.0.0.0:5000 --workers 2
    app.run(host='0.0.0.0', port=5000, debug=False)

