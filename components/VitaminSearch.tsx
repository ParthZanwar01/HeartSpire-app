import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { UserProfile } from '../services/supabase';
import { findIngredient, INGREDIENT_DATABASE } from '../services/IngredientKnowledgeBase';

interface VitaminSearchProps {
  onBack: () => void;
  userProfile?: UserProfile | null;
}

interface VitaminInfo {
  name: string;
  benefits: string;
  dosage: string;
  pregnancySafe: boolean;
  trimesterRecommendation: string;
  warnings: string[];
  sources: string[];
}

const VitaminSearch: React.FC<VitaminSearchProps> = ({
  onBack,
  userProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<VitaminInfo[]>([]);
  const [selectedVitamin, setSelectedVitamin] = useState<VitaminInfo | null>(null);

  // ChatGPT API configuration
  const OPENAI_API_KEY = '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';

  // Helper function to get trimester-specific recommendations
  const getTrimesterRecommendation = (vitaminName: string): string => {
    const trimesterMap: { [key: string]: string } = {
      'Folic Acid': 'Most critical in first trimester for neural tube development. Continue throughout pregnancy.',
      'Iron': 'Essential throughout pregnancy, especially second and third trimesters for increased blood volume.',
      'DHA (Docosahexaenoic Acid)': 'Important throughout pregnancy, especially third trimester for baby brain development.',
      'Iodine': 'Critical throughout pregnancy for baby brain and thyroid development.',
      'Vitamin D3': 'Essential throughout pregnancy for calcium absorption and bone development.',
      'Calcium': 'Important throughout pregnancy, especially third trimester for baby bone development.',
      'Vitamin B12': 'Essential throughout pregnancy for nervous system development.',
      'Choline': 'Important throughout pregnancy, especially third trimester for brain development.',
    };
    
    return trimesterMap[vitaminName] || 'Important throughout pregnancy for overall health and development.';
  };

  // Helper function to get natural food sources
  const getNaturalSources = (vitaminName: string): string[] => {
    const sourcesMap: { [key: string]: string[] } = {
      'Folic Acid': ['Leafy greens (spinach, kale)', 'Fortified cereals', 'Beans and lentils', 'Citrus fruits'],
      'Iron': ['Lean red meat', 'Spinach', 'Fortified cereals', 'Beans'],
      'DHA (Docosahexaenoic Acid)': ['Fatty fish (salmon, sardines)', 'Algal oil supplements', 'Fortified eggs'],
      'Iodine': ['Iodized salt', 'Seafood', 'Dairy products', 'Seaweed'],
      'Vitamin D3': ['Sunlight exposure', 'Fatty fish', 'Fortified milk', 'Egg yolks'],
      'Calcium': ['Dairy products', 'Leafy greens', 'Fortified plant milks', 'Sardines'],
      'Vitamin B12': ['Animal products', 'Fortified cereals', 'Nutritional yeast'],
      'Choline': ['Eggs', 'Meat', 'Fish', 'Dairy products'],
      'Vitamin C': ['Citrus fruits', 'Bell peppers', 'Strawberries', 'Broccoli'],
      'Vitamin A': ['Sweet potatoes', 'Carrots', 'Spinach', 'Fortified milk'],
    };
    
    return sourcesMap[vitaminName] || ['Various food sources', 'Fortified foods', 'Supplements'];
  };

  // Comprehensive fact-checking function
  const factCheckVitaminInfo = (vitamin: any): { isValid: boolean; corrections: string[]; warnings: string[] } => {
    const corrections: string[] = [];
    const warnings: string[] = [];
    let isValid = true;

    const vitaminName = vitamin.name?.toLowerCase() || '';
    
    // Fact-check dosage ranges against medical standards
    if (vitamin.dosage) {
      const dosageStr = vitamin.dosage.toLowerCase();
      
      // Check for unrealistic dosages
      if (vitaminName.includes('vitamin a') || vitaminName.includes('retinol')) {
        if (dosageStr.includes('iu') && dosageStr.match(/\d+/)) {
          const iuMatch = dosageStr.match(/(\d+)/);
          if (iuMatch && parseInt(iuMatch[1]) > 10000) {
            warnings.push('⚠️ High Vitamin A dosage detected - consult healthcare provider');
          }
        }
      }
      
      if (vitaminName.includes('iron')) {
        if (dosageStr.match(/\d+/)) {
          const mgMatch = dosageStr.match(/(\d+)/);
          if (mgMatch && parseInt(mgMatch[1]) > 45) {
            warnings.push('⚠️ High iron dosage detected - may cause side effects');
          }
        }
      }
      
      if (vitaminName.includes('folic acid') || vitaminName.includes('folate')) {
        if (dosageStr.match(/\d+/)) {
          const mcgMatch = dosageStr.match(/(\d+)/);
          if (mcgMatch && parseInt(mcgMatch[1]) > 1000) {
            warnings.push('⚠️ High folic acid dosage detected - consult healthcare provider');
          }
        }
      }
    }

    // Fact-check pregnancy safety claims
    if (vitamin.pregnancySafe !== undefined) {
      // Known unsafe vitamins during pregnancy
      const unsafeVitamins = ['vitamin a (high doses)', 'retinol (high doses)', 'vitamin e (high doses)'];
      const isUnsafeVitamin = unsafeVitamins.some(unsafe => vitaminName.includes(unsafe));
      
      if (isUnsafeVitamin && vitamin.pregnancySafe === true) {
        corrections.push('❌ Pregnancy safety claim corrected - high doses may be harmful');
        vitamin.pregnancySafe = false;
        isValid = false;
      }
    }

    // Fact-check benefits against known medical facts
    if (vitamin.benefits) {
      const benefits = vitamin.benefits.toLowerCase();
      
      // Check for medical inaccuracies
      if (vitaminName.includes('folic acid') && !benefits.includes('neural tube')) {
        corrections.push('✅ Added critical neural tube defect prevention benefit');
        vitamin.benefits += ' Essential for preventing neural tube defects like spina bifida.';
      }
      
      if (vitaminName.includes('iron') && !benefits.includes('anemia')) {
        corrections.push('✅ Added anemia prevention benefit');
        vitamin.benefits += ' Prevents iron-deficiency anemia during pregnancy.';
      }
      
      if (vitaminName.includes('dha') && !benefits.includes('brain')) {
        corrections.push('✅ Added brain development benefit');
        vitamin.benefits += ' Supports baby\'s brain and eye development.';
      }
    }

    // Fact-check sources
    if (vitamin.sources && Array.isArray(vitamin.sources)) {
      const sources = vitamin.sources.map((s: string) => s.toLowerCase());
      
      // Validate food sources
      if (vitaminName.includes('vitamin b12') && !sources.some((s: string) => s.includes('animal') || s.includes('meat'))) {
        corrections.push('✅ Added animal product sources for B12');
        vitamin.sources.push('Animal products (meat, fish, dairy)');
      }
      
      if (vitaminName.includes('vitamin d') && !sources.some((s: string) => s.includes('sun') || s.includes('fish'))) {
        corrections.push('✅ Added sunlight and fish sources for Vitamin D');
        vitamin.sources.push('Sunlight exposure', 'Fatty fish');
      }
    }

    // Check for suspicious or unrealistic claims
    if (vitamin.benefits && vitamin.benefits.toLowerCase().includes('cure')) {
      warnings.push('⚠️ Medical claims should be verified with healthcare provider');
    }

    return { isValid, corrections, warnings };
  };

  const searchVitamins = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Please enter a vitamin name', 'Type the name of a vitamin you want to learn about.');
      return;
    }

    setSearching(true);
    setSearchResults([]);
    setSelectedVitamin(null);

    try {
      console.log('🔍 Searching for vitamin:', searchQuery);
      
      // First, try AI search for comprehensive online information
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'user',
              content: `I'm looking for detailed information about the vitamin/supplement: "${searchQuery}". 

IMPORTANT: This is for a pregnancy health app, so focus specifically on pregnancy safety and benefits.

Please provide comprehensive information in this exact JSON format:

{
  "vitamins": [
    {
      "name": "exact vitamin/supplement name",
      "benefits": "detailed health benefits during pregnancy (3-4 sentences explaining what it does for mom and baby)",
      "dosage": "specific recommended daily dosage for pregnant women with units (mg, mcg, IU, etc.)",
      "pregnancySafe": true/false,
      "trimesterRecommendation": "specific trimester advice (e.g., 'Most important in first trimester for neural tube development' or 'Essential throughout pregnancy for bone health')",
      "warnings": ["specific warning 1", "specific warning 2", "any contraindications"],
      "sources": ["natural food source 1", "natural food source 2", "natural food source 3"]
    }
  ]
}

CRITICAL REQUIREMENTS:
1. Be medically accurate - only include real vitamins/supplements
2. Focus on pregnancy-specific benefits and safety
3. Include specific dosage recommendations for pregnant women
4. Mention trimester-specific importance where applicable
5. Include natural food sources
6. List any warnings or precautions
7. If the search term is not a real vitamin/supplement, return an empty vitamins array

Common vitamins to consider: Vitamin A, B-complex vitamins, Vitamin C, Vitamin D, Vitamin E, Vitamin K, Folic Acid, Iron, Calcium, Magnesium, Zinc, Iodine, DHA, Choline, etc.`
            }
          ],
          max_tokens: 2000,
          temperature: 0.2, // Lower temperature for more consistent, accurate results
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from OpenAI');
      }

      console.log('📊 OpenAI response:', content);

      // Parse the JSON response with enhanced validation
      let parsed;
      try {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('❌ JSON parsing error:', parseError);
        console.log('Raw AI response:', content);
        throw new Error('Could not parse vitamin information. Please try again.');
      }

      if (!parsed.vitamins || !Array.isArray(parsed.vitamins)) {
        console.error('Invalid response structure:', parsed);
        throw new Error('Invalid response format from AI');
      }

      if (parsed.vitamins.length === 0) {
        Alert.alert(
          'No Results Found',
          `No information found for "${searchQuery}". Please try a different vitamin name or check the spelling.`
        );
        return;
      }

      // Enhanced validation and cleaning of results with comprehensive fact-checking
      const validatedResults = parsed.vitamins
        .filter((vitamin: any) => {
          // Basic validation
          if (!vitamin.name || typeof vitamin.name !== 'string') {
            console.warn('Skipping invalid vitamin - missing name:', vitamin);
            return false;
          }
          if (!vitamin.benefits || typeof vitamin.benefits !== 'string') {
            console.warn('Skipping invalid vitamin - missing benefits:', vitamin);
            return false;
          }
          return true;
        })
        .map((vitamin: any) => {
          // Clean and validate each field
          const cleanedVitamin = {
            name: vitamin.name.trim(),
            benefits: vitamin.benefits.trim(),
            dosage: typeof vitamin.dosage === 'string' ? vitamin.dosage.trim() : 'Consult your healthcare provider',
            pregnancySafe: typeof vitamin.pregnancySafe === 'boolean' ? vitamin.pregnancySafe : true,
            trimesterRecommendation: typeof vitamin.trimesterRecommendation === 'string' 
              ? vitamin.trimesterRecommendation.trim() 
              : 'Important throughout pregnancy',
            warnings: Array.isArray(vitamin.warnings) 
              ? vitamin.warnings.filter((w: any) => typeof w === 'string').map((w: string) => w.trim())
              : [],
            sources: Array.isArray(vitamin.sources) 
              ? vitamin.sources.filter((s: any) => typeof s === 'string').map((s: string) => s.trim())
              : ['Various sources'],
          };

          // Comprehensive fact-checking
          console.log('🔍 Fact-checking vitamin:', cleanedVitamin.name);
          const factCheck = factCheckVitaminInfo(cleanedVitamin);
          
          if (factCheck.corrections.length > 0) {
            console.log('✅ Fact-check corrections applied:', factCheck.corrections);
          }
          
          if (factCheck.warnings.length > 0) {
            console.log('⚠️ Fact-check warnings added:', factCheck.warnings);
            // Add warnings to the vitamin's warning list
            cleanedVitamin.warnings.push(...factCheck.warnings);
          }

          // Additional validation for critical vitamins
          if (cleanedVitamin.name.toLowerCase().includes('folic acid') || 
              cleanedVitamin.name.toLowerCase().includes('folate')) {
            if (!cleanedVitamin.warnings.some((w: string) => w.toLowerCase().includes('neural tube'))) {
              cleanedVitamin.warnings.push('Essential for preventing neural tube defects');
            }
          }

          return cleanedVitamin;
        });

      if (validatedResults.length === 0) {
        Alert.alert(
          'Invalid Results',
          'The search returned invalid data. Please try a different search term.'
        );
        return;
      }

      console.log('✅ Validated search results:', validatedResults);
      setSearchResults(validatedResults);

    } catch (error) {
      console.error('❌ AI search failed:', error);
      
      // Fallback to knowledge base if AI search fails
      console.log('🔄 Falling back to knowledge base...');
      const knowledgeBaseResult = findIngredient(searchQuery);
      
      if (knowledgeBaseResult) {
        console.log('📚 Found in knowledge base:', knowledgeBaseResult.canonicalName);
        
        // Convert knowledge base result to VitaminInfo format
        const vitaminInfo: VitaminInfo = {
          name: knowledgeBaseResult.canonicalName,
          benefits: knowledgeBaseResult.benefits || 'Essential nutrient for health and development.',
          dosage: knowledgeBaseResult.pregnancyRecommendation || 'Consult your healthcare provider',
          pregnancySafe: true, // Our knowledge base only contains pregnancy-safe nutrients
          trimesterRecommendation: getTrimesterRecommendation(knowledgeBaseResult.canonicalName),
          warnings: knowledgeBaseResult.warnings || [],
          sources: getNaturalSources(knowledgeBaseResult.canonicalName),
        };
        
        setSearchResults([vitaminInfo]);
        setSearching(false);
        return;
      }
      
      // If neither AI nor knowledge base found results
      Alert.alert(
        'Search Failed',
        `Could not find information about "${searchQuery}". Please try a different vitamin name or check the spelling.`
      );
    } finally {
      setSearching(false);
    }
  };

  const getPersonalizedRecommendation = (vitamin: VitaminInfo) => {
    if (!userProfile) return null;

    const recommendations: string[] = [];
    const warnings: string[] = [];

    // Check trimester-specific recommendations
    if (userProfile.trimester !== 'not_pregnant') {
      if (vitamin.trimesterRecommendation) {
        recommendations.push(`🤰 ${vitamin.trimesterRecommendation}`);
      }
    }

    // Check allergies
    if (userProfile.allergies && userProfile.allergies.length > 0) {
      const vitaminName = vitamin.name.toLowerCase();
      const hasAllergy = userProfile.allergies.some(allergy => 
        vitaminName.includes(allergy.toLowerCase()) ||
        vitamin.sources.some(source => 
          source.toLowerCase().includes(allergy.toLowerCase())
        )
      );
      
      if (hasAllergy) {
        warnings.push(`⚠️ May contain allergens you're sensitive to`);
      }
    }

    // Check pregnancy safety
    if (userProfile.trimester !== 'not_pregnant' && !vitamin.pregnancySafe) {
      warnings.push(`🚨 Not recommended during pregnancy`);
    }

    return { recommendations, warnings };
  };

  const renderVitaminCard = (vitamin: VitaminInfo, index: number) => {
    const personalized = getPersonalizedRecommendation(vitamin);
    
    return (
      <TouchableOpacity
        key={index}
        style={styles.vitaminCard}
        onPress={() => setSelectedVitamin(vitamin)}
      >
        <View style={styles.vitaminHeader}>
          <Text style={styles.vitaminName}>{vitamin.name}</Text>
          <View style={styles.safetyBadge}>
            <Text style={styles.safetyText}>
              {vitamin.pregnancySafe ? '✅ Safe' : '⚠️ Caution'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.vitaminBenefits}>{vitamin.benefits}</Text>
        
        <View style={styles.vitaminDetails}>
          <Text style={styles.detailLabel}>Dosage:</Text>
          <Text style={styles.detailValue}>{vitamin.dosage}</Text>
        </View>

        {personalized && personalized.recommendations.length > 0 && (
          <View style={styles.personalizedContainer}>
            {personalized.recommendations.map((rec, idx) => (
              <Text key={idx} style={styles.personalizedText}>{rec}</Text>
            ))}
          </View>
        )}

        {personalized && personalized.warnings.length > 0 && (
          <View style={styles.warningContainer}>
            {personalized.warnings.map((warning, idx) => (
              <Text key={idx} style={styles.warningText}>{warning}</Text>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderVitaminDetail = (vitamin: VitaminInfo) => {
    const personalized = getPersonalizedRecommendation(vitamin);
    
    return (
      <ScrollView style={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{vitamin.name}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedVitamin(null)}
          >
            <Text style={styles.backButtonText}>← Back to Results</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Benefits</Text>
          <Text style={styles.sectionContent}>{vitamin.benefits}</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Recommended Dosage</Text>
          <Text style={styles.sectionContent}>{vitamin.dosage}</Text>
        </View>

        {vitamin.trimesterRecommendation && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Pregnancy Recommendation</Text>
            <Text style={styles.sectionContent}>{vitamin.trimesterRecommendation}</Text>
          </View>
        )}

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Natural Sources</Text>
          <View style={styles.sourcesList}>
            {vitamin.sources.map((source, index) => (
              <Text key={index} style={styles.sourceItem}>• {source}</Text>
            ))}
          </View>
        </View>

        {vitamin.warnings.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Warnings</Text>
            <View style={styles.warningsList}>
              {vitamin.warnings.map((warning, index) => (
                <Text key={index} style={styles.warningItem}>⚠️ {warning}</Text>
              ))}
            </View>
          </View>
        )}

        {personalized && personalized.recommendations.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Personalized for You</Text>
            <View style={styles.personalizedList}>
              {personalized.recommendations.map((rec, index) => (
                <Text key={index} style={styles.personalizedItem}>{rec}</Text>
              ))}
            </View>
          </View>
        )}

        {personalized && personalized.warnings.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Personalized Warnings</Text>
            <View style={styles.warningsList}>
              {personalized.warnings.map((warning, index) => (
                <Text key={index} style={styles.warningItem}>{warning}</Text>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Vitamins</Text>
        <View style={styles.headerSpacer} />
      </View>

      {!selectedVitamin ? (
        <ScrollView style={styles.content}>
          {/* Search Section */}
          <View style={styles.searchSection}>
            <Text style={styles.searchTitle}>Find Vitamin Information</Text>
            <Text style={styles.searchSubtitle}>
              Search for any vitamin or supplement to get detailed information
            </Text>
            
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="e.g., Vitamin D, Folic Acid, Iron..."
                placeholderTextColor="#999"
                autoCapitalize="words"
                returnKeyType="search"
                onSubmitEditing={searchVitamins}
              />
              <TouchableOpacity
                style={[styles.searchButton, searching && styles.searchButtonDisabled]}
                onPress={searchVitamins}
                disabled={searching}
              >
                {searching ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.searchButtonText}>Search</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Search Suggestions */}
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Popular Searches:</Text>
              <View style={styles.suggestionsList}>
                {[
                  'Folic Acid', 'Iron', 'Vitamin D3', 'DHA', 'Calcium', 
                  'Vitamin B12', 'Iodine', 'Choline', 'Vitamin C', 'Magnesium'
                ].map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion}
                    style={styles.suggestionChip}
                    onPress={() => {
                      setSearchQuery(suggestion);
                      searchVitamins();
                    }}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <View style={styles.resultsSection}>
              <Text style={styles.resultsTitle}>
                Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </Text>
              {searchResults.map((vitamin, index) => renderVitaminCard(vitamin, index))}
            </View>
          )}
        </ScrollView>
      ) : (
        renderVitaminDetail(selectedVitamin)
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF7F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF69B4',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E91E63',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  searchSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E91E63',
    marginBottom: 8,
  },
  searchSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderWidth: 2,
    borderColor: '#FFE4E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#333',
    marginRight: 12,
  },
  searchButton: {
    backgroundColor: '#FF69B4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  searchButtonDisabled: {
    backgroundColor: '#FFB6C1',
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionsContainer: {
    marginTop: 16,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E91E63',
    marginBottom: 12,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#FFE4E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  suggestionText: {
    fontSize: 14,
    color: '#E91E63',
    fontWeight: '500',
  },
  resultsSection: {
    padding: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E91E63',
    marginBottom: 16,
  },
  vitaminCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  vitaminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vitaminName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E91E63',
    flex: 1,
  },
  safetyBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  safetyText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  vitaminBenefits: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  vitaminDetails: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  personalizedContainer: {
    backgroundColor: '#F0F8FF',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  personalizedText: {
    fontSize: 12,
    color: '#2E5BBA',
    fontWeight: '500',
  },
  warningContainer: {
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '500',
  },
  detailContainer: {
    flex: 1,
    padding: 20,
  },
  detailHeader: {
    marginBottom: 24,
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E91E63',
    marginBottom: 12,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E91E63',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  sourcesList: {
    marginTop: 8,
  },
  sourceItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  warningsList: {
    marginTop: 8,
  },
  warningItem: {
    fontSize: 14,
    color: '#E65100',
    marginBottom: 4,
  },
  personalizedList: {
    marginTop: 8,
  },
  personalizedItem: {
    fontSize: 14,
    color: '#2E5BBA',
    marginBottom: 4,
  },
});

export default VitaminSearch;
