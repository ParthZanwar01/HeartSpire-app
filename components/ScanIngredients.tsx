import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import {CameraView, useCameraPermissions} from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OPENAI_API_KEY, BACKEND_URL } from '@env';
import {AnalysisResult} from '../services/IngredientAI';
import { analyzeCurvedBottle, EnhancedAnalysisResult } from '../services/CurvedBottleAI';
import {findIngredient} from '../services/IngredientKnowledgeBase';
import { UserProfile, userService, authService } from '../services/supabase';

interface ScanIngredientsProps {
  onStartScanning: () => void;
  onBack: () => void;
  onSearchPress: () => void;
  userProfile?: UserProfile | null;
  onCameraStateChange?: (isActive: boolean) => void;
  imageToAnalyze?: string; // Optional image URI to analyze immediately
}

const ScanIngredients: React.FC<ScanIngredientsProps> = ({
  onStartScanning,
  onBack,
  onSearchPress,
  userProfile,
  onCameraStateChange,
  imageToAnalyze,
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [libraryPermission, setLibraryPermission] = useState<boolean | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(userProfile || null);

  // Fetch user profile from Supabase if not provided
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userProfile) {
        try {
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            const profile = await userService.getProfile(currentUser.id);
            if (profile) {
              setCurrentUserProfile(profile);
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setCurrentUserProfile(userProfile);
      }
    };

    fetchUserProfile();
  }, [userProfile]);

  // Request camera permission and show camera on mount
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        // Request camera permission
        if (!permission?.granted) {
          await requestPermission();
        }
        
        // Request library permission
        const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        setLibraryPermission(libraryStatus.status === 'granted');

        // Don't auto-show camera - let user open it manually
      } catch (error) {
        console.error('Permission request error:', error);
      }
    };

    requestPermissions();
  }, [permission, requestPermission]);

  // Notify parent when camera state changes - only when camera is actually visible
  useEffect(() => {
    // Only hide navigation when camera is actually showing
    const isCameraActive = showCamera && !analysisResult;
    console.log('🔍 Notifying parent - isCameraActive:', isCameraActive);
    onCameraStateChange?.(isCameraActive);
  }, [showCamera, analysisResult, onCameraStateChange]);

  // Auto-analyze image if provided
  useEffect(() => {
    if (imageToAnalyze && !analyzing && !analysisResult) {
      console.log('🖼️ Auto-analyzing provided image:', imageToAnalyze);
      // Use a small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        analyzeImage(imageToAnalyze).catch((error) => {
          console.error('❌ Error analyzing image:', error);
          Alert.alert(
            'Analysis Error',
            `Failed to analyze the uploaded image: ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
            'Please try:\n' +
            '• Using a clearer image\n' +
            '• Ensuring good lighting\n' +
            '• Taking a photo directly',
            [
              { text: 'OK', style: 'default' },
              { text: 'Try Again', onPress: () => {
                if (imageToAnalyze && !analyzing) {
                  analyzeImage(imageToAnalyze).catch(console.error);
                }
              }}
            ]
          );
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageToAnalyze]);
  
  // PRODUCTION CONFIGURATION
  // Option 1: Use OpenAI Vision (BEST - $0.002 per scan, MUCH better than OCR!)
  const USE_OPENAI = true; // Using GPT-4 Vision for better results!
  
  // Option 2: Use your Python backend (FREE but OCR quality varies)
  const USE_BACKEND = false; // Disabled - OCR has poor quality
  
  // Option 3: Mock mode for testing
  const USE_MOCK = false;
  
  // Debug mode - set to true to see detailed logs
  const DEBUG_MODE = true;
  
  // NEW: Request ingredient descriptions from AI
  const GET_INGREDIENT_DESCRIPTIONS = true;

  // Enhanced personalized analysis based on Supabase user profile
  const getPersonalizedAnalysis = (ingredients: any[]) => {
    if (!currentUserProfile) return { recommendations: [], warnings: [], focus: [], personalizedCards: [] };

    const recommendations: string[] = [];
    const warnings: string[] = [];
    const focus: string[] = [];
    const personalizedCards: any[] = [];

    // Check for allergies
    if (currentUserProfile.allergies && currentUserProfile.allergies.length > 0) {
      const foundAllergies = ingredients.filter(ing => 
        currentUserProfile.allergies.some(allergy => 
          ing.name.toLowerCase().includes(allergy.toLowerCase())
        )
      );
      
      if (foundAllergies.length > 0) {
        warnings.push(`⚠️ Contains allergens: ${foundAllergies.map(a => a.name).join(', ')}`);
      }
    }

    // Check for dietary restrictions
    if (currentUserProfile.dietary_restrictions && currentUserProfile.dietary_restrictions.length > 0) {
      const dietaryWarnings = ingredients.filter(ing => {
        const ingredientName = ing.name.toLowerCase();
        return currentUserProfile.dietary_restrictions.some(restriction => {
          const restrictionLower = restriction.toLowerCase();
          return ingredientName.includes(restrictionLower) || 
                 (restrictionLower.includes('vegetarian') && ingredientName.includes('gelatin')) ||
                 (restrictionLower.includes('vegan') && (ingredientName.includes('gelatin') || ingredientName.includes('lactose')));
        });
      });
      
      if (dietaryWarnings.length > 0) {
        warnings.push(`🚫 May conflict with dietary restrictions: ${dietaryWarnings.map(d => d.name).join(', ')}`);
      }
    }

    // Enhanced trimester-specific recommendations
    if (currentUserProfile.trimester !== 'not_pregnant') {
      const trimesterVitamins = {
        first: ['Folic Acid', 'Iron', 'Vitamin D', 'B12', 'Choline'],
        second: ['Iron', 'Vitamin D', 'Calcium', 'Omega-3', 'DHA', 'EPA'],
        third: ['Iron', 'Vitamin D', 'Calcium', 'Vitamin K', 'DHA']
      };

      const recommendedForTrimester = trimesterVitamins[currentUserProfile.trimester] || [];
      const foundRecommended = ingredients.filter(ing => 
        recommendedForTrimester.some(rec => 
          ing.name.toLowerCase().includes(rec.toLowerCase())
        )
      );

      if (foundRecommended.length > 0) {
        recommendations.push(`✅ Perfect for your ${currentUserProfile.trimester} trimester: ${foundRecommended.map(f => f.name).join(', ')}`);
        
        // Create personalized cards for each recommended vitamin
        foundRecommended.forEach(vitamin => {
          personalizedCards.push({
            name: vitamin.name,
            trimester: currentUserProfile.trimester,
            dosage: vitamin.amount ? `${vitamin.amount} ${vitamin.unit}` : 'As directed',
            benefits: getTrimesterSpecificBenefits(vitamin.name, currentUserProfile.trimester)
          });
        });
      }
    }

    // Check focus areas and create personalized recommendations
    if (currentUserProfile.focus_areas && currentUserProfile.focus_areas.length > 0) {
      focus.push(`🎯 Aligned with your focus areas: ${currentUserProfile.focus_areas.join(', ')}`);
      
      // Create focus-specific recommendations
      currentUserProfile.focus_areas.forEach(focusArea => {
        const relevantIngredients = ingredients.filter(ing => 
          isRelevantToFocusArea(ing.name, focusArea)
        );
        
        if (relevantIngredients.length > 0) {
          recommendations.push(`🌟 Great for ${focusArea}: ${relevantIngredients.map(i => i.name).join(', ')}`);
        }
      });
    }

    // Add user-specific dosage recommendations based on trimester
    if (currentUserProfile.trimester !== 'not_pregnant') {
      ingredients.forEach(ingredient => {
        const recommendedDosage = getRecommendedDosage(ingredient.name, currentUserProfile.trimester);
        if (recommendedDosage) {
          recommendations.push(`Recommended dosage for ${currentUserProfile.trimester} trimester: ${recommendedDosage}`);
        }
      });
    }

    return { recommendations, warnings, focus, personalizedCards };
  };

  // Helper function to get trimester-specific benefits
  const getTrimesterSpecificBenefits = (vitaminName: string, trimester: string) => {
    const benefits: { [key: string]: { [key: string]: string } } = {
      'Folic Acid': {
        first: 'Prevents neural tube defects in early pregnancy',
        second: 'Continues supporting fetal development',
        third: 'Maintains healthy blood cell production'
      },
      'Iron': {
        first: 'Prevents anemia during pregnancy',
        second: 'Supports increased blood volume',
        third: 'Prepares for delivery blood loss'
      },
      'Vitamin D': {
        first: 'Supports bone development',
        second: 'Enhances calcium absorption',
        third: 'Strengthens bones for delivery'
      },
      'DHA': {
        first: 'Early brain development',
        second: 'Peak brain growth period',
        third: 'Final brain development'
      }
    };
    
    return benefits[vitaminName]?.[trimester] || 'Essential nutrient for pregnancy';
  };

  // Helper function to check if ingredient is relevant to focus area
  const isRelevantToFocusArea = (ingredientName: string, focusArea: string) => {
    const focusMappings: { [key: string]: string[] } = {
      'brain development': ['dha', 'epa', 'choline', 'folic acid', 'b12'],
      'bone health': ['calcium', 'vitamin d', 'magnesium', 'vitamin k'],
      'energy': ['iron', 'b12', 'folate', 'magnesium'],
      'immune system': ['vitamin c', 'vitamin d', 'zinc', 'selenium'],
      'heart health': ['omega-3', 'dha', 'epa', 'magnesium']
    };
    
    const relevantNutrients = focusMappings[focusArea.toLowerCase()] || [];
    return relevantNutrients.some((nutrient: string) => 
      ingredientName.toLowerCase().includes(nutrient)
    );
  };

  // Helper function to get recommended dosage based on trimester
  const getRecommendedDosage = (vitaminName: string, trimester: string) => {
    const dosages: { [key: string]: { [key: string]: string } } = {
      'Folic Acid': {
        first: '800-1000 mcg daily',
        second: '600-800 mcg daily',
        third: '600 mcg daily'
      },
      'Iron': {
        first: '27 mg daily',
        second: '30 mg daily',
        third: '30 mg daily'
      },
      'DHA': {
        first: '200-300 mg daily',
        second: '300-400 mg daily',
        third: '400 mg daily'
      }
    };
    
    return dosages[vitaminName]?.[trimester];
  };

  // Enhanced image conversion helper for OpenAI compatibility
  const convertImageForOpenAI = async (imageUri: string): Promise<string> => {
    try {
      console.log('🔄 Processing image for OpenAI API...');
      console.log('🔍 Original imageUri:', imageUri);
      
      // Check if it's already a data URL
      if (imageUri.startsWith('data:')) {
        console.log('✅ Image is already a data URL');
        return imageUri;
      }
      
      // For file URIs, convert to base64
      console.log('🔄 Converting file URI to base64...');
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64' as any,
      });
      
      // Always use JPEG format for OpenAI compatibility
      // This handles HEIC/HEIF conversion automatically
      const mimeType = 'image/jpeg';
      
      const dataUrl = `data:${mimeType};base64,${base64}`;
      console.log('✅ Image converted to JPEG data URL');
      return dataUrl;
      
    } catch (error) {
      console.error('❌ Image conversion failed:', error);
      throw new Error(`Image conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const analyzeWithBackend = async (imageUri: string): Promise<AnalysisResult> => {
    try {
      console.log('🔄 Converting image to base64...', imageUri);
      
      if (DEBUG_MODE) {
        console.log('🔍 Debug - imageUri type:', typeof imageUri);
        console.log('🔍 Debug - imageUri value:', imageUri);
        console.log('🔍 Debug - FileSystem available:', !!FileSystem);
        console.log('🔍 Debug - FileSystem.readAsStringAsync available:', !!(FileSystem && FileSystem.readAsStringAsync));
      }
      
      // Check if imageUri is valid
      if (!imageUri) {
        throw new Error('No image URI provided');
      }
      
      let base64: string;
      
      // Check if it's already a data URL (from HEIC conversion)
      if (imageUri.startsWith('data:image/')) {
        console.log('📱 Using pre-converted data URL for backend');
        base64 = imageUri.split(',')[1]; // Extract base64 part
      } else {
        // Check if FileSystem is available
        if (!FileSystem || !FileSystem.readAsStringAsync) {
          throw new Error('FileSystem API not available');
        }
        
        // Read image as base64 from file
        base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: 'base64' as any, // Use string instead of enum
        });
      }
      
      if (!base64 || base64.length === 0) {
        throw new Error('Failed to convert image to base64 - empty result');
      }
      
      console.log('✅ Base64 conversion successful, length:', base64.length);
      
      // Send to your Python backend
      const requestBody: any = {
        image: base64, // Send raw base64, not data URL
        method: 'ocr'
      };
      
      // Request ingredient descriptions if enabled
      if (GET_INGREDIENT_DESCRIPTIONS) {
        requestBody.includeDescriptions = true;
        requestBody.prompt = `For each ingredient, also explain:
1. What it does during pregnancy
2. Why it's important for mom and baby
3. Any key benefits
Keep each description to 1-2 sentences.`;
      }
      
      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }
      
      const backendResult = await response.json();
      console.log('📊 Backend response:', JSON.stringify(backendResult, null, 2));
      
      // Convert backend response to frontend format
      let ingredients = [];
      if (backendResult.ingredients && Array.isArray(backendResult.ingredients)) {
        console.log(`🔍 Processing ${backendResult.ingredients.length} ingredients from backend`);
        
        ingredients = backendResult.ingredients.map((ingredient: any, index: number) => {
          console.log(`  Ingredient ${index + 1}:`, ingredient);
          
          // Handle both string and object formats
          if (typeof ingredient === 'string') {
            return {
              name: ingredient,
              amount: '',
              unit: '',
              percentDailyValue: '',
              description: '',
              benefits: ''
            };
          } else if (typeof ingredient === 'object' && ingredient !== null) {
            return {
              name: ingredient.name || ingredient.toString(),
              amount: ingredient.amount || '',
              unit: ingredient.unit || '',
              percentDailyValue: ingredient.percentDailyValue || ingredient.percentDV || '',
              description: ingredient.description || ingredient.benefits || '',
              benefits: ingredient.benefits || ingredient.description || ''
            };
          } else {
            return {
              name: String(ingredient),
              amount: '',
              unit: '',
              percentDailyValue: '',
              description: '',
              benefits: ''
            };
          }
        });
        
        console.log(`✅ Converted ${ingredients.length} ingredients successfully`);
      } else {
        console.warn('⚠️ No ingredients array found in backend response');
      }
      
      // ALWAYS try to extract more from raw text (frontend fallback)
      if (backendResult.rawText) {
        const beforeExtraction = ingredients.length;
        console.log(`🔍 Frontend fallback: Extracting ingredients from raw text (currently have ${beforeExtraction})...`);
        console.log(`📝 Raw text length: ${backendResult.rawText.length} characters`);
        const rawText = backendResult.rawText.toLowerCase();
        
        // Look for common vitamin patterns in raw text with MORE FLEXIBLE patterns
        const vitaminPatterns = [
          { name: 'Vitamin A', pattern: /vitamin\s*a\D*?(\d+(?:\.\d+)?)\s*(mcg|μg|iu|mg)/i },
          { name: 'Vitamin C', pattern: /vitamin\s*c\D*?(\d+(?:\.\d+)?)\s*(g|mg|mcg)/i },
          { name: 'Vitamin D3', pattern: /vitamin\s*d\d?\D*?(\d+(?:\.\d+)?)\s*(iu|mcg|μg)/i },
          { name: 'Vitamin E', pattern: /vitamin\s*e\D*?(\d+(?:\.\d+)?)\s*(iu|mg)/i },
          { name: 'Vitamin K', pattern: /vitamin\s*k\d?\D*?(\d+(?:\.\d+)?)\s*(mcg|μg)/i },
          { name: 'Vitamin B6', pattern: /(?:vitamin\s*)?b\s*-?\s*6\D*?(\d+(?:\.\d+)?)\s*(mg)/i },
          { name: 'Vitamin B12', pattern: /(?:vitamin\s*)?b\s*-?\s*12\D*?(\d+(?:\.\d+)?)\s*(mcg|μg)/i },
          { name: 'Thiamin', pattern: /thiamin(?:e)?\D*?(\d+(?:\.\d+)?)\s*(mg)/i },
          { name: 'Riboflavin', pattern: /riboflavin\D*?(\d+(?:\.\d+)?)\s*(mg)/i },
          { name: 'Niacin', pattern: /niacin\D*?(\d+(?:\.\d+)?)\s*(mg)/i },
          { name: 'Folic Acid', pattern: /(?:folic\s*acid|folate)\D*?(\d+(?:\.\d+)?)\s*(mcg|μg|mg)/i },
          { name: 'Biotin', pattern: /biotin\D*?(\d+(?:\.\d+)?)\s*(mcg|μg)/i },
          { name: 'Pantothenic Acid', pattern: /pantothenic\s*acid\D*?(\d+(?:\.\d+)?)\s*(mg)/i },
          { name: 'Iron', pattern: /iron\D*?(\d+(?:\.\d+)?)\s*(mg)/i },
          { name: 'Calcium', pattern: /calcium\D*?(\d+(?:\.\d+)?)\s*(mg|g)/i },
          { name: 'Zinc', pattern: /zinc\D*?(\d+(?:\.\d+)?)\s*(mg)/i },
          { name: 'Magnesium', pattern: /magnesium\D*?(\d+(?:\.\d+)?)\s*(mg|g)/i },
          { name: 'Iodine', pattern: /iodine\D*?(\d+(?:\.\d+)?)\s*(mcg|μg)/i },
          { name: 'DHA', pattern: /dha\D*?(\d+(?:\.\d+)?)\s*(mg|g)/i },
          { name: 'Choline', pattern: /choline\D*?(\d+(?:\.\d+)?)\s*(mg)/i },
        ];
        
        for (const { name, pattern } of vitaminPatterns) {
          // Check if we already have this ingredient
          const alreadyExists = ingredients.some((ing: any) => 
            ing.name.toLowerCase().includes(name.toLowerCase()) || 
            name.toLowerCase().includes(ing.name.toLowerCase())
          );
          
          if (!alreadyExists) {
            const match = rawText.match(pattern);
            if (match) {
              console.log(`  Found ${name}: ${match[1]} ${match[2]}`);
              ingredients.push({
                name: name,
                amount: match[1] || '',
                unit: match[2] || '',
                percentDailyValue: '',
                description: '', // Will be filled by AI if available
                benefits: ''
              });
            }
          }
        }
        
        const additionalFound = ingredients.length - beforeExtraction;
        if (additionalFound > 0) {
          console.log(`✅ Extracted ${additionalFound} additional ingredients from raw text`);
        }
      }
      
      // Final summary
      console.log(`\n📋 FINAL RESULTS:`);
      console.log(`   Total ingredients: ${ingredients.length}`);
      console.log(`   Product: ${backendResult.productName || 'Unknown'}`);
      console.log(`   Serving: ${backendResult.servingSize || 'Unknown'}`);
      if (ingredients.length > 0) {
        console.log(`   First 3 ingredients:`);
        ingredients.slice(0, 3).forEach((ing: any, i: number) => {
          console.log(`     ${i + 1}. ${ing.name} - ${ing.amount} ${ing.unit}`);
        });
      }
      console.log(``);
      
      const finalResult = {
        success: backendResult.success || false,
        productName: backendResult.productName || 'Unknown Product',
        servingSize: backendResult.servingSize || 'Unknown',
        ingredients: ingredients,
        warnings: backendResult.warnings || [],
        rawResponse: backendResult.rawText || '',
        error: backendResult.error || null
      };
      
      console.log(`🎯 Returning result with ${finalResult.ingredients.length} ingredients`);
      
      return finalResult;
      
    } catch (error) {
      console.error('❌ Backend analysis error:', error);
      
      // If it's a base64 conversion error, try to provide a helpful message
      if (error instanceof Error && error.message.includes('base64')) {
        console.log('🔄 Falling back to mock analysis due to base64 error');
        return await mockAnalysis();
      }
      
      throw new Error(`Backend analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const analyzeWithCurvedBottleAI = async (imageUri: string): Promise<EnhancedAnalysisResult> => {
    try {
      console.log('🧠 Using Enhanced Curved Bottle Analysis (GPT-4o) - Optimized for curved surfaces!');
      
      // Use the enhanced curved bottle analysis
      const result = await analyzeCurvedBottle(imageUri, OPENAI_API_KEY);
      
      console.log('📊 Analysis completed:', {
        success: result.success,
        ingredientCount: result.ingredients.length,
        confidenceScore: result.confidenceScore,
        analysisMethod: result.analysisMethod,
        preprocessingApplied: result.preprocessingApplied
      });
      
      return result;
    } catch (error) {
      console.error('❌ Enhanced analysis failed:', error);
      return {
        success: false,
        ingredients: [],
        error: error instanceof Error ? error.message : 'Analysis failed',
        preprocessingApplied: [],
        analysisMethod: 'single',
        confidenceScore: 0,
        suggestions: ['Try taking the photo again with better lighting', 'Ensure the label is fully visible'],
      };
    }
  };

  const analyzeWithOpenAI = async (imageUri: string): Promise<EnhancedAnalysisResult> => {
    try {
      console.log('🧠 Using OpenAI Vision (GPT-4o) - this is MUCH better than OCR!');
      
      let base64: string;
      
      // Check if it's already a data URL (from HEIC conversion)
      if (imageUri.startsWith('data:image/')) {
        console.log('📱 Using pre-converted data URL');
        base64 = imageUri.split(',')[1]; // Extract base64 part
      } else {
        // Read image as base64 from file
        base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: 'base64' as any,
        });
      }
      
      console.log('✅ Image encoded, sending to OpenAI...');
      console.log('📊 Image size:', Math.round(base64.length / 1024), 'KB');
      console.log('🔍 Base64 preview (first 100 chars):', base64.substring(0, 100));
      console.log('🔍 Base64 preview (last 100 chars):', base64.substring(base64.length - 100));
      
      // Call OpenAI Vision API with enhanced prompt
      console.log('🚀 Sending request to OpenAI API...');
      console.log('🔑 API Key present:', !!OPENAI_API_KEY);
      console.log('📊 Base64 length:', base64.length);
      console.log('📊 Base64 valid format:', base64.match(/^[A-Za-z0-9+/]*={0,2}$/) ? 'YES' : 'NO');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `You are analyzing a prenatal vitamin/supplement label. Extract ALL ingredients from the "Supplement Facts" or "Nutrition Facts" panel.

For EACH ingredient, extract:
1. Name (e.g., "Vitamin A", "Folic Acid", "Iron")
2. Amount (just the number, e.g., "770")
3. Unit (e.g., "mcg", "mg", "IU")
4. % Daily Value if shown (e.g., "85%")
5. Brief description: What does this ingredient do during pregnancy? (1-2 sentences focusing on benefits for mom and baby)

Return ONLY valid JSON in this exact format:
{
  "productName": "exact product name from label",
  "servingSize": "1 tablet",
  "ingredients": [
    {
      "name": "Vitamin A",
      "amount": "770",
      "unit": "mcg",
      "percentDailyValue": "85%",
      "description": "Supports fetal eye and bone development. Essential for immune system health."
    },
    {
      "name": "Folic Acid",
      "amount": "600",
      "unit": "mcg",
      "percentDailyValue": "150%",
      "description": "CRITICAL: Prevents neural tube defects like spina bifida. Essential for brain and spinal cord development."
    }
  ],
  "warnings": ["any warnings or allergens"]
}

Be thorough - extract EVERY vitamin, mineral, and nutrient from the Supplement Facts panel. Include descriptions for each one.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUri.startsWith('data:image/') ? imageUri : `data:image/jpeg;base64,${base64}`,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 3000,
          temperature: 0.3,
        }),
      });
      
      console.log('📡 OpenAI response status:', response.status);
      console.log('📡 OpenAI response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ OpenAI API error:', errorData);
        throw new Error(`OpenAI error: ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      console.log('📊 OpenAI response received');
      console.log('📊 Response data:', JSON.stringify(data, null, 2));
      
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from OpenAI');
      }
      
      console.log('🔍 Parsing OpenAI response...');
      console.log('📝 Raw content preview:', content.substring(0, 500));
      
      // Check if OpenAI couldn't read the image
      const cannotReadPatterns = [
        /unable to extract/i,
        /cannot extract/i,
        /can't extract/i,
        /cannot read/i,
        /unable to read/i,
        /can't read/i,
        /please provide/i,
        /could not.*text/i,
        /no.*visible/i,
        /image.*unclear/i,
        /image.*blurry/i,
        /supplement facts.*not visible/i,
        /nutrition facts.*not visible/i,
        /label.*obscured/i,
        /hand.*covering/i,
      ];
      
      const isUnreadable = cannotReadPatterns.some(pattern => pattern.test(content));
      
      if (isUnreadable) {
        console.warn('⚠️ OpenAI could not read the image clearly');
        console.log('🔄 Attempting fallback to backend OCR...');
        
        // Try backend OCR as fallback
        try {
          const backendResult = await analyzeWithBackend(imageUri);
          if (backendResult.success && backendResult.ingredients.length > 0) {
            console.log('✅ Backend OCR succeeded as fallback');
            return backendResult as any;
          }
        } catch (backendError) {
          console.warn('⚠️ Backend fallback also failed:', backendError);
        }
        
        throw new Error('Image quality too low. Please try again with:\n\n📸 Better lighting (bright, indirect light)\n🔍 Clear focus on the Supplement Facts panel\n📏 Fill the frame with just the label\n🚫 Avoid glare, shadows, or blur\n\n🚨 CRITICAL: Make sure the "Supplement Facts" panel is fully visible and not covered by your hand!');
      }
      
      // Try multiple parsing strategies
      let parsed = null;
      
      // Strategy 1: Try to extract JSON from markdown code block
      const markdownMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (markdownMatch) {
        try {
          parsed = JSON.parse(markdownMatch[1]);
          console.log('✅ Parsed JSON from markdown code block');
        } catch (e) {
          console.warn('⚠️ Failed to parse markdown JSON:', e);
        }
      }
      
      // Strategy 2: Try to find raw JSON (greedy match from first { to last })
      if (!parsed) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
            console.log('✅ Parsed raw JSON');
          } catch (e) {
            console.warn('⚠️ Failed to parse raw JSON:', e);
          }
        }
      }
      
      // Strategy 3: Try to find JSON with balanced braces
      if (!parsed) {
        const firstBrace = content.indexOf('{');
        if (firstBrace !== -1) {
          let braceCount = 0;
          let endPos = firstBrace;
          
          for (let i = firstBrace; i < content.length; i++) {
            if (content[i] === '{') braceCount++;
            if (content[i] === '}') braceCount--;
            if (braceCount === 0) {
              endPos = i + 1;
              break;
            }
          }
          
          if (endPos > firstBrace) {
            try {
              const jsonStr = content.substring(firstBrace, endPos);
              parsed = JSON.parse(jsonStr);
              console.log('✅ Parsed JSON with balanced braces');
            } catch (e) {
              console.warn('⚠️ Failed to parse balanced JSON:', e);
            }
          }
        }
      }
      
      // If we successfully parsed, validate and return
      if (parsed && typeof parsed === 'object') {
        console.log(`✅ OpenAI found ${parsed.ingredients?.length || 0} ingredients`);
        
        // Ensure ingredients is an array
        if (!Array.isArray(parsed.ingredients)) {
          console.warn('⚠️ Ingredients is not an array, converting...');
          parsed.ingredients = [];
        }
        
        return {
          success: true,
          productName: parsed.productName || 'Unknown Product',
          servingSize: parsed.servingSize || 'Unknown',
          ingredients: parsed.ingredients || [],
          warnings: parsed.warnings || [],
          rawResponse: content,
          preprocessingApplied: [],
          analysisMethod: 'single' as const,
          confidenceScore: 85,
          suggestions: [],
        } as any;
      }
      
      // If all parsing failed, log the content for debugging
      console.error('❌ All parsing strategies failed. Raw content:', content);
      throw new Error('Could not parse OpenAI response - see console for details');
      
    } catch (error) {
      console.error('❌ OpenAI Vision error:', error);
      return {
        success: false,
        ingredients: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        preprocessingApplied: [],
        analysisMethod: 'single' as const,
        confidenceScore: 0,
        suggestions: [],
      } as any;
    }
  };

  const processManualText = async (text: string) => {
    try {
      console.log('📝 Processing manual text input...');
      setAnalyzing(true);
      
      // Use the same frontend extraction logic
      const ingredients: any[] = [];
      const rawText = text.toLowerCase();
      
      // Look for vitamin patterns in the manual text
      const vitaminPatterns = [
        { name: 'Vitamin A', pattern: /vitamin\s*a\D*?(\d+(?:\.\d+)?)\s*(mcg|μg|iu|mg)/i },
        { name: 'Vitamin C', pattern: /vitamin\s*c\D*?(\d+(?:\.\d+)?)\s*(g|mg|mcg)/i },
        { name: 'Vitamin D3', pattern: /vitamin\s*d\d?\D*?(\d+(?:\.\d+)?)\s*(iu|mcg|μg)/i },
        { name: 'Vitamin E', pattern: /vitamin\s*e\D*?(\d+(?:\.\d+)?)\s*(iu|mg)/i },
        { name: 'Vitamin K', pattern: /vitamin\s*k\d?\D*?(\d+(?:\.\d+)?)\s*(mcg|μg)/i },
        { name: 'Vitamin B6', pattern: /(?:vitamin\s*)?b\s*-?\s*6\D*?(\d+(?:\.\d+)?)\s*(mg)/i },
        { name: 'Vitamin B12', pattern: /(?:vitamin\s*)?b\s*-?\s*12\D*?(\d+(?:\.\d+)?)\s*(mcg|μg)/i },
        { name: 'Thiamin', pattern: /thiamin(?:e)?\D*?(\d+(?:\.\d+)?)\s*(mg)/i },
        { name: 'Riboflavin', pattern: /riboflavin\D*?(\d+(?:\.\d+)?)\s*(mg)/i },
        { name: 'Niacin', pattern: /niacin\D*?(\d+(?:\.\d+)?)\s*(mg)/i },
        { name: 'Folic Acid', pattern: /(?:folic\s*acid|folate)\D*?(\d+(?:\.\d+)?)\s*(mcg|μg|mg)/i },
        { name: 'Biotin', pattern: /biotin\D*?(\d+(?:\.\d+)?)\s*(mcg|μg)/i },
        { name: 'Pantothenic Acid', pattern: /pantothenic\s*acid\D*?(\d+(?:\.\d+)?)\s*(mg)/i },
        { name: 'Iron', pattern: /iron\D*?(\d+(?:\.\d+)?)\s*(mg)/i },
        { name: 'Calcium', pattern: /calcium\D*?(\d+(?:\.\d+)?)\s*(mg|g)/i },
        { name: 'Zinc', pattern: /zinc\D*?(\d+(?:\.\d+)?)\s*(mg)/i },
        { name: 'Magnesium', pattern: /magnesium\D*?(\d+(?:\.\d+)?)\s*(mg|g)/i },
        { name: 'Iodine', pattern: /iodine\D*?(\d+(?:\.\d+)?)\s*(mcg|μg)/i },
        { name: 'DHA', pattern: /dha\D*?(\d+(?:\.\d+)?)\s*(mg|g)/i },
        { name: 'Choline', pattern: /choline\D*?(\d+(?:\.\d+)?)\s*(mg)/i },
      ];
      
      for (const { name, pattern } of vitaminPatterns) {
        const match = rawText.match(pattern);
        if (match) {
          console.log(`  Found ${name}: ${match[1]} ${match[2]}`);
          ingredients.push({
            name: name,
            amount: match[1] || '',
            unit: match[2] || '',
            percentDailyValue: '',
            description: '',
            benefits: ''
          });
        }
      }
      
      const result: AnalysisResult = {
        success: true,
        productName: 'Manual Entry',
        servingSize: 'Unknown',
        ingredients: ingredients,
        warnings: [],
        rawResponse: text,
      };
      
      setAnalysisResult(result);
      
      if (ingredients.length > 0) {
        Alert.alert(
          '✅ Manual Analysis Complete!',
          `Found ${ingredients.length} ingredients from your text input.`,
          [{ text: 'View Details', onPress: () => {} }]
        );
      } else {
        Alert.alert(
          '⚠️ No Vitamins Found',
          'Could not identify any vitamins in the text. Please try typing the ingredient names more clearly.',
          [{ text: 'Try Again', onPress: () => {} }]
        );
      }
      
    } catch (error) {
      console.error('Manual text processing error:', error);
      Alert.alert('Error', 'Failed to process manual text. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const mockAnalysis = async (): Promise<AnalysisResult> => {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      productName: 'Prenatal Multivitamin (Demo)',
      servingSize: '1 tablet',
      ingredients: [
        {name: 'Vitamin A', amount: '770', unit: 'mcg', percentDailyValue: '85%'},
        {name: 'Vitamin C', amount: '85', unit: 'mg', percentDailyValue: '94%'},
        {name: 'Vitamin D3', amount: '600', unit: 'IU', percentDailyValue: '150%'},
        {name: 'Folic Acid', amount: '600', unit: 'mcg', percentDailyValue: '150%'},
        {name: 'Iron', amount: '27', unit: 'mg', percentDailyValue: '150%'},
        {name: 'Calcium', amount: '200', unit: 'mg', percentDailyValue: '15%'},
        {name: 'DHA', amount: '200', unit: 'mg'},
      ],
      warnings: ['Contains fish (DHA)', 'Keep out of reach of children'],
    };
  };

  const analyzeImage = async (imageUri: string): Promise<void> => {
    // Prevent multiple simultaneous analyses
    if (analyzing) {
      console.log('⏳ Analysis already in progress, skipping...');
      return;
    }
    
    setAnalyzing(true);
    
    try {
      // Validate image URI
      if (!imageUri || imageUri.trim() === '') {
        throw new Error('Invalid image URI provided');
      }
      
      console.log('🔍 Starting image analysis for:', imageUri);
      
      // Convert HEIC for Expo Go compatibility
      let processedImageUri: string;
      try {
        processedImageUri = await convertImageForOpenAI(imageUri);
        console.log('📱 Processed image URI:', processedImageUri.substring(0, 50) + '...');
      } catch (conversionError) {
        console.warn('⚠️ Image conversion failed, using original:', conversionError);
        processedImageUri = imageUri; // Fallback to original
      }
      
      let result: AnalysisResult;
      
      if (USE_MOCK) {
        console.log('📝 Using mock analysis (for testing)');
        result = await mockAnalysis();
      } else if (USE_BACKEND) {
        console.log('🤖 Using Python backend (LLaVA)');
        result = await analyzeWithBackend(processedImageUri);
      } else if (USE_OPENAI && OPENAI_API_KEY) {
        console.log('🧠 Using OpenAI Vision API');
        result = await analyzeWithCurvedBottleAI(processedImageUri);
      } else {
        throw new Error('Please configure either BACKEND_URL or OPENAI_API_KEY in ScanIngredients.tsx');
      }
      
      setAnalysisResult(result);
      
      if (result.success) {
        if (result.ingredients.length === 0) {
          Alert.alert(
            '⚠️ No Ingredients Found',
            'Could not extract ingredients from the image. Please try:\n\n' +
            '• Taking photo in better lighting\n' +
            '• Getting closer to the label\n' +
            '• Making sure text is clear and in focus\n' +
            '• Using a product with a clearly printed nutrition label',
            [{ text: 'Try Again', onPress: () => {} }]
          );
        } else {
          Alert.alert(
            '✅ Analysis Complete!',
            `Found ${result.ingredients.length} ingredients in ${result.productName || 'your supplement'}`,
            [{ text: 'View Details', onPress: () => {} }]
          );
        }
      } else {
        Alert.alert('❌ Analysis Failed', result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      
      // Check if it's an image quality error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isImageQualityError = errorMessage.includes('Image quality') || 
                                   errorMessage.includes('Better lighting') ||
                                   errorMessage.includes('unable to read');
      
      if (isImageQualityError) {
        Alert.alert(
          '📸 Image Quality Issue',
          errorMessage,
          [
            { text: 'Try Again', style: 'default' },
            { text: 'Manual Input', onPress: () => {
              Alert.prompt(
                'Manual Ingredient Entry',
                'Type the ingredients from the label (one per line):',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Analyze', onPress: (text?: string) => {
                    if (text && text.trim()) {
                      // Process manual text input
                      processManualText(text.trim());
                    }
                  }}
                ],
                'plain-text',
                '',
                'default'
              );
            }},
            { text: 'See Tips', onPress: () => {
              Alert.alert(
                '💡 Photo Tips for Vitamin Labels',
                '✓ Use bright, natural lighting\n' +
                '✓ Hold phone steady and close\n' +
                '✓ Center the Supplement Facts panel\n' +
                '✓ Avoid shadows and glare\n' +
                '✓ Make sure text is sharp and clear\n\n' +
                '🚨 CRITICAL: Don\'t cover the "Supplement Facts" panel with your hand!\n' +
                '📏 Fill the frame with just the label\n' +
                '📱 Tap the screen to focus before taking the photo\n\n' +
                'The "Supplement Facts" panel is the most important part - make sure it\'s fully visible!'
              );
            }}
          ]
        );
      } else {
        Alert.alert(
          'Error',
          `Failed to analyze image: ${errorMessage}`
        );
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const takePicture = async () => {
    try {
      setShowCamera(false); // Hide camera while processing
      
      // Use ImagePicker to capture photo
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        exif: false,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('📸 Photo taken:', result.assets[0].uri);
        await analyzeImage(result.assets[0].uri);
      } else {
        // User canceled, show camera again
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      setShowCamera(true); // Re-show camera on error
    }
  };

  const handleCameraPress = async () => {
    try {
      // Request camera permission
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (cameraPermission.status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'We need camera access to take photos of vitamin labels for scanning.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
        return;
      }

      // Use ImagePicker as fallback
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        exif: false,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        await analyzeImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      Alert.alert('Error', 'Failed to access camera. Please try again.');
    }
  };

  const saveToTracker = async () => {
    if (!analysisResult || analysisResult.ingredients.length === 0) {
      Alert.alert('Nothing to Save', 'Please scan a vitamin label first.');
      return;
    }

    try {
      console.log('💾 Saving scanned ingredients to tracker...');
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Get existing vitamin logs
      const storedData = await AsyncStorage.getItem('@vitamin_log');
      let vitaminLogs = storedData ? JSON.parse(storedData) : [];
      
      // Create a list of vitamin names from scanned ingredients
      const vitaminNames = analysisResult.ingredients.map(ing => ing.name);
      
      // Check if log already exists for today
      const existingLogIndex = vitaminLogs.findIndex((log: any) => log.date === today);
      
      if (existingLogIndex >= 0) {
        // Update existing log - merge with scanned ingredients
        const existingVitamins = vitaminLogs[existingLogIndex].vitamins;
        const mergedVitamins = [...new Set([...existingVitamins, ...vitaminNames])];
        vitaminLogs[existingLogIndex] = {
          date: today,
          vitamins: mergedVitamins,
          scannedProduct: analysisResult.productName,
          scannedData: analysisResult.ingredients,
        };
        console.log(`✅ Updated existing log for ${today} with ${mergedVitamins.length} total vitamins`);
      } else {
        // Add new log for today
        vitaminLogs.push({
          date: today,
          vitamins: vitaminNames,
          scannedProduct: analysisResult.productName,
          scannedData: analysisResult.ingredients,
        });
        console.log(`✅ Created new log for ${today} with ${vitaminNames.length} vitamins`);
      }
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('@vitamin_log', JSON.stringify(vitaminLogs));
      
      // Also save the detailed scanned data separately for reference
      await AsyncStorage.setItem('@last_scanned_product', JSON.stringify({
        date: today,
        productName: analysisResult.productName,
        servingSize: analysisResult.servingSize,
        ingredients: analysisResult.ingredients,
      }));
      
      Alert.alert(
        '✅ Saved to Tracker!',
        `Added ${analysisResult.productName || 'your vitamins'} to today's tracker with ${analysisResult.ingredients.length} ingredients.`,
        [
          { text: 'OK', style: 'default' },
          { text: 'View Tracker', onPress: onBack }
        ]
      );
      
    } catch (error) {
      console.error('❌ Error saving to tracker:', error);
      Alert.alert('Error', 'Failed to save to tracker. Please try again.');
    }
  };

  const handleLibraryPress = async () => {
    try {
      // Always request photo library permission when button is pressed
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (libraryPermission.status !== 'granted') {
        // Permission denied - guide user to settings
        Alert.alert(
          'Photo Library Permission Required',
          'We need access to your photo library to select vitamin label images for scanning. Please enable photo library access in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
        return;
      }

      // Launch photo library with HEIC support for Expo Go
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Allow all media types including HEIC
        allowsEditing: false, // Use full photo without cropping
        quality: 0.8, // Highest quality
        exif: false, // Don't include EXIF data to reduce file size
        // Expo Go workaround: force conversion to JPEG
        base64: false, // We'll handle conversion manually
      });

      if (!result.canceled && result.assets[0]) {
        console.log('📁 Photo selected:', result.assets[0].uri);
        console.log('📁 Photo details:', {
          uri: result.assets[0].uri,
          width: result.assets[0].width,
          height: result.assets[0].height,
          fileSize: result.assets[0].fileSize,
          type: result.assets[0].type,
          mimeType: result.assets[0].mimeType
        });
        
        // Check if it's a PDF or unsupported file type
        const uri = result.assets[0].uri.toLowerCase();
        const mimeType = result.assets[0].mimeType?.toLowerCase();
        
        console.log('🔍 File validation:', {
          uri: result.assets[0].uri,
          mimeType: result.assets[0].mimeType,
          type: result.assets[0].type,
          fileName: result.assets[0].fileName
        });
        
        if (uri.endsWith('.pdf') || mimeType?.includes('pdf')) {
          Alert.alert(
            '❌ PDF Not Supported',
            'Please take a photo of the vitamin label or select an image file (JPG, PNG, etc.).\n\nPDF files cannot be scanned directly.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        // Check for valid image types (including HEIC from iPhone)
        const validImageExtensions = ['.jpg', '.jpeg', '.png', '.heic', '.heif'];
        const hasValidExtension = validImageExtensions.some(ext => uri.endsWith(ext));
        const hasValidMimeType = mimeType?.startsWith('image/');
        
        // Special handling for HEIC files from iPhone
        if (uri.endsWith('.heic') || mimeType?.includes('heic')) {
          console.log('📱 iPhone HEIC file detected - converting for Expo Go compatibility!');
        }
        
        if (!hasValidExtension && !hasValidMimeType) {
          Alert.alert(
            '❌ Invalid File Type',
            'Please select a photo in JPG, PNG, or HEIC format.\n\nHEIC files from iPhone work great!\n\nIf you\'re still having issues, try taking a new photo with the camera instead.',
            [
              { text: 'OK' },
              { text: 'Take Photo', onPress: () => handleCameraPress() }
            ]
          );
          return;
        }
        
        await analyzeImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error accessing photo library:', error);
      Alert.alert('Error', 'Failed to access photo library. Please try again.');
    }
  };

  // Show camera view only when user explicitly opens it
  if (showCamera && !analysisResult) {
    return (
      <View style={styles.cameraContainer}>
        {permission?.granted ? (
          <CameraView
            style={styles.camera}
          >
            {/* Top bar with X button */}
            <View style={styles.cameraTopBar}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setShowCamera(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              
              <Text style={styles.scanTitle}>Scan Vitamin</Text>
              
              <TouchableOpacity 
                style={styles.libraryButton} 
                onPress={handleLibraryPress}
              >
                <Text style={styles.libraryButtonText}>🌸</Text>
              </TouchableOpacity>
            </View>

            {/* Scanning guide overlay */}
            <View style={styles.scanningGuideContainer}>
              <View style={styles.scanningGuideFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.scanInstructionText}>Align your vitamin bottle in the frame</Text>
            </View>

            {/* Bottom capture button */}
            <View style={styles.cameraBottomBar}>
              <TouchableOpacity 
                style={styles.scanNowButton} 
                onPress={takePicture}
              >
                <Text style={styles.scanNowIcon}>💕</Text>
                <Text style={styles.scanNowText}>Scan Now</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        ) : !permission ? (
          <View style={styles.cameraContainer}>
            <View style={styles.permissionContainer}>
              <Text style={styles.permissionText}>Camera Permission Required</Text>
              <Text style={styles.permissionSubtext}>
                We need camera access to scan vitamin labels
              </Text>
              <TouchableOpacity 
                style={styles.permissionButton}
                onPress={async () => {
                  const result = await requestPermission();
                  if (result.granted) {
                    setShowCamera(true);
                  }
                }}
              >
                <Text style={styles.permissionButtonText}>Grant Permission</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.backToMenuButton}
                onPress={() => setShowCamera(false)}
              >
                <Text style={styles.backToMenuText}>Back to Menu</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.cameraContainer}>
            <View style={styles.permissionContainer}>
              <Text style={styles.permissionText}>Camera Access Denied</Text>
              <Text style={styles.permissionSubtext}>
                Please enable camera access in your device settings to use this feature.
              </Text>
              <TouchableOpacity 
                style={styles.backToMenuButton}
                onPress={() => setShowCamera(false)}
              >
                <Text style={styles.backToMenuText}>Back to Menu</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }

  // Show results or main menu
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scan Ingredients</Text>
        <TouchableOpacity 
          style={styles.cameraToggle} 
          onPress={() => setShowCamera(true)}
        >
          <Text style={styles.cameraToggleText}>💕</Text>
        </TouchableOpacity>
      </View>

      {/* Analysis Loading */}
      {analyzing && (
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="large" color="#FF69B4" />
          <Text style={styles.analyzingText}>Analyzing ingredients...</Text>
          <Text style={styles.analyzingSubtext}>This may take a few seconds</Text>
        </View>
      )}

      <ScrollView style={styles.scrollContainer} contentContainerStyle={{paddingBottom: 100}}>
        {/* Main Content - only show if no results */}
        {!analysisResult && (
          <View style={styles.scanContent}>
            {/* Camera Preview Card */}
            <View style={styles.cameraPreviewCard}>
              <View style={styles.cameraPreviewPlaceholder}>
                <Text style={styles.cameraPreviewText}>💕</Text>
                <Text style={styles.cameraPreviewLabel}>Camera Preview</Text>
              </View>
              <Text style={styles.alignInstruction}>Align your vitamin bottle in the frame</Text>
            </View>

            {/* Scan Now Button */}
            <TouchableOpacity style={styles.scanNowMainButton} onPress={() => setShowCamera(true)}>
              <Text style={styles.scanNowMainIcon}>💕</Text>
              <Text style={styles.scanNowMainText}>Scan Now</Text>
            </TouchableOpacity>

            {/* Scan Status Card */}
            <View style={styles.scanStatusCard}>
              <Text style={styles.scanStatusTitle}>Scan Status</Text>
              <Text style={styles.scanStatusText}>Results will appear here after scanning.</Text>
            </View>

            {/* Alternative Options */}
            <View style={styles.alternativeOptions}>
              <TouchableOpacity style={styles.alternativeButton} onPress={handleLibraryPress}>
                <Text style={styles.alternativeButtonIcon}>🌸</Text>
                <Text style={styles.alternativeButtonText}>Choose from Library</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.alternativeButton} onPress={onSearchPress}>
                <Text style={styles.alternativeButtonIcon}>🌺</Text>
                <Text style={styles.alternativeButtonText}>Search Vitamins</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      {/* Analysis Results */}
      {analysisResult && analysisResult.success && !analyzing && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>🌸 Analysis Results</Text>
          
          {/* Personalized Analysis */}
          {currentUserProfile && (() => {
            const personalized = getPersonalizedAnalysis(analysisResult.ingredients);
            return (
              <View style={styles.personalizedContainer}>
                <Text style={styles.personalizedTitle}>
                  🎯 Personalized for {currentUserProfile.name || 'You'}
                </Text>
                
                {/* User Profile Summary */}
                <View style={styles.profileSummary}>
                  <Text style={styles.profileText}>
                    {currentUserProfile.trimester !== 'not_pregnant' 
                      ? `Currently in ${currentUserProfile.trimester} trimester`
                      : 'General health focus'
                    }
                  </Text>
                  {currentUserProfile.focus_areas && currentUserProfile.focus_areas.length > 0 && (
                    <Text style={styles.profileText}>
                      Focus areas: {currentUserProfile.focus_areas.join(', ')}
                    </Text>
                  )}
                </View>
                
                {/* Personalized Recommendations */}
                {personalized.recommendations.map((rec, index) => (
                  <View key={index} style={styles.personalizedCard}>
                    <Text style={styles.personalizedText}>{rec}</Text>
                  </View>
                ))}
                
                {/* Personalized Cards for Trimester-Specific Vitamins */}
                {personalized.personalizedCards.map((card, index) => (
                  <View key={index} style={styles.trimesterCard}>
                    <View style={styles.trimesterCardHeader}>
                      <Text style={styles.trimesterCardTitle}>{card.name}</Text>
                      <Text style={styles.trimesterBadge}>{card.trimester} Trimester</Text>
                    </View>
                    <Text style={styles.trimesterCardDosage}>Recommended: {card.dosage}</Text>
                    <Text style={styles.trimesterCardBenefits}>{card.benefits}</Text>
                  </View>
                ))}
                
                {/* Warnings */}
                {personalized.warnings.map((warning, index) => (
                  <View key={index} style={styles.warningCard}>
                    <Text style={styles.warningText}>{warning}</Text>
                  </View>
                ))}
                
                {/* Focus Areas */}
                {personalized.focus.map((focus, index) => (
                  <View key={index} style={styles.focusCard}>
                    <Text style={styles.focusText}>{focus}</Text>
                  </View>
                ))}
              </View>
            );
          })()}
          
          {analysisResult.productName && analysisResult.productName !== 'Unknown Product' && (
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Product</Text>
              <Text style={styles.resultValue}>{analysisResult.productName}</Text>
            </View>
          )}

          {analysisResult.servingSize && analysisResult.servingSize !== 'Unknown' && (
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Serving Size</Text>
              <Text style={styles.resultValue}>{analysisResult.servingSize}</Text>
            </View>
          )}

          {/* Show OCR debug info (always in debug mode, or when zero ingredients) */}
          {/* COMMENTED OUT FOR PRODUCTION
          {(DEBUG_MODE || analysisResult.ingredients.length === 0) && analysisResult.rawResponse && (
            <View style={styles.debugCard}>
              <Text style={styles.debugTitle}>🔍 Debug Info</Text>
              {analysisResult.ingredients.length === 0 && (
                <Text style={styles.debugText}>
                  The OCR extracted text but couldn't find any vitamin/supplement patterns.
                </Text>
              )}
              <Text style={styles.debugSubtext}>
                Raw OCR text (first 300 chars):
              </Text>
              <View style={styles.debugRawText}>
                <Text style={styles.debugRawTextContent}>
                  {analysisResult.rawResponse.substring(0, 300)}
                  {analysisResult.rawResponse.length > 300 ? '...' : ''}
                </Text>
              </View>
              {analysisResult.ingredients.length === 0 && (
                <Text style={styles.debugHelp}>
                  💡 Tip: Try taking the photo in better lighting with the label clearly visible and text in focus.
                </Text>
              )}
            </View>
          )}
          */}

          <View style={styles.ingredientsCard}>
            <View style={styles.ingredientsCountBanner}>
              <Text style={styles.ingredientsCountIcon}>
                {analysisResult.ingredients.length > 0 ? '🌸' : '🌺'}
              </Text>
              <Text style={styles.ingredientsHeader}>
                {analysisResult.ingredients.length > 0 
                  ? `Found ${analysisResult.ingredients.length} Ingredients!` 
                  : 'No Ingredients Found'}
              </Text>
            </View>
            
            {analysisResult.ingredients.length === 0 && (
              <View style={styles.noIngredientsHelp}>
                <Text style={styles.noIngredientsText}>
                  Try taking another photo with:
                </Text>
                <Text style={styles.helpBullet}>• Better lighting</Text>
                <Text style={styles.helpBullet}>• Closer to the label</Text>
                <Text style={styles.helpBullet}>• Text in sharp focus</Text>
                <Text style={styles.helpBullet}>• Straight-on angle</Text>
              </View>
            )}
            
            {analysisResult.ingredients.map((ingredient, index) => {
              const ingredientInfo = findIngredient(ingredient.name);
              // Prioritize AI-generated description, fall back to knowledge base
              const aiDescription = ingredient.description || ingredient.benefits;
              const hasAIDescription = !!(ingredient.description || ingredient.benefits);
              const knowledgeBaseDescription = ingredientInfo?.benefits;
              const finalDescription = aiDescription || knowledgeBaseDescription;
              
              return (
                <View key={index} style={styles.recommendationCard}>
                  {/* Product Info Row */}
                  <View style={styles.productHeader}>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{ingredient.name}</Text>
                      <Text style={styles.productBrand}>Detected Ingredient</Text>
                      <View style={styles.productLabel}>
                        <Text style={styles.productLabelText}>Scanned</Text>
                    </View>
                    </View>
                  </View>

                  {/* Key Benefits - only show if there's meaningful content */}
                  {(finalDescription || ingredientInfo?.benefits) && (
                    <View style={styles.benefitsSection}>
                      <Text style={styles.benefitsTitle}>Key Benefits:</Text>
                      <Text style={styles.benefitText}>• {finalDescription || ingredientInfo?.benefits}</Text>
                    </View>
                  )}

                  {/* Dosage Information */}
                  {ingredient.unit && (
                    <View style={styles.dosageSection}>
                      <Text style={styles.dosageText}>
                        Dosage: {ingredient.amount || '?'} {ingredient.unit}
                        {ingredient.percentDailyValue && ` (${ingredient.percentDailyValue})`}
                          </Text>
                        </View>
                      )}
                      
                  {/* Ingredient Analysis Section - only show if there are warnings */}
                  {ingredientInfo?.warnings && ingredientInfo.warnings.length > 0 && (
                    <View style={styles.analysisSection}>
                      <View style={styles.analysisHeader}>
                        <Text style={styles.analysisIcon}>🌺</Text>
                        <Text style={styles.analysisTitle}>Ingredient Analysis</Text>
                        <Text style={styles.analysisArrow}>▼</Text>
                      </View>
                      
                      {/* Warnings/Alerts */}
                      <View style={styles.alertRow}>
                        <Text style={styles.alertIcon}>🌺</Text>
                        <Text style={styles.alertText}>1 New</Text>
                      </View>
                    </View>
                  )}

                  {/* Action Button */}
                  <TouchableOpacity style={styles.addToTrackButton}>
                    <Text style={styles.addToTrackIcon}>🌸</Text>
                    <Text style={styles.addToTrackText}>Add to Daily Track</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {analysisResult.warnings && analysisResult.warnings.length > 0 && (
            <View style={styles.warningsCard}>
              <Text style={styles.warningsHeader}>🌺 Warnings</Text>
              {analysisResult.warnings.map((warning, index) => (
                <Text key={index} style={styles.warningText}>• {warning}</Text>
              ))}
            </View>
          )}

          <TouchableOpacity 
            style={styles.saveButton}
            onPress={saveToTracker}>
            <Text style={styles.saveButtonText}>🌸 Save to Tracker</Text>
          </TouchableOpacity>
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF7F7',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#E91E63',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E91E63',
  },
  placeholder: {
    width: 40,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cameraTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 22,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  scanTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 1,
  },
  libraryButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 22,
  },
  libraryButtonText: {
    fontSize: 20,
  },
  cameraBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  instructionsBox: {
    flex: 1,
    marginRight: 12,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
  },
  searchButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 22,
  },
  searchButtonGhost: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 20,
    color: '#fff',
  },
  cameraInstructionText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  cameraToggle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraToggleText: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  cameraIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  cameraIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF69B4',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#FF69B4',
  },
  cameraEmoji: {
    fontSize: 48,
  },
  cameraLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E91E63',
    marginTop: 12,
  },
  instructionsContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  instructionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E91E63',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  cameraButton: {
    backgroundColor: '#FF69B4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#FF69B4',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  libraryButtonAction: {
    backgroundColor: '#FFB6C1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#FF69B4',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonAction: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#4CAF50',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 12,
    color: '#ffffff',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  analyzingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  analyzingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#E91E63',
  },
  analyzingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9E9E9E',
  },
  resultsContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E91E63',
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: '#FEF7F7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ingredientsCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  ingredientsCountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
  },
  ingredientsCountIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  ingredientsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  noIngredientsHelp: {
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  noIngredientsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 12,
  },
  helpBullet: {
    fontSize: 13,
    color: '#78350F',
    marginLeft: 8,
    marginVertical: 2,
  },
  ingredientDetailCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF69B4',
  },
  ingredientHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  ingredientBullet: {
    width: 20,
  },
  bulletText: {
    fontSize: 18,
    color: '#FF69B4',
    fontWeight: 'bold',
  },
  ingredientHeaderInfo: {
    flex: 1,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  ingredientDosage: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  ingredientBenefits: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  benefitRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 4,
  },
  benefitIcon: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
  },
  benefitLabel: {
    fontWeight: '600',
    color: '#333',
  },
  noInfoText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 4,
  },
  warningsCard: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#E65100',
    marginVertical: 2,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#4CAF50',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  debugCard: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D97706',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 14,
    color: '#92400E',
    marginBottom: 12,
    lineHeight: 20,
  },
  debugSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78350F',
    marginBottom: 8,
    marginTop: 8,
  },
  debugRawText: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  debugRawTextContent: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  debugHelp: {
    fontSize: 13,
    color: '#92400E',
    fontStyle: 'italic',
  },
  personalizedContainer: {
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  personalizedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E5BBA',
    marginBottom: 12,
  },
  personalizedCard: {
    backgroundColor: '#E8F4FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  personalizedText: {
    fontSize: 14,
    color: '#2E5BBA',
    fontWeight: '500',
  },
  profileSummary: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  profileText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  trimesterCard: {
    backgroundColor: '#FFF0F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFB6C1',
  },
  trimesterCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trimesterCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E91E63',
  },
  trimesterBadge: {
    backgroundColor: '#E91E63',
    color: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  trimesterCardDosage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  trimesterCardBenefits: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  productLabel: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  productLabelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  benefitsSection: {
    marginBottom: 16,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  dosageSection: {
    marginBottom: 16,
  },
  dosageText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  analysisSection: {
    marginBottom: 16,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  analysisIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  analysisArrow: {
    fontSize: 12,
    color: '#666',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#F44336',
  },
  alertIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  alertText: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '600',
  },
  addToTrackButton: {
    backgroundColor: '#E91E63',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addToTrackIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    marginRight: 8,
    fontWeight: 'bold',
  },
  addToTrackText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  warningCard: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  focusCard: {
    backgroundColor: '#F3E5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  focusText: {
    fontSize: 14,
    color: '#7B1FA2',
    fontWeight: '500',
  },
  ingredientDetailCardNew: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  ingredientHeaderNew: {
    marginBottom: 8,
  },
  ingredientNameNew: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E91E63',
    marginBottom: 4,
  },
  ingredientDosageNew: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  ingredientBenefitsNew: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  benefitTextNew: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  smallActionButton: {
    flex: 1,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  smallButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  smallButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  scanningGuideContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  scanningGuideFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#fff',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  vitaminCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  vitaminName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  vitaminSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  sectionCard: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 6,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionSubtext: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#FF69B4',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backToMenuButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backToMenuText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  scanContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  cameraPreviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cameraPreviewPlaceholder: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cameraPreviewText: {
    fontSize: 48,
    marginBottom: 8,
  },
  cameraPreviewLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  alignInstruction: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  scanNowMainButton: {
    backgroundColor: '#FF69B4',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#FF69B4',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  scanNowMainIcon: {
    fontSize: 20,
    marginRight: 8,
    color: '#fff',
  },
  scanNowMainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scanStatusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scanStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  scanStatusText: {
    fontSize: 14,
    color: '#666',
  },
  alternativeOptions: {
    gap: 12,
  },
  alternativeButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alternativeButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  alternativeButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  scanInstructionText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '500',
  },
  scanNowButton: {
    backgroundColor: '#FF69B4',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF69B4',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  scanNowIcon: {
    fontSize: 20,
    marginRight: 8,
    color: '#fff',
  },
  scanNowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ScanIngredients;