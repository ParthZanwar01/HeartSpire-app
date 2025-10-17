/**
 * Ingredient AI Service
 * Analyzes vitamin label images to identify ingredients using OpenAI Vision API
 */

export interface IdentifiedIngredient {
  name: string;
  amount?: string;
  unit?: string;
  percentDailyValue?: string;
}

export interface AnalysisResult {
  success: boolean;
  ingredients: IdentifiedIngredient[];
  productName?: string;
  servingSize?: string;
  warnings?: string[];
  rawResponse?: string;
  error?: string;
}

/**
 * Analyzes a vitamin label image and extracts ingredient information
 * @param imageUri - Local file URI or base64 encoded image
 * @param apiKey - OpenAI API key
 * @returns Analysis result with identified ingredients
 */
export async function analyzeVitaminLabel(
  imageUri: string,
  apiKey: string
): Promise<AnalysisResult> {
  try {
    // Convert image to base64 if it's a local file URI
    let base64Image: string;
    
    if (imageUri.startsWith('data:')) {
      base64Image = imageUri;
    } else {
      // For local file URIs, we'll need to read and convert
      const response = await fetch(imageUri);
      const blob = await response.blob();
      base64Image = await blobToBase64(blob);
    }

    // Call OpenAI Vision API
    const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this vitamin/supplement label image and extract ALL ingredients with their amounts. 
                
Please provide the information in this exact JSON format:
{
  "productName": "Name of the product",
  "servingSize": "Serving size if visible",
  "ingredients": [
    {
      "name": "Ingredient name",
      "amount": "Amount (just the number)",
      "unit": "Unit (mg, mcg, IU, g, etc.)",
      "percentDailyValue": "% DV if shown"
    }
  ],
  "warnings": ["Any warnings or allergen information"]
}

Be thorough and extract every vitamin, mineral, and active ingredient listed.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: base64Image,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
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

    // Parse the JSON response
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
    console.error('Error analyzing vitamin label:', error);
    return {
      success: false,
      ingredients: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
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

/**
 * Mock function for testing without API calls
 */
export async function mockAnalyzeVitaminLabel(
  imageUri: string
): Promise<AnalysisResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

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
    ],
    warnings: ['Contains iron', 'Keep out of reach of children'],
    rawResponse: 'Mock response',
  };
}

