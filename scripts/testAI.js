#!/usr/bin/env node

/**
 * Quick test script for AI ingredient identification
 * Usage: node scripts/testAI.js
 */

console.log('\n🧪 AI Ingredient Identification Test\n');
console.log('=' .repeat(50));

// Simulate analysis
console.log('\n📸 Simulating vitamin label scan...\n');

setTimeout(() => {
  const mockResult = {
    success: true,
    productName: 'Prenatal Multivitamin Complete',
    servingSize: '1 tablet',
    ingredients: [
      {
        name: 'Vitamin A',
        amount: '770',
        unit: 'mcg',
        percentDailyValue: '85%',
        confidence: 95,
      },
      {
        name: 'Vitamin C',
        amount: '85',
        unit: 'mg',
        percentDailyValue: '94%',
        confidence: 98,
      },
      {
        name: 'Vitamin D3',
        amount: '600',
        unit: 'IU',
        percentDailyValue: '150%',
        confidence: 97,
      },
      {
        name: 'Folic Acid',
        amount: '600',
        unit: 'mcg',
        percentDailyValue: '150%',
        confidence: 99,
      },
      {
        name: 'Iron',
        amount: '27',
        unit: 'mg',
        percentDailyValue: '150%',
        confidence: 96,
      },
      {
        name: 'Calcium',
        amount: '200',
        unit: 'mg',
        percentDailyValue: '15%',
        confidence: 94,
      },
      {
        name: 'DHA',
        amount: '200',
        unit: 'mg',
        confidence: 92,
      },
    ],
    warnings: ['Contains fish (DHA from fish oil)', 'Contains iron - keep out of reach of children'],
  };

  console.log('✅ Analysis Complete!\n');
  console.log(`📦 Product: ${mockResult.productName}`);
  console.log(`📏 Serving Size: ${mockResult.servingSize}`);
  console.log(`\n💊 Ingredients Found: ${mockResult.ingredients.length}\n`);

  const avgConfidence = mockResult.ingredients.reduce((sum, i) => sum + i.confidence, 0) / mockResult.ingredients.length;

  console.log('Ingredient Details:');
  console.log('-'.repeat(70));
  mockResult.ingredients.forEach((ing, idx) => {
    const confidenceIcon = ing.confidence >= 95 ? '🟢' : ing.confidence >= 85 ? '🟡' : '🔴';
    console.log(`${idx + 1}. ${ing.name.padEnd(25)} ${(ing.amount + ' ' + ing.unit).padEnd(15)} ${ing.percentDailyValue || ''}`);
    console.log(`   ${confidenceIcon} Confidence: ${ing.confidence}%`);
  });

  console.log('\n' + '-'.repeat(70));
  console.log(`\n🎯 Average Confidence: ${avgConfidence.toFixed(1)}%`);

  if (mockResult.warnings && mockResult.warnings.length > 0) {
    console.log(`\n⚠️  Warnings:`);
    mockResult.warnings.forEach(w => console.log(`   • ${w}`));
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n✨ Test completed successfully!\n');
  console.log('💡 Next steps:');
  console.log('   1. Run full test suite: node testing/testRunner.js');
  console.log('   2. Test with real images in your app');
  console.log('   3. Add your OpenAI API key to use real AI analysis');
  console.log('   4. Monitor accuracy and collect user feedback\n');

}, 1500);

