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
              content: `I'm looking for information about the vitamin/supplement: "${searchQuery}". 

Please provide detailed information in this exact JSON format:

{
  "vitamins": [
    {
      "name": "exact vitamin name",
      "benefits": "key health benefits (2-3 sentences)",
      "dosage": "recommended daily dosage",
      "pregnancySafe": true/false,
      "trimesterRecommendation": "specific advice for pregnancy (which trimester is best, why important)",
      "warnings": ["warning 1", "warning 2"],
      "sources": ["food source 1", "food source 2", "food source 3"]
    }
  ]
}

Focus on:
1. Pregnancy safety and trimester-specific benefits
2. Recommended dosages for pregnant women
3. Natural food sources
4. Any warnings or precautions
5. Why this vitamin is important during pregnancy

If the search term is not a real vitamin/supplement, return an empty vitamins array.`
            }
          ],
          max_tokens: 1500,
          temperature: 0.3,
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

      // Parse the JSON response
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
        throw new Error('Could not parse vitamin information');
      }

      if (parsed.vitamins && Array.isArray(parsed.vitamins)) {
        setSearchResults(parsed.vitamins);
        if (parsed.vitamins.length === 0) {
          Alert.alert(
            'No Results Found',
            `Could not find information about "${searchQuery}". Try searching for a specific vitamin name like "Vitamin D", "Folic Acid", or "Iron".`
          );
        }
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      console.error('❌ Search error:', error);
      Alert.alert(
        'Search Failed',
        `Could not search for "${searchQuery}". Please check your internet connection and try again.`
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
                {['Vitamin D', 'Folic Acid', 'Iron', 'Calcium', 'Omega-3', 'B12'].map((suggestion) => (
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
