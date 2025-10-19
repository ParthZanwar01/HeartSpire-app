#!/usr/bin/env python3
"""
Debug script to test backend with a simple image
"""

import requests
import base64
import os

# Backend URL
BACKEND_URL = "https://MathGenius01-vitamom-backend.hf.space"

def create_test_image():
    """Create a simple test image with text"""
    from PIL import Image, ImageDraw, ImageFont
    
    # Create a simple image with text
    img = Image.new('RGB', (400, 200), color='white')
    draw = ImageDraw.Draw(img)
    
    # Try to use a default font
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
    except:
        font = ImageFont.load_default()
    
    # Draw some test text
    text = "VITAMIN C\n500mg\nINGREDIENTS:\nVitamin C, Ascorbic Acid"
    draw.text((10, 10), text, fill='black', font=font)
    
    # Save to temporary file
    img.save('/tmp/test_image.png')
    return '/tmp/test_image.png'

def test_backend_debug():
    """Test backend with debug information"""
    print("🔍 Testing backend with debug info...")
    
    # Test 1: Health check
    print("\n1. Health Check:")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 2: Methods check
    print("\n2. Available Methods:")
    try:
        response = requests.get(f"{BACKEND_URL}/methods", timeout=10)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 3: Create and test with simple image
    print("\n3. Testing with simple image:")
    try:
        # Create test image
        test_image_path = create_test_image()
        
        # Convert to base64
        with open(test_image_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        
        # Test with minimal payload
        payload = {
            "image": image_data,
            "method": "ocr"
        }
        
        print(f"   Image size: {len(image_data)} characters")
        print(f"   Sending request...")
        
        response = requests.post(
            f"{BACKEND_URL}/analyze",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        # Clean up
        os.remove(test_image_path)
        
    except Exception as e:
        print(f"   Error: {e}")

if __name__ == "__main__":
    test_backend_debug()
