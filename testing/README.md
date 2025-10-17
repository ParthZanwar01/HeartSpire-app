# Ingredient Identification Testing Framework

This testing framework helps you validate the accuracy of the AI ingredient identification system using real vitamin label images.

## Quick Start

### 1. Run Tests (Mock Mode - No API Key Needed)

```bash
# Simple test run with mock data
node testing/testRunner.js
```

This will:
- Run tests on predefined vitamin label images
- Display accuracy metrics for each test
- Generate a summary report
- Save results to `test-results.json`

### 2. Run Tests with Real OpenAI API

First, set your OpenAI API key:

```bash
export OPENAI_API_KEY="your-api-key-here"
```

Then integrate with your React Native app to test real images.

## Test Data

### Adding Your Own Test Images

1. Add images to `assets/test-images/` folder
2. Update `testing/testData.ts` with your test cases:

```typescript
{
  id: 'my_test_1',
  name: 'My Vitamin Label',
  imageUrl: './assets/test-images/my-vitamin.jpg',
  expectedIngredients: ['Vitamin A', 'Vitamin C', 'Iron'],
  notes: 'Description of this test case'
}
```

### Using Online Vitamin Database Images

The test data file includes URLs to publicly available vitamin label images from:
- Nature Made product images
- One A Day product images  
- Vitacost product listings
- Nature's Plus catalog

## Test Metrics

The framework measures:

- **Accuracy**: % of expected ingredients correctly identified
- **Matched Ingredients**: Correctly identified ingredients
- **Missed Ingredients**: Expected but not found
- **Extra Ingredients**: Identified but not in expected list
- **Duration**: Time taken for analysis

## Accuracy Levels

- 🟢 **Excellent** (90-100%): Ready for production
- 🟡 **Good** (70-89%): Good but may need refinement
- 🟠 **Fair** (50-69%): Needs improvement
- 🔴 **Poor** (<50%): Not ready for use

## Testing Strategy

### Phase 1: Basic Ingredients (Current)
Test common vitamins and minerals:
- Vitamin A, C, D, E, K
- B-Complex vitamins
- Iron, Calcium, Zinc
- Folic Acid, DHA

### Phase 2: Complex Labels
Test supplements with:
- Many ingredients (20+)
- Small text
- Multiple serving sizes
- Various units (mg, mcg, IU, g)

### Phase 3: Edge Cases
Test challenging scenarios:
- Poor image quality
- Partial labels
- Unusual ingredients
- Foreign language labels

## Running Specific Tests

To run specific test cases:

```javascript
// In your test file
import {runAllTests} from './testing/runTests';
import {testCases} from './testing/testData';

// Run only prenatal tests
const prenatalTests = testCases.filter(t => t.id.includes('prenatal'));
await runAllTests(apiKey, prenatalTests);
```

## Continuous Testing

Set up automated testing:

1. **Before Each Release**: Run full test suite
2. **After AI Model Changes**: Compare results with baseline
3. **Weekly**: Test with new vitamin products
4. **User Feedback**: Add failed cases to test suite

## Interpreting Results

### High Accuracy (>90%)
- ✅ AI is working well for this type of label
- Continue monitoring

### Medium Accuracy (70-90%)
- ⚠️ Review missed ingredients
- May need prompt refinement
- Consider additional training data

### Low Accuracy (<70%)
- ❌ Investigate failures
- Check image quality
- Review AI prompt
- May need human verification

## Extending the Framework

### Add New Test Sources

```typescript
// In testData.ts
export const customTestCases: TestCase[] = [
  {
    id: 'custom_1',
    name: 'Your Custom Test',
    imageUrl: 'https://your-source.com/image.jpg',
    expectedIngredients: [...],
  },
];
```

### Custom Accuracy Metrics

```typescript
// In runTests.ts
function customAccuracyCalculation(testCase, result) {
  // Your custom logic here
  // e.g., weight certain ingredients more heavily
}
```

## Troubleshooting

### Tests Failing
1. Check image URLs are accessible
2. Verify API key is valid
3. Ensure internet connection
4. Review console logs for errors

### Low Accuracy
1. Check image quality/resolution
2. Verify expected ingredients are correct
3. Review AI prompt in `IngredientAI.ts`
4. Test with simpler labels first

### Slow Performance
1. Use mock mode for rapid iteration
2. Reduce number of test cases
3. Check API rate limits
4. Consider batching requests

## Integration with App

To use in your React Native app:

```typescript
import {analyzeVitaminLabel} from './services/IngredientAI';

// In your scan component
const handleImageScanned = async (imageUri: string) => {
  const result = await analyzeVitaminLabel(imageUri, OPENAI_API_KEY);
  
  if (result.success) {
    console.log('Identified ingredients:', result.ingredients);
    // Display to user
  } else {
    console.error('Analysis failed:', result.error);
  }
};
```

## Contributing

To add more test cases:
1. Find publicly available vitamin label images
2. Add to `testData.ts` with accurate expected ingredients
3. Run tests and verify accuracy
4. Submit with PR

## Resources

- OpenAI Vision API: https://platform.openai.com/docs/guides/vision
- Vitamin Label Databases:
  - NIH Dietary Supplements: https://ods.od.nih.gov/
  - FDA Nutrition Labels: https://www.fda.gov/food
  - Supplement Facts Panel Guide: https://www.fda.gov/food/nutrition-facts-label

