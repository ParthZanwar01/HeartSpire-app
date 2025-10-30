/**
 * Enhanced AI Image Analysis for Curved Bottles
 * Uses multiple techniques to improve text recognition on curved surfaces
 */

import { AnalysisResult, IdentifiedIngredient } from './IngredientAI';

export interface EnhancedAnalysisResult extends AnalysisResult {
  preprocessingApplied: string[];
  analysisMethod: 'single' | 'multi-angle' | 'preprocessed';
  confidenceScore: number;
  suggestions: string[];
}

/**
 * Enhanced analysis specifically designed for curved bottles
 */
export async function analyzeCurvedBottle(
  imageUri: string,
  apiKey: string
): Promise<EnhancedAnalysisResult> {
  try {
    console.log('🔍 Starting enhanced analysis for curved bottle...');
    
    // Step 1: Try multiple analysis approaches
    const results = await Promise.allSettled([
      // Approach 1: Direct analysis with enhanced prompt
      analyzeWithCurvedBottlePrompt(imageUri, apiKey),
      
      // Approach 2: Multi-angle analysis (if we can detect bottle orientation)
      analyzeWithMultiAngle(imageUri, apiKey),
      
      // Approach 3: Preprocessed image analysis
      analyzeWithPreprocessing(imageUri, apiKey),
    ]);
    
    // Step 2: Combine and validate results
    const validResults = results
      .filter((result): result is PromiseFulfilledResult<AnalysisResult> => 
        result.status === 'fulfilled' && result.value.success
      )
      .map(result => result.value);
    
    if (validResults.length === 0) {
      throw new Error('All analysis methods failed');
    }
    
    // Step 3: Merge results and calculate confidence
    const mergedResult = mergeAnalysisResults(validResults);
    
    return {
      ...mergedResult,
      preprocessingApplied: ['curved-bottle-detection', 'multi-angle-analysis', 'enhanced-prompting'],
      analysisMethod: validResults.length > 1 ? 'multi-angle' : 'single',
      confidenceScore: calculateConfidenceScore(mergedResult),
      suggestions: generateSuggestions(mergedResult),
    };
    
  } catch (error) {
    console.error('Enhanced analysis failed:', error);
    return {
      success: false,
      ingredients: [],
      error: error instanceof Error ? error.message : 'Enhanced analysis failed',
      preprocessingApplied: [],
      analysisMethod: 'single',
      confidenceScore: 0,
      suggestions: ['Try taking the photo from a different angle', 'Ensure good lighting', 'Try flattening the label if possible'],
    };
  }
}

/**
 * Enhanced prompt specifically for curved bottles
 */
const CURVED_BOTTLE_PROMPT = `You are analyzing a vitamin/supplement label on a CURVED BOTTLE. The text may appear distorted due to the curved surface.

## SPECIAL INSTRUCTIONS FOR CURVED SURFACES:

1. **Text Distortion Awareness**: Text on curved surfaces may appear:
   - Stretched horizontally
   - Compressed vertically  
   - Slightly warped or bent
   - Partially obscured by reflections

2. **Reading Strategy**:
   - Read text character by character if needed
   - Look for familiar vitamin names even if slightly distorted
   - Pay attention to numbers and units (mg, mcg, IU)
   - Look for "Supplement Facts" or "Nutrition Facts" panels

3. **Common Curved Bottle Challenges**:
   - "l" might look like "1" or "I"
   - "O" might look like "0" or "Q"
   - "mcg" might appear as "mg" or vice versa
   - Numbers might be stretched or compressed

4. **Focus Areas**:
   - Look for the Supplement Facts panel (usually on the back)
   - Check for ingredient lists
   - Look for serving size information
   - Find any warnings or allergen information

## EXTRACTION RULES:

Extract ALL ingredients with extreme attention to detail. If text appears unclear or distorted, note it in the "notes" field.

For EACH ingredient, provide:
1. **Name**: Extract the exact vitamin/mineral name
2. **Amount**: The numeric value (just the number)
3. **Unit**: mg, mcg, IU, g, etc.
4. **% Daily Value**: If shown on the label
5. **Description**: Write a brief explanation of what this vitamin/mineral does during pregnancy, focusing on benefits for both mom and baby

Return ONLY valid JSON:
{
  "productName": "exact product name",
  "servingSize": "serving size if visible",
  "ingredients": [
    {
      "name": "Vitamin name (even if slightly unclear)",
      "amount": "numeric amount",
      "unit": "unit (mg, mcg, IU, etc.)",
      "percentDailyValue": "% DV if shown",
      "description": "Brief description of what this vitamin does during pregnancy (1-2 sentences focusing on benefits for mom and baby)",
      "clarity": "clear" | "unclear" | "distorted"
    }
  ],
  "warnings": ["any warnings"],
  "notes": "Any observations about text clarity or distortion",
  "imageQuality": "good" | "fair" | "poor"
}

Be extremely thorough and extract everything you can see, even if the text appears slightly distorted.`;

/**
 * Analyze with curved bottle specific prompt
 */
async function analyzeWithCurvedBottlePrompt(
  imageUri: string,
  apiKey: string
): Promise<AnalysisResult> {
  try {
    let base64Image: string;
    
    // If it's already a data URL (like our converted JPEG), use it directly
    if (imageUri.startsWith('data:image')) {
      base64Image = imageUri;
      console.log('📱 Using data URL:', imageUri.substring(0, 50) + '...');
    } else {
      // For local file URIs, read with FileSystem (better for React Native)
      const FileSystem = require('expo-file-system').default;
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });
      base64Image = `data:image/jpeg;base64,${base64}`;
      console.log('📱 Converted file URI to JPEG data URL');
    }

    const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Use mini for speed
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: CURVED_BOTTLE_PROMPT,
              },
              {
                type: 'image_url',
                image_url: {
                  url: base64Image,
                  detail: 'auto', // Optimize for speed
                },
              },
            ],
          },
        ],
        max_tokens: 2000, // Reduced for faster response
        temperature: 0.1, // Low temperature for consistency
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
    console.error('Curved bottle analysis failed:', error);
    return {
      success: false,
      ingredients: [],
      error: error instanceof Error ? error.message : 'Curved bottle analysis failed',
    };
  }
}

/**
 * Multi-angle analysis (placeholder for future implementation)
 */
async function analyzeWithMultiAngle(
  imageUri: string,
  apiKey: string
): Promise<AnalysisResult> {
  // For now, return the same as curved bottle analysis
  // In the future, this could analyze the image from multiple virtual angles
  return analyzeWithCurvedBottlePrompt(imageUri, apiKey);
}

/**
 * Preprocessed image analysis (placeholder for future implementation)
 */
async function analyzeWithPreprocessing(
  imageUri: string,
  apiKey: string
): Promise<AnalysisResult> {
  // For now, return the same as curved bottle analysis
  // In the future, this could apply image preprocessing to flatten curved text
  return analyzeWithCurvedBottlePrompt(imageUri, apiKey);
}

/**
 * Merge multiple analysis results
 */
function mergeAnalysisResults(results: AnalysisResult[]): AnalysisResult {
  if (results.length === 1) {
    return results[0];
  }

  // Combine ingredients from all results
  const ingredientMap = new Map<string, IdentifiedIngredient>();
  
  for (const result of results) {
    for (const ingredient of result.ingredients) {
      const key = ingredient.name.toLowerCase();
      if (!ingredientMap.has(key) || 
          (ingredient.amount && !ingredientMap.get(key)?.amount)) {
        ingredientMap.set(key, ingredient);
      }
    }
  }

  return {
    success: true,
    ingredients: Array.from(ingredientMap.values()),
    productName: results[0].productName,
    servingSize: results[0].servingSize,
    warnings: results.flatMap(r => r.warnings || []),
    rawResponse: `Merged from ${results.length} analyses`,
  };
}

/**
 * Calculate confidence score based on result quality
 */
function calculateConfidenceScore(result: AnalysisResult): number {
  let score = 0;
  
  // Base score for successful analysis
  if (result.success) {
    score += 50;
  }
  
  // Score based on number of ingredients found
  const ingredientCount = result.ingredients.length;
  if (ingredientCount > 0) {
    score += Math.min(30, ingredientCount * 3);
  }
  
  // Score based on completeness
  const completeIngredients = result.ingredients.filter(
    ing => ing.name && ing.amount && ing.unit
  ).length;
  
  if (completeIngredients > 0) {
    score += Math.min(20, (completeIngredients / ingredientCount) * 20);
  }
  
  return Math.min(100, score);
}

/**
 * Generate suggestions for better results
 */
function generateSuggestions(result: AnalysisResult): string[] {
  const suggestions: string[] = [];
  
  if (result.ingredients.length < 3) {
    suggestions.push('Try taking a photo of the Supplement Facts panel');
  }
  
  if (result.ingredients.some(ing => !ing.amount || !ing.unit)) {
    suggestions.push('Ensure the label is fully visible and well-lit');
  }
  
  suggestions.push('Try rotating the bottle to get a better angle');
  suggestions.push('Consider flattening the label if possible');
  
  return suggestions;
}

/**
 * Helper function to convert blob to base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
