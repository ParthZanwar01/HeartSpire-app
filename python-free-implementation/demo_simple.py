#!/usr/bin/env python3
"""
Simple demo showing how the free approaches work
No image needed - just demonstrates the API
"""

import json

def demo_ocr_result():
    """Show example OCR extraction result"""
    print("\n" + "="*60)
    print("🔍 OCR APPROACH DEMO")
    print("="*60)
    print("\nHow it works:")
    print("1. Extract text from image using Tesseract OCR")
    print("2. Use regex patterns to find ingredients")
    print("3. Match amounts and units")
    
    print("\nExample result:")
    result = {
        "success": True,
        "productName": "Prenatal Multivitamin Complete",
        "ingredients": [
            {"name": "Vitamin A", "amount": "770", "unit": "mcg"},
            {"name": "Vitamin C", "amount": "85", "unit": "mg"},
            {"name": "Vitamin D3", "amount": "600", "unit": "IU"},
            {"name": "Folic Acid", "amount": "600", "unit": "mcg"},
            {"name": "Iron", "amount": "27", "unit": "mg"},
            {"name": "Calcium", "amount": "200", "unit": "mg"},
        ],
        "method": "ocr",
        "duration": 0.8
    }
    
    print(f"\n{'Ingredient':<25} {'Amount':>8} {'Unit':<6}")
    print("-" * 45)
    for ing in result['ingredients']:
        print(f"{ing['name']:<25} {ing['amount']:>8} {ing['unit']:<6}")
    
    print(f"\n⚡ Speed: {result['duration']}s")
    print("💰 Cost: $0")
    print("🎯 Accuracy: ~75%")


def demo_llava_result():
    """Show example LLaVA extraction result"""
    print("\n\n" + "="*60)
    print("🤖 LLAVA APPROACH DEMO")
    print("="*60)
    print("\nHow it works:")
    print("1. Send image to local LLaVA model (via Ollama)")
    print("2. AI understands the image context")
    print("3. Returns structured JSON with all ingredients")
    
    print("\nExample result:")
    result = {
        "success": True,
        "productName": "Nature Made Prenatal Multi + DHA",
        "servingSize": "1 softgel",
        "ingredients": [
            {"name": "Vitamin A", "amount": "770", "unit": "mcg", "percentDailyValue": "85%"},
            {"name": "Vitamin C", "amount": "85", "unit": "mg", "percentDailyValue": "94%"},
            {"name": "Vitamin D3", "amount": "600", "unit": "IU", "percentDailyValue": "150%"},
            {"name": "Vitamin E", "amount": "11", "unit": "mg", "percentDailyValue": "73%"},
            {"name": "Vitamin B6", "amount": "1.9", "unit": "mg", "percentDailyValue": "112%"},
            {"name": "Folic Acid", "amount": "600", "unit": "mcg", "percentDailyValue": "150%"},
            {"name": "Vitamin B12", "amount": "2.6", "unit": "mcg", "percentDailyValue": "108%"},
            {"name": "Iron", "amount": "27", "unit": "mg", "percentDailyValue": "150%"},
            {"name": "Calcium", "amount": "200", "unit": "mg", "percentDailyValue": "15%"},
            {"name": "Zinc", "amount": "11", "unit": "mg", "percentDailyValue": "100%"},
            {"name": "DHA", "amount": "200", "unit": "mg"},
        ],
        "method": "llava",
        "duration": 6.2
    }
    
    print(f"\n{'Ingredient':<25} {'Amount':>8} {'Unit':<6} {'%DV':<8}")
    print("-" * 55)
    for ing in result['ingredients']:
        dv = ing.get('percentDailyValue', '-')
        print(f"{ing['name']:<25} {ing['amount']:>8} {ing['unit']:<6} {dv:<8}")
    
    print(f"\n⚡ Speed: {result['duration']}s")
    print("💰 Cost: $0")
    print("🎯 Accuracy: ~88%")


def show_comparison():
    """Show comparison table"""
    print("\n\n" + "="*60)
    print("📊 METHOD COMPARISON")
    print("="*60)
    
    comparison = [
        ["Method", "Accuracy", "Speed", "Cost", "Setup"],
        ["-"*15, "-"*10, "-"*10, "-"*10, "-"*10],
        ["OCR", "70-80%", "<1s", "$0", "5 min"],
        ["LLaVA", "85-92%", "5-15s", "$0", "15 min"],
        ["OpenAI API", "90-95%", "2-4s", "$0.01", "2 min"],
    ]
    
    for row in comparison:
        print(f"{row[0]:<15} {row[1]:<12} {row[2]:<12} {row[3]:<12} {row[4]:<10}")
    
    print("\n💡 RECOMMENDATIONS:")
    print("\n   For Quick Testing:")
    print("   → OCR (fast, simple, free)")
    
    print("\n   For Production:")
    print("   → LLaVA (best free option)")
    
    print("\n   For Maximum Accuracy:")
    print("   → OpenAI API (costs add up)")


def show_setup_commands():
    """Show setup commands"""
    print("\n\n" + "="*60)
    print("🚀 QUICK SETUP")
    print("="*60)
    
    print("\n📦 Option 1: OCR (Simplest)")
    print("-" * 40)
    print("brew install tesseract")
    print("pip install pytesseract pillow")
    print("python ocr_approach.py image.jpg")
    
    print("\n🤖 Option 2: LLaVA (Best Free)")
    print("-" * 40)
    print("brew install ollama")
    print("ollama serve  # in separate terminal")
    print("ollama pull llava")
    print("pip install requests")
    print("python llava_approach.py image.jpg")
    
    print("\n💰 Option 3: OpenAI (Paid)")
    print("-" * 40)
    print("pip install openai")
    print("export OPENAI_API_KEY='your-key'")
    print("# Use services/IngredientAI.ts in your app")


def main():
    print("\n" + "="*60)
    print("🎉 FREE INGREDIENT EXTRACTION - DEMO")
    print("="*60)
    
    demo_ocr_result()
    demo_llava_result()
    show_comparison()
    show_setup_commands()
    
    print("\n\n" + "="*60)
    print("📚 NEXT STEPS")
    print("="*60)
    print("""
1. Choose your approach:
   - OCR for quick testing
   - LLaVA for production
   
2. Follow setup guide:
   - Read SETUP_GUIDE.md
   - Install requirements
   
3. Test with real images:
   - python ocr_approach.py your_vitamin_label.jpg
   - python llava_approach.py your_vitamin_label.jpg
   
4. Compare results:
   - python test_all.py your_vitamin_label.jpg
   
5. Integrate with your app:
   - See SETUP_GUIDE.md for Flask backend example

✨ All methods are 100% FREE! No API costs ever.
    """)


if __name__ == '__main__':
    main()

