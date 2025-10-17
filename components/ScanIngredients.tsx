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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import {AnalysisResult} from '../services/IngredientAI';

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
  // Option 1: Use your Python backend (FREE!)
  const USE_BACKEND = false; // Set to true when backend is deployed
  const BACKEND_URL = 'https://your-app.railway.app'; // Replace with your backend URL
  
  // Option 2: Use OpenAI directly (PAID - $0.01 per scan)
  const USE_OPENAI = false; // Set to true to use OpenAI
  const OPENAI_API_KEY = ''; // Add your OpenAI API key here
  
  // Option 3: Mock mode for testing (FREE - no real AI)
  const USE_MOCK = true; // Set to false in production

  const analyzeWithBackend = async (imageUri: string): Promise<AnalysisResult> => {
    // Read image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Send to your Python backend
    const response = await fetch(`${BACKEND_URL}/analyze`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        image: `data:image/jpeg;base64,${base64}`
      }),
      timeout: 30000, // 30 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }
    
    return await response.json();
  };

  const analyzeWithOpenAI = async (imageUri: string): Promise<AnalysisResult> => {
    // Read image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Call OpenAI Vision API
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
                text: `Analyze this vitamin/supplement label and extract ALL ingredients with their amounts.
                
Return JSON format:
{
  "productName": "Product name",
  "servingSize": "1 tablet",
  "ingredients": [
    {"name": "Vitamin A", "amount": "770", "unit": "mcg", "percentDailyValue": "85%"}
  ],
  "warnings": ["Any warnings"]
}`
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
        max_tokens: 1000,
      }),
    });
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {success: true, ...parsed};
    }
    
    return {success: false, ingredients: [], error: 'Could not parse response'};
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
        Alert.alert(
          '✅ Analysis Complete!',
          `Found ${result.ingredients.length} ingredients in ${result.productName || 'your supplement'}`,
          [{ text: 'View Details', onPress: () => {} }]
        );
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
      // Request camera permission
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (cameraPermission.status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'We need camera access to take photos of vitamin labels for scanning.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('Photo taken:', result.assets[0].uri);
        await analyzeImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      Alert.alert('Error', 'Failed to access camera. Please try again.');
    }
  };

  const handleLibraryPress = async () => {
    try {
      // Request photo library permission
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (libraryPermission.status !== 'granted') {
        Alert.alert(
          'Photo Library Permission Required',
          'We need access to your photo library to select vitamin label images for scanning.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch photo library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('Photo selected:', result.assets[0].uri);
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

          <View style={styles.ingredientsCard}>
            <Text style={styles.ingredientsHeader}>
              Ingredients Found: {analysisResult.ingredients.length}
            </Text>
            
            {analysisResult.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientRow}>
                <View style={styles.ingredientBullet}>
                  <Text style={styles.bulletText}>•</Text>
                </View>
                <View style={styles.ingredientInfo}>
                  <Text style={styles.ingredientName}>{ingredient.name}</Text>
                  <Text style={styles.ingredientDosage}>
                    {ingredient.amount} {ingredient.unit}
                    {ingredient.percentDailyValue && ` (${ingredient.percentDailyValue} DV)`}
                  </Text>
                </View>
              </View>
            ))}
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
            onPress={() => {
              Alert.alert('Save', 'Feature coming soon: Save to your vitamin tracker!');
            }}>
            <Text style={styles.saveButtonText}>Save to Tracker</Text>
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
  ingredientsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  ingredientBullet: {
    width: 20,
  },
  bulletText: {
    fontSize: 18,
    color: '#FF69B4',
    fontWeight: 'bold',
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  ingredientDosage: {
    fontSize: 13,
    color: '#666',
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
});

export default ScanIngredients;