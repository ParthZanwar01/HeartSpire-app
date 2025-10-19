import React, {useState} from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AnalysisResult} from '../services/IngredientAI';
import {findIngredient} from '../services/IngredientKnowledgeBase';

interface ScanIngredientsProps {
  onStartScanning: () => void;
  onBack: () => void;
}

const ScanIngredients: React.FC<ScanIngredientsProps> = ({
  onStartScanning,
  onBack,
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // PRODUCTION CONFIGURATION
  // Option 1: Use OpenAI Vision (BEST - $0.002 per scan, MUCH better than OCR!)
  const USE_OPENAI = true; // Using GPT-4 Vision for better results!
  const OPENAI_API_KEY = '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';
  
  // Option 2: Use your Python backend (FREE but OCR quality varies)
  const USE_BACKEND = false; // Disabled - OCR has poor quality
  const BACKEND_URL = 'https://MathGenius01-vitamom-backend.hf.space';
  
  // Option 3: Mock mode for testing
  const USE_MOCK = false;
  
  // Debug mode - set to true to see detailed logs
  const DEBUG_MODE = true;
  
  // NEW: Request ingredient descriptions from AI
  const GET_INGREDIENT_DESCRIPTIONS = true;

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
      
      // Check if FileSystem is available
      if (!FileSystem || !FileSystem.readAsStringAsync) {
        throw new Error('FileSystem API not available');
      }
      
      // Read image as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64' as any, // Use string instead of enum
      });
      
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

  const analyzeWithOpenAI = async (imageUri: string): Promise<AnalysisResult> => {
    try {
      console.log('🧠 Using OpenAI Vision (GPT-4o) - this is MUCH better than OCR!');
      
      // Read image as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64' as any,
      });
      
      console.log('✅ Image encoded, sending to OpenAI...');
      
      // Call OpenAI Vision API with enhanced prompt
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
                    url: `data:image/jpeg;base64,${base64}`,
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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI error: ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      console.log('📊 OpenAI response received');
      
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from OpenAI');
      }
      
      console.log('🔍 Parsing OpenAI response...');
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        console.log(`✅ OpenAI found ${parsed.ingredients?.length || 0} ingredients`);
        
        return {
          success: true,
          productName: parsed.productName || 'Unknown Product',
          servingSize: parsed.servingSize || 'Unknown',
          ingredients: parsed.ingredients || [],
          warnings: parsed.warnings || [],
          rawResponse: content,
        };
      }
      
      throw new Error('Could not parse OpenAI response');
      
    } catch (error) {
      console.error('❌ OpenAI Vision error:', error);
      return {
        success: false,
        ingredients: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
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

  const analyzeImage = async (imageUri: string) => {
    setAnalyzing(true);
    
    try {
      let result: AnalysisResult;
      
      if (USE_MOCK) {
        console.log('📝 Using mock analysis (for testing)');
        result = await mockAnalysis();
      } else if (USE_BACKEND) {
        console.log('🤖 Using Python backend (LLaVA)');
        result = await analyzeWithBackend(imageUri);
      } else if (USE_OPENAI && OPENAI_API_KEY) {
        console.log('🧠 Using OpenAI Vision API');
        result = await analyzeWithOpenAI(imageUri);
      } else {
        Alert.alert(
          'Configuration Error',
          'Please configure either BACKEND_URL or OPENAI_API_KEY in ScanIngredients.tsx'
        );
        return;
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
      Alert.alert(
        'Error',
        `Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCameraPress = async () => {
    try {
      // Always request camera permission when button is pressed
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (cameraPermission.status !== 'granted') {
        // Permission denied - guide user to settings
        Alert.alert(
          'Camera Permission Required',
          'We need camera access to take photos of vitamin labels for scanning. Please enable camera access in your device settings.',
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

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Use full photo without cropping
        quality: 1, // Highest quality
      });

      if (!result.canceled && result.assets[0]) {
        console.log('📸 Photo taken:', result.assets[0].uri);
        console.log('📸 Photo details:', {
          uri: result.assets[0].uri,
          width: result.assets[0].width,
          height: result.assets[0].height,
          fileSize: result.assets[0].fileSize
        });
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

      // Launch photo library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Use full photo without cropping
        quality: 1, // Highest quality
      });

      if (!result.canceled && result.assets[0]) {
        console.log('📁 Photo selected:', result.assets[0].uri);
        console.log('📁 Photo details:', {
          uri: result.assets[0].uri,
          width: result.assets[0].width,
          height: result.assets[0].height,
          fileSize: result.assets[0].fileSize
        });
        await analyzeImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error accessing photo library:', error);
      Alert.alert('Error', 'Failed to access photo library. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scan Ingredients</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Main Content */}
        <View style={styles.content}>
        {/* Camera Icon */}
        <TouchableOpacity style={styles.cameraIconContainer} onPress={handleCameraPress}>
          <View style={styles.cameraIcon}>
            <Text style={styles.cameraEmoji}>📷</Text>
          </View>
          <Text style={styles.cameraLabel}>Take Photo</Text>
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionTitle}>
            Scan your prenatal vitamin ingredients.
          </Text>
          <Text style={styles.instructionText}>
            Take a photo or select from your library.{'\n'}
            Ensure the text is clear and well-lit for accurate scanning.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cameraButton} onPress={handleCameraPress}>
            <Text style={styles.buttonIcon}>📷</Text>
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.libraryButton} onPress={handleLibraryPress}>
            <Text style={styles.buttonIcon}>📱</Text>
            <Text style={styles.buttonText}>Choose from Library</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Analysis Loading */}
      {analyzing && (
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="large" color="#FF69B4" />
          <Text style={styles.analyzingText}>Analyzing ingredients...</Text>
          <Text style={styles.analyzingSubtext}>This may take a few seconds</Text>
        </View>
      )}

      {/* Analysis Results */}
      {analysisResult && analysisResult.success && !analyzing && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>📋 Analysis Results</Text>
          
          {analysisResult.productName && (
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Product</Text>
              <Text style={styles.resultValue}>{analysisResult.productName}</Text>
            </View>
          )}

          {analysisResult.servingSize && (
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Serving Size</Text>
              <Text style={styles.resultValue}>{analysisResult.servingSize}</Text>
            </View>
          )}

          {/* Show OCR debug info (always in debug mode, or when zero ingredients) */}
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

          <View style={styles.ingredientsCard}>
            <View style={styles.ingredientsCountBanner}>
              <Text style={styles.ingredientsCountIcon}>
                {analysisResult.ingredients.length > 0 ? '✅' : '⚠️'}
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
              const hasAIDescription = ingredient.description || ingredient.benefits;
              
              return (
                <View key={index} style={styles.ingredientDetailCard}>
                  <View style={styles.ingredientHeader}>
                    <View style={styles.ingredientBullet}>
                      <Text style={styles.bulletText}>•</Text>
                    </View>
                    <View style={styles.ingredientHeaderInfo}>
                      <Text style={styles.ingredientName}>{ingredient.name}</Text>
                      <Text style={styles.ingredientDosage}>
                        {ingredient.amount} {ingredient.unit}
                        {ingredient.percentDailyValue && ` (${ingredient.percentDailyValue} DV)`}
                      </Text>
                    </View>
                  </View>
                  
                  {/* AI-Generated Description (Priority) */}
                  {hasAIDescription && (
                    <View style={styles.ingredientBenefits}>
                      <View style={styles.benefitRow}>
                        <Text style={styles.benefitIcon}>🤰</Text>
                        <Text style={styles.benefitText}>
                          {ingredient.description || ingredient.benefits}
                        </Text>
                      </View>
                      
                      {/* Also show pregnancy recommendation from knowledge base if available */}
                      {ingredientInfo?.pregnancyRecommendation && (
                        <View style={styles.benefitRow}>
                          <Text style={styles.benefitIcon}>💊</Text>
                          <Text style={styles.benefitText}>
                            <Text style={styles.benefitLabel}>Recommended: </Text>
                            {ingredientInfo.pregnancyRecommendation}
                          </Text>
                        </View>
                      )}
                      
                      {ingredientInfo?.warnings && ingredientInfo.warnings.length > 0 && (
                        <View style={styles.benefitRow}>
                          <Text style={styles.benefitIcon}>⚠️</Text>
                          <Text style={styles.benefitText}>
                            {ingredientInfo.warnings.join(', ')}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                  
                  {/* Fallback to Knowledge Base if no AI description */}
                  {!hasAIDescription && ingredientInfo && (
                    <View style={styles.ingredientBenefits}>
                      {ingredientInfo.benefits && (
                        <View style={styles.benefitRow}>
                          <Text style={styles.benefitIcon}>🤰</Text>
                          <Text style={styles.benefitText}>
                            {ingredientInfo.benefits}
                          </Text>
                        </View>
                      )}
                      
                      {ingredientInfo.pregnancyRecommendation && (
                        <View style={styles.benefitRow}>
                          <Text style={styles.benefitIcon}>💊</Text>
                          <Text style={styles.benefitText}>
                            <Text style={styles.benefitLabel}>Recommended: </Text>
                            {ingredientInfo.pregnancyRecommendation}
                          </Text>
                        </View>
                      )}
                      
                      {ingredientInfo.warnings && ingredientInfo.warnings.length > 0 && (
                        <View style={styles.benefitRow}>
                          <Text style={styles.benefitIcon}>⚠️</Text>
                          <Text style={styles.benefitText}>
                            {ingredientInfo.warnings.join(', ')}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                  
                  {/* No information available */}
                  {!hasAIDescription && !ingredientInfo && (
                    <View style={styles.ingredientBenefits}>
                      <Text style={styles.noInfoText}>
                        ℹ️ No additional information available for this ingredient
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {analysisResult.warnings && analysisResult.warnings.length > 0 && (
            <View style={styles.warningsCard}>
              <Text style={styles.warningsHeader}>⚠️ Warnings</Text>
              {analysisResult.warnings.map((warning, index) => (
                <Text key={index} style={styles.warningText}>• {warning}</Text>
              ))}
            </View>
          )}

          <TouchableOpacity 
            style={styles.saveButton}
            onPress={saveToTracker}>
            <Text style={styles.saveButtonText}>💾 Save to Tracker</Text>
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
    marginBottom: 40,
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#E91E63',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 30,
  },
  instructionText: {
    fontSize: 16,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 24,
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
  libraryButton: {
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
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
  benefitText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
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
});

export default ScanIngredients;