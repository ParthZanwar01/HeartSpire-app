/**
 * Automated testing script for ingredient identification
 * Run this to test the AI on multiple vitamin label images
 */

import {analyzeVitaminLabel, mockAnalyzeVitaminLabel, AnalysisResult} from '../services/IngredientAI';
import {testCases, TestCase} from './testData';

export interface TestResult {
  testCase: TestCase;
  result: AnalysisResult;
  accuracy: number;
  matchedIngredients: string[];
  missedIngredients: string[];
  extraIngredients: string[];
  duration: number;
}

export interface TestSummary {
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  averageAccuracy: number;
  totalDuration: number;
  results: TestResult[];
}

/**
 * Run all tests
 * @param apiKey - OpenAI API key (optional - will use mock if not provided)
 * @param testCasesToRun - Specific test cases to run (optional - runs all if not provided)
 */
export async function runAllTests(
  apiKey?: string,
  testCasesToRun?: TestCase[]
): Promise<TestSummary> {
  const casesToTest = testCasesToRun || testCases;
  const results: TestResult[] = [];

  console.log(`\n🧪 Starting Ingredient Identification Tests...`);
  console.log(`📊 Running ${casesToTest.length} test cases\n`);

  for (const testCase of casesToTest) {
    console.log(`\n▶️  Testing: ${testCase.name}`);
    console.log(`   Image: ${testCase.imageUrl}`);
    
    const startTime = Date.now();
    
    // Run analysis (use mock if no API key)
    const result = apiKey
      ? await analyzeVitaminLabel(testCase.imageUrl, apiKey)
      : await mockAnalyzeVitaminLabel(testCase.imageUrl);
    
    const duration = Date.now() - startTime;

    // Calculate accuracy
    const testResult = calculateAccuracy(testCase, result, duration);
    results.push(testResult);

    // Print results
    printTestResult(testResult);
  }

  // Generate summary
  const summary = generateSummary(results);
  printSummary(summary);

  return summary;
}

/**
 * Calculate accuracy by comparing expected vs actual ingredients
 */
function calculateAccuracy(
  testCase: TestCase,
  result: AnalysisResult,
  duration: number
): TestResult {
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

  // Find matches (using fuzzy matching)
  const matched: string[] = [];
  const missed: string[] = [];
  const extra: string[] = [];

  // Check expected ingredients
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

  // Check for extra ingredients
  for (const identified of result.ingredients) {
    const found = expectedNames.some(expected => 
      fuzzyMatch(identified.name.toLowerCase(), expected)
    );
    
    if (!found) {
      extra.push(identified.name);
    }
  }

  // Calculate accuracy: (matched / (expected + extra)) * 100
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

/**
 * Fuzzy string matching for ingredient names
 */
function fuzzyMatch(str1: string, str2: string): boolean {
  // Direct match
  if (str1.includes(str2) || str2.includes(str1)) {
    return true;
  }

  // Handle common variations
  const variations: {[key: string]: string[]} = {
    'vitamin d': ['vitamin d3', 'cholecalciferol', 'vitamin d2', 'ergocalciferol'],
    'vitamin b6': ['pyridoxine', 'pyridoxal'],
    'vitamin b12': ['cobalamin', 'cyanocobalamin', 'methylcobalamin'],
    'folic acid': ['folate', 'vitamin b9', 'methylfolate'],
    'vitamin k': ['phylloquinone', 'menaquinone', 'vitamin k1', 'vitamin k2'],
    'dha': ['docosahexaenoic acid', 'omega-3'],
    'epa': ['eicosapentaenoic acid', 'omega-3'],
  };

  for (const [key, values] of Object.entries(variations)) {
    if ((str1.includes(key) || key.includes(str1)) && 
        values.some(v => str2.includes(v) || v.includes(str2))) {
      return true;
    }
  }

  return false;
}

/**
 * Print individual test result
 */
function printTestResult(result: TestResult): void {
  const status = result.result.success ? '✅' : '❌';
  const accuracyColor = result.accuracy >= 80 ? '🟢' : result.accuracy >= 50 ? '🟡' : '🔴';

  console.log(`   ${status} Status: ${result.result.success ? 'Success' : 'Failed'}`);
  console.log(`   ${accuracyColor} Accuracy: ${result.accuracy.toFixed(1)}%`);
  console.log(`   ⏱️  Duration: ${result.duration}ms`);
  
  if (result.result.success) {
    console.log(`   ✓ Matched: ${result.matchedIngredients.length} ingredients`);
    
    if (result.missedIngredients.length > 0) {
      console.log(`   ⚠️  Missed: ${result.missedIngredients.join(', ')}`);
    }
    
    if (result.extraIngredients.length > 0) {
      console.log(`   ℹ️  Extra: ${result.extraIngredients.join(', ')}`);
    }
  } else {
    console.log(`   ❌ Error: ${result.result.error}`);
  }
}

/**
 * Generate test summary
 */
function generateSummary(results: TestResult[]): TestSummary {
  const totalTests = results.length;
  const successfulTests = results.filter(r => r.result.success).length;
  const failedTests = totalTests - successfulTests;
  const averageAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / totalTests;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  return {
    totalTests,
    successfulTests,
    failedTests,
    averageAccuracy,
    totalDuration,
    results,
  };
}

/**
 * Print test summary
 */
function printSummary(summary: TestSummary): void {
  console.log('\n\n═══════════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════\n');
  
  console.log(`📝 Total Tests: ${summary.totalTests}`);
  console.log(`✅ Successful: ${summary.successfulTests} (${((summary.successfulTests / summary.totalTests) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${summary.failedTests} (${((summary.failedTests / summary.totalTests) * 100).toFixed(1)}%)`);
  console.log(`🎯 Average Accuracy: ${summary.averageAccuracy.toFixed(1)}%`);
  console.log(`⏱️  Total Duration: ${(summary.totalDuration / 1000).toFixed(2)}s`);
  console.log(`⚡ Avg Time per Test: ${(summary.totalDuration / summary.totalTests).toFixed(0)}ms`);

  // Accuracy breakdown
  const excellent = summary.results.filter(r => r.accuracy >= 90).length;
  const good = summary.results.filter(r => r.accuracy >= 70 && r.accuracy < 90).length;
  const fair = summary.results.filter(r => r.accuracy >= 50 && r.accuracy < 70).length;
  const poor = summary.results.filter(r => r.accuracy < 50).length;

  console.log('\n📈 Accuracy Breakdown:');
  console.log(`   🟢 Excellent (90-100%): ${excellent}`);
  console.log(`   🟡 Good (70-89%): ${good}`);
  console.log(`   🟠 Fair (50-69%): ${fair}`);
  console.log(`   🔴 Poor (<50%): ${poor}`);

  console.log('\n═══════════════════════════════════════════════════\n');
}

/**
 * Export results to JSON file
 */
export function exportResults(summary: TestSummary): string {
  return JSON.stringify(summary, null, 2);
}

