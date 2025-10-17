/**
 * Improved Ingredient AI Service with better prompts and validation
 */

import {
  AnalysisResult,
  IdentifiedIngredient,
  analyzeVitaminLabel as baseAnalyze,
  mockAnalyzeVitaminLabel,
} from './IngredientAI';
import {
  findIngredient,
  normalizeIngredientName,
  validateIngredientAmount,
  getIngredientWarnings,
  isValidUnit,
} from './IngredientKnowledgeBase';

export interface ImprovedIngredient extends IdentifiedIngredient {
  confidence: number; // 0-100
  normalized: boolean;
  warnings: string[];
  chemicalForm?: string;
}

export interface ImprovedAnalysisResult extends Omit<AnalysisResult, 'ingredients'> {
  ingredients: ImprovedIngredient[];
  overallConfidence: number;
  qualityWarnings: string[];
  processingTime: number;
}

/**
 * Enhanced prompt for better extraction
 */
const ENHANCED_PROMPT = `You are a professional nutritionist and supplement label analyzer with expertise in FDA supplement labeling requirements, vitamin nomenclature, and prenatal nutrition.

## TASK
Analyze this prenatal vitamin/supplement label image with extreme precision and extract ALL ingredient information.

## EXTRACTION RULES

### 1. PRODUCT INFORMATION
- Extract the exact product name as shown
- Note if it's specifically for prenatal/pregnancy use
- Identify manufacturer if visible

### 2. SERVING INFORMATION
- Serving size (e.g., "1 tablet", "2 softgels")
- Servings per container (if visible)

### 3. INGREDIENT EXTRACTION
For EACH vitamin, mineral, or nutrient, extract:

**Name**: Use the most specific form shown:
- Prefer chemical names (e.g., "Cholecalciferol" over "Vitamin D")
- Include both if shown (e.g., "Vitamin D3 (Cholecalciferol)")
- Note the "as" form if listed (e.g., "as Ferrous Sulfate")

**Amount**: Extract ONLY the numeric value
- If multiple forms shown (e.g., "2000 IU (50 mcg)"), use the primary value
- Handle ranges (e.g., "100-200 mg" → use "150")

**Unit**: mg, mcg, g, IU, μg, etc.
- Use consistent abbreviations
- Note: mcg and μg are the same

**% Daily Value**: If shown
- Use for pregnant/lactating women if specified
- Note if it's for different population

**Chemical Form**: The "as [chemical name]" part
- Example: "as Calcium Carbonate", "as d-alpha-Tocopherol"

### 4. ADDITIONAL INFORMATION
- **Other Ingredients**: Inactive ingredients, fillers, etc.
- **Allergen Warnings**: Contains fish, soy, etc.
- **Warnings**: "Contains iron - keep away from children", etc.
- **Proprietary Blends**: Note if ingredients are in a blend with total amount only

### 5. QUALITY CHECKS
- If text is unclear/illegible, note it
- If label appears cropped/partial, mention it
- If amounts seem unusual, flag them

## OUTPUT FORMAT
Return ONLY valid JSON:

\`\`\`json
{
  "productName": "Exact product name",
  "servingSize": "1 tablet",
  "servingsPerContainer": "60",
  "isPrenatal": true,
  "ingredients": [
    {
      "name": "Vitamin D3",
      "amount": "2000",
      "unit": "IU",
      "percentDailyValue": "500%",
      "chemicalForm": "as Cholecalciferol",
      "alternateAmount": "50",
      "alternateUnit": "mcg"
    }
  ],
  "otherIngredients": ["Gelatin", "Glycerin", "Water"],
  "warnings": ["Contains soy", "Contains iron - keep out of reach of children"],
  "notes": "Label partially visible" or "All text clear"
}
\`\`\`

## COMMON PITFALLS TO AVOID
- Don't confuse "l" with "1", "O" with "0"
- Don't mix up mg and mcg (1000x difference!)
- Don't miss ingredients in footnotes or "Other ingredients" sections
- Don't skip % Daily Value information
- Don't forget to extract the chemical form ("as" statements)

Be thorough, precise, and extract EVERY piece of information visible on the label.`;

/**
 * Analyze with improved prompts and validation
 */
export async function analyzeWithImprovements(
  imageUri: string,
  apiKey: string,
  useMock: boolean = false
): Promise<ImprovedAnalysisResult> {
  const startTime = Date.now();
  
  try {
    // Step 1: Run base analysis with enhanced prompt
    const result = useMock
      ? await mockAnalyzeVitaminLabel(imageUri)
      : await analyzeVitaminLabelEnhanced(imageUri, apiKey);
    
    if (!result.success) {
      return {
        ...result,
        ingredients: [],
        overallConfidence: 0,
        qualityWarnings: [result.error || 'Analysis failed'],
        processingTime: Date.now() - startTime,
      };
    }
    
    // Step 2: Enhance each ingredient with validation and confidence scoring
    const enhancedIngredients: ImprovedIngredient[] = [];
    const qualityWarnings: string[] = [];
    
    for (const ingredient of result.ingredients) {
      const enhanced = enhanceIngredient(ingredient);
      enhancedIngredients.push(enhanced);
      
      if (enhanced.warnings.length > 0) {
        qualityWarnings.push(...enhanced.warnings);
      }
    }
    
    // Step 3: Calculate overall confidence
    const overallConfidence = enhancedIngredients.length > 0
      ? enhancedIngredients.reduce((sum, ing) => sum + ing.confidence, 0) / enhancedIngredients.length
      : 0;
    
    // Step 4: Detect potential issues
    const detectedIssues = detectIssues(enhancedIngredients);
    qualityWarnings.push(...detectedIssues);
    
    return {
      ...result,
      ingredients: enhancedIngredients,
      overallConfidence,
      qualityWarnings,
      processingTime: Date.now() - startTime,
    };
    
  } catch (error) {
    console.error('Error in improved analysis:', error);
    return {
      success: false,
      ingredients: [],
      overallConfidence: 0,
      qualityWarnings: [error instanceof Error ? error.message : 'Unknown error'],
      processingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Call OpenAI with enhanced prompt
 */
async function analyzeVitaminLabelEnhanced(
  imageUri: string,
  apiKey: string
): Promise<AnalysisResult> {
  try {
    let base64Image: string;
    
    if (imageUri.startsWith('data:')) {
      base64Image = imageUri;
    } else {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      base64Image = await blobToBase64(blob);
    }

    const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: ENHANCED_PROMPT,
              },
              {
                type: 'image_url',
                image_url: {
                  url: base64Image,
                  detail: 'high', // Use high detail for better accuracy
                },
              },
            ],
          },
        ],
        max_tokens: 2000, // Increased for more detailed responses
        temperature: 0.1, // Lower temperature for more consistent results
      }),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await apiResponse.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      ingredients: parsed.ingredients || [],
      productName: parsed.productName,
      servingSize: parsed.servingSize,
      warnings: parsed.warnings,
      rawResponse: content,
    };
  } catch (error) {
    console.error('Error in enhanced analysis:', error);
    return {
      success: false,
      ingredients: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Enhance individual ingredient with validation and confidence
 */
function enhanceIngredient(ingredient: IdentifiedIngredient): ImprovedIngredient {
  let confidence = 100;
  const warnings: string[] = [];
  let normalized = false;
  
  // Normalize name
  const originalName = ingredient.name;
  const normalizedName = normalizeIngredientName(ingredient.name);
  if (normalizedName !== ingredient.name) {
    ingredient.name = normalizedName;
    normalized = true;
  }
  
  // Validate amount
  if (ingredient.amount && ingredient.unit) {
    const amount = parseFloat(ingredient.amount);
    
    if (isNaN(amount)) {
      confidence -= 30;
      warnings.push(`Invalid amount: ${ingredient.amount}`);
    } else {
      // Check if amount is reasonable
      const validation = validateIngredientAmount(ingredient.name, amount, ingredient.unit);
      if (!validation.valid) {
        confidence -= 20;
        if (validation.warning) {
          warnings.push(validation.warning);
        }
      }
      
      // Check for extreme values
      if (amount > 100000) {
        confidence -= 30;
        warnings.push(`Extremely high amount: ${amount}${ingredient.unit}`);
      }
    }
  } else {
    // Missing amount or unit
    if (!ingredient.amount) {
      confidence -= 15;
      warnings.push('Missing amount');
    }
    if (!ingredient.unit) {
      confidence -= 15;
      warnings.push('Missing unit');
    }
  }
  
  // Validate unit
  if (ingredient.unit && !isValidUnit(ingredient.name, ingredient.unit)) {
    confidence -= 25;
    warnings.push(`Unusual unit for ${ingredient.name}: ${ingredient.unit}`);
  }
  
  // Check if ingredient is in knowledge base
  const ingredientInfo = findIngredient(ingredient.name);
  if (!ingredientInfo) {
    confidence -= 10; // Unknown ingredient, slightly less confident
  } else {
    // Add ingredient-specific warnings
    const specificWarnings = getIngredientWarnings(ingredient.name);
    warnings.push(...specificWarnings);
  }
  
  return {
    ...ingredient,
    confidence: Math.max(0, confidence),
    normalized,
    warnings,
  };
}

/**
 * Detect overall issues in the results
 */
function detectIssues(ingredients: ImprovedIngredient[]): string[] {
  const issues: string[] = [];
  
  // Check for duplicates
  const nameCount = new Map<string, number>();
  for (const ing of ingredients) {
    const name = ing.name.toLowerCase();
    nameCount.set(name, (nameCount.get(name) || 0) + 1);
  }
  
  for (const [name, count] of nameCount.entries()) {
    if (count > 1) {
      issues.push(`Duplicate ingredient detected: ${name}`);
    }
  }
  
  // Check for missing essential prenatal nutrients
  const essentialNutrients = [
    'folic acid', 'iron', 'calcium', 'vitamin d'
  ];
  
  const foundNutrients = new Set(ingredients.map(i => i.name.toLowerCase()));
  const missingEssential = essentialNutrients.filter(n => 
    !Array.from(foundNutrients).some(found => found.includes(n))
  );
  
  if (missingEssential.length > 0 && ingredients.length > 3) {
    issues.push(`May be missing essential prenatal nutrients: ${missingEssential.join(', ')}`);
  }
  
  // Check overall confidence
  const avgConfidence = ingredients.reduce((sum, i) => sum + i.confidence, 0) / ingredients.length;
  if (avgConfidence < 70) {
    issues.push('Low overall confidence - results may need manual review');
  }
  
  return issues;
}

/**
 * Helper function
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

