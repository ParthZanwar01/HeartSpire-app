#!/usr/bin/env python3
"""
Comprehensive Backend Testing Script
Tests the Hugging Face deployed backend with real vitamin images
"""

import os
import json
import base64
import requests
from PIL import Image
import io

# Backend URL
BACKEND_URL = "https://MathGenius01-vitamom-backend.hf.space"

def test_backend_health():
    """Test if backend is healthy"""
    print("🔍 Testing backend health...")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Backend is healthy!")
            print(f"   Status: {health_data.get('status')}")
            print(f"   OCR Available: {health_data.get('ocr_available')}")
            print(f"   LLaVA Available: {health_data.get('llava_available')}")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend health check error: {e}")
        return False

def image_to_base64(image_path):
    """Convert image to base64 string"""
    try:
        with open(image_path, 'rb') as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    except Exception as e:
        print(f"❌ Error converting {image_path} to base64: {e}")
        return None

def test_image_analysis(image_path, expected_ingredients=None):
    """Test image analysis with backend"""
    print(f"\n🧪 Testing image: {os.path.basename(image_path)}")
    
    # Convert image to base64
    base64_image = image_to_base64(image_path)
    if not base64_image:
        return False
    
    # Prepare request payload
    payload = {
        "image": base64_image,
        "method": "ocr",  # Use OCR since LLaVA might not be available
        "product_name": "",
        "serving_size": "",
        "ingredients": []
    }
    
    try:
        # Send request to backend
        print("   📤 Sending request to backend...")
        response = requests.post(
            f"{BACKEND_URL}/analyze",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Analysis successful!")
            print(f"   📋 Product: {result.get('product_name', 'Unknown')}")
            print(f"   📏 Serving: {result.get('serving_size', 'Unknown')}")
            
            ingredients = result.get('ingredients', [])
            print(f"   🧪 Found {len(ingredients)} ingredients:")
            for i, ingredient in enumerate(ingredients[:5], 1):  # Show first 5
                print(f"      {i}. {ingredient}")
            
            if len(ingredients) > 5:
                print(f"      ... and {len(ingredients) - 5} more")
            
            # Check for warnings
            warnings = result.get('warnings', [])
            if warnings:
                print(f"   ⚠️  Warnings: {len(warnings)}")
                for warning in warnings[:2]:  # Show first 2 warnings
                    print(f"      - {warning}")
            
            return True
        else:
            print(f"   ❌ Analysis failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Analysis error: {e}")
        return False

def test_frontend_format(image_path):
    """Test if response matches frontend expected format"""
    print(f"\n📱 Testing frontend format compatibility...")
    
    base64_image = image_to_base64(image_path)
    if not base64_image:
        return False
    
    payload = {
        "image": base64_image,
        "method": "ocr"
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/analyze",
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            
            # Check required fields for frontend
            required_fields = ['product_name', 'serving_size', 'ingredients', 'warnings']
            missing_fields = [field for field in required_fields if field not in result]
            
            if missing_fields:
                print(f"   ❌ Missing fields: {missing_fields}")
                return False
            
            # Check data types
            if not isinstance(result['ingredients'], list):
                print(f"   ❌ Ingredients should be list, got {type(result['ingredients'])}")
                return False
            
            if not isinstance(result['warnings'], list):
                print(f"   ❌ Warnings should be list, got {type(result['warnings'])}")
                return False
            
            print(f"   ✅ Frontend format compatible!")
            print(f"   📊 Product: {result['product_name']}")
            print(f"   📊 Ingredients: {len(result['ingredients'])} items")
            print(f"   📊 Warnings: {len(result['warnings'])} items")
            
            return True
        else:
            print(f"   ❌ Frontend test failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Frontend test error: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 COMPREHENSIVE BACKEND TESTING")
    print("=" * 50)
    
    # Test 1: Backend Health
    if not test_backend_health():
        print("\n❌ Backend is not healthy. Stopping tests.")
        return
    
    # Test 2: Image Analysis
    images_dir = "/Users/parthzanwar/Desktop/HeartSpire-app/python-free-implementation/openfoodfacts_data/images"
    
    if not os.path.exists(images_dir):
        print(f"❌ Images directory not found: {images_dir}")
        return
    
    # Get first 3 images for testing
    image_files = [f for f in os.listdir(images_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))][:3]
    
    if not image_files:
        print("❌ No images found for testing")
        return
    
    print(f"\n🧪 Testing with {len(image_files)} images...")
    
    successful_tests = 0
    for image_file in image_files:
        image_path = os.path.join(images_dir, image_file)
        if test_image_analysis(image_path):
            successful_tests += 1
    
    print(f"\n📊 IMAGE ANALYSIS RESULTS:")
    print(f"   ✅ Successful: {successful_tests}/{len(image_files)}")
    print(f"   ❌ Failed: {len(image_files) - successful_tests}/{len(image_files)}")
    
    # Test 3: Frontend Format Compatibility
    if successful_tests > 0:
        test_image = os.path.join(images_dir, image_files[0])
        if test_frontend_format(test_image):
            print(f"\n✅ FRONTEND INTEGRATION READY!")
        else:
            print(f"\n❌ FRONTEND INTEGRATION ISSUES DETECTED!")
    
    print(f"\n🎯 BACKEND TEST SUMMARY:")
    print(f"   🔗 Backend URL: {BACKEND_URL}")
    print(f"   📸 Images tested: {len(image_files)}")
    print(f"   ✅ Success rate: {successful_tests}/{len(image_files)} ({successful_tests/len(image_files)*100:.1f}%)")
    
    if successful_tests == len(image_files):
        print(f"\n🎉 ALL TESTS PASSED! Your backend is ready for production!")
    elif successful_tests > 0:
        print(f"\n⚠️  PARTIAL SUCCESS - Some images worked, others failed")
    else:
        print(f"\n❌ ALL TESTS FAILED - Backend needs debugging")

if __name__ == "__main__":
    main()
