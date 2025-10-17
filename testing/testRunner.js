#!/usr/bin/env node

/**
 * Command-line test runner for ingredient identification
 * Usage: node testing/testRunner.js [options]
 */

const fs = require('fs');
const path = require('path');

// Import test functions (we'll use mock mode for now)
// In real usage, you'd transpile the TypeScript files first

async function mockAnalyze(imageUrl) {
  // Simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Mock different responses based on image URL
  if (imageUrl.includes('prenatal')) {
    return {
      success: true,
      productName: 'Prenatal Multivitamin',
      servingSize: '1 tablet',
      ingredients: [
        {name: 'Vitamin A', amount: '770', unit: 'mcg', percentDailyValue: '85%'},
        {name: 'Vitamin C', amount: '85', unit: 'mg', percentDailyValue: '94%'},
        {name: 'Vitamin D3', amount: '15', unit: 'mcg', percentDailyValue: '75%'},
        {name: 'Folic Acid', amount: '600', unit: 'mcg', percentDailyValue: '150%'},
        {name: 'Iron', amount: '27', unit: 'mg', percentDailyValue: '150%'},
        {name: 'Calcium', amount: '200', unit: 'mg', percentDailyValue: '15%'},
        {name: 'DHA', amount: '200', unit: 'mg'},
      ],
    };
  } else if (imageUrl.includes('vitamin-d') || imageUrl.includes('vitamin_d')) {
    return {
      success: true,
      productName: 'Vitamin D3',
      servingSize: '1 softgel',
      ingredients: [
        {name: 'Vitamin D3', amount: '2000', unit: 'IU', percentDailyValue: '500%'},
      ],
    };
  } else if (imageUrl.includes('calcium')) {
    return {
      success: true,
      productName: 'Calcium + D',
      servingSize: '2 tablets',
      ingredients: [
        {name: 'Calcium', amount: '600', unit: 'mg', percentDailyValue: '46%'},
        {name: 'Vitamin D', amount: '800', unit: 'IU', percentDailyValue: '200%'},
      ],
    };
  } else {
    return {
      success: true,
      productName: 'Multivitamin',
      servingSize: '1 tablet',
      ingredients: [
        {name: 'Vitamin A', amount: '900', unit: 'mcg'},
        {name: 'Vitamin C', amount: '90', unit: 'mg'},
        {name: 'Vitamin D', amount: '20', unit: 'mcg'},
        {name: 'Vitamin E', amount: '15', unit: 'mg'},
        {name: 'Vitamin B6', amount: '2', unit: 'mg'},
        {name: 'Folic Acid', amount: '400', unit: 'mcg'},
        {name: 'Vitamin B12', amount: '6', unit: 'mcg'},
      ],
    };
  }
}

const testCases = [
  {
    id: 'prenatal_1',
    name: 'Nature Made Prenatal Multi + DHA',
    imageUrl: 'https://example.com/prenatal-1.jpg',
    expectedIngredients: [
      'Vitamin A', 'Vitamin C', 'Vitamin D3', 'Vitamin E', 'Vitamin B6',
      'Folic Acid', 'Vitamin B12', 'Iron', 'Zinc', 'DHA',
    ],
  },
  {
    id: 'prenatal_2',
    name: 'One A Day Prenatal',
    imageUrl: 'https://example.com/prenatal-2.jpg',
    expectedIngredients: [
      'Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin E', 'Thiamin',
      'Riboflavin', 'Niacin', 'Vitamin B6', 'Folic Acid', 'Vitamin B12',
      'Calcium', 'Iron', 'Zinc',
    ],
  },
  {
    id: 'vitamin_d3_1',
    name: 'Vitamin D3 2000 IU',
    imageUrl: 'https://example.com/vitamin-d3.jpg',
    expectedIngredients: ['Vitamin D3', 'Cholecalciferol'],
  },
  {
    id: 'calcium_1',
    name: 'Calcium with Vitamin D',
    imageUrl: 'https://example.com/calcium.jpg',
    expectedIngredients: ['Calcium', 'Vitamin D'],
  },
];

function fuzzyMatch(str1, str2) {
  str1 = str1.toLowerCase();
  str2 = str2.toLowerCase();
  
  if (str1.includes(str2) || str2.includes(str1)) {
    return true;
  }

  const variations = {
    'vitamin d': ['vitamin d3', 'cholecalciferol', 'vitamin d2'],
    'vitamin b6': ['pyridoxine'],
    'vitamin b12': ['cobalamin', 'cyanocobalamin'],
    'folic acid': ['folate', 'vitamin b9'],
    'dha': ['docosahexaenoic acid', 'omega-3'],
  };

  for (const [key, values] of Object.entries(variations)) {
    if ((str1.includes(key) || key.includes(str1)) && 
        values.some(v => str2.includes(v) || v.includes(str2))) {
      return true;
    }
  }

  return false;
}

function calculateAccuracy(testCase, result, duration) {
  if (!result.success) {
    return {
      testCase,
      result,
      accuracy: 0,
      matchedIngredients: [],
      missedIngredients: testCase.expectedIngredients,
      extraIngredients: [],
      duration,
    };
  }

  const identifiedNames = result.ingredients.map(ing => 
    ing.name.toLowerCase().trim()
  );
  
  const expectedNames = testCase.expectedIngredients.map(ing => 
    ing.toLowerCase().trim()
  );

  const matched = [];
  const missed = [];

  for (const expected of testCase.expectedIngredients) {
    const found = identifiedNames.some(identified => 
      fuzzyMatch(identified, expected.toLowerCase())
    );
    
    if (found) {
      matched.push(expected);
    } else {
      missed.push(expected);
    }
  }

  const extra = [];
  for (const ingredient of result.ingredients) {
    const found = expectedNames.some(expected => 
      fuzzyMatch(ingredient.name.toLowerCase(), expected)
    );
    
    if (!found) {
      extra.push(ingredient.name);
    }
  }

  const accuracy = testCase.expectedIngredients.length > 0
    ? (matched.length / testCase.expectedIngredients.length) * 100
    : 0;

  return {
    testCase,
    result,
    accuracy,
    matchedIngredients: matched,
    missedIngredients: missed,
    extraIngredients: extra,
    duration,
  };
}

async function runAllTests() {
  console.log('\n🧪 Starting Ingredient Identification Tests...');
  console.log(`📊 Running ${testCases.length} test cases\n`);

  const results = [];

  for (const testCase of testCases) {
    console.log(`\n▶️  Testing: ${testCase.name}`);
    
    const startTime = Date.now();
    const result = await mockAnalyze(testCase.imageUrl);
    const duration = Date.now() - startTime;

    const testResult = calculateAccuracy(testCase, result, duration);
    results.push(testResult);

    // Print result
    const status = testResult.result.success ? '✅' : '❌';
    const accuracyIcon = testResult.accuracy >= 80 ? '🟢' : testResult.accuracy >= 50 ? '🟡' : '🔴';

    console.log(`   ${status} Status: ${testResult.result.success ? 'Success' : 'Failed'}`);
    console.log(`   ${accuracyIcon} Accuracy: ${testResult.accuracy.toFixed(1)}%`);
    console.log(`   ⏱️  Duration: ${testResult.duration}ms`);
    console.log(`   ✓ Matched: ${testResult.matchedIngredients.length} ingredients`);
    
    if (testResult.missedIngredients.length > 0) {
      console.log(`   ⚠️  Missed: ${testResult.missedIngredients.join(', ')}`);
    }
  }

  // Summary
  const totalTests = results.length;
  const successfulTests = results.filter(r => r.result.success).length;
  const averageAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / totalTests;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log('\n\n═══════════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════\n');
  
  console.log(`📝 Total Tests: ${totalTests}`);
  console.log(`✅ Successful: ${successfulTests} (${((successfulTests / totalTests) * 100).toFixed(1)}%)`);
  console.log(`🎯 Average Accuracy: ${averageAccuracy.toFixed(1)}%`);
  console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);

  // Save results
  const reportPath = path.join(__dirname, 'test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalTests,
    successfulTests,
    averageAccuracy,
    totalDuration,
    results,
  }, null, 2));

  console.log(`\n💾 Results saved to: ${reportPath}\n`);
}

// Run tests
runAllTests().catch(console.error);

