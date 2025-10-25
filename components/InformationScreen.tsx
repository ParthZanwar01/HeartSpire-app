import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { TrimesterInfo, trimesterGuidance } from '../services/supabase';

interface InformationScreenProps {
  userTrimester: 'first' | 'second' | 'third' | 'not_pregnant';
  onBack: () => void;
  onScanVitamins: () => void;
}

const InformationScreen: React.FC<InformationScreenProps> = ({
  userTrimester,
  onBack,
  onScanVitamins,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'vitamins' | 'foods' | 'tips'>('overview');

  const currentGuidance = trimesterGuidance[userTrimester];

  const renderOverview = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Current Focus</Text>
        <Text style={styles.sectionDescription}>{currentGuidance.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Nutrients This Period</Text>
        <View style={styles.nutrientGrid}>
          {currentGuidance.important_nutrients.map((nutrient, index) => (
            <View key={index} style={styles.nutrientCard}>
              <Text style={styles.nutrientText}>{nutrient}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What to Include</Text>
        <View style={styles.foodList}>
          {currentGuidance.foods_to_include.map((food, index) => (
            <View key={index} style={styles.foodItem}>
              <Text style={styles.foodIcon}>✅</Text>
              <Text style={styles.foodText}>{food}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What to Avoid</Text>
        <View style={styles.foodList}>
          {currentGuidance.foods_to_avoid.map((food, index) => (
            <View key={index} style={styles.foodItem}>
              <Text style={styles.foodIcon}>❌</Text>
              <Text style={styles.foodText}>{food}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderVitamins = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended Vitamins</Text>
        <Text style={styles.sectionDescription}>
          These vitamins are particularly important for your current stage:
        </Text>
      </View>

      <View style={styles.vitaminList}>
        {currentGuidance.recommended_vitamins.map((vitamin, index) => (
          <View key={index} style={styles.vitaminCard}>
            <View style={styles.vitaminHeader}>
              <Text style={styles.vitaminIcon}>💊</Text>
              <Text style={styles.vitaminName}>{vitamin}</Text>
            </View>
            <Text style={styles.vitaminDescription}>
              {getVitaminDescription(vitamin, userTrimester)}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.scanButton} onPress={onScanVitamins}>
        <Text style={styles.scanButtonIcon}>📱</Text>
        <Text style={styles.scanButtonText}>Scan Your Vitamins</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFoods = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Food Recommendations</Text>
        <Text style={styles.sectionDescription}>
          Focus on these foods for optimal nutrition:
        </Text>
      </View>

      <View style={styles.foodCategory}>
        <Text style={styles.categoryTitle}>Foods to Include</Text>
        <View style={styles.foodGrid}>
          {currentGuidance.foods_to_include.map((food, index) => (
            <View key={index} style={styles.foodCard}>
              <Text style={styles.foodCardIcon}>✅</Text>
              <Text style={styles.foodCardText}>{food}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.foodCategory}>
        <Text style={styles.categoryTitle}>Foods to Limit</Text>
        <View style={styles.foodGrid}>
          {currentGuidance.foods_to_avoid.map((food, index) => (
            <View key={index} style={styles.foodCard}>
              <Text style={styles.foodCardIcon}>⚠️</Text>
              <Text style={styles.foodCardText}>{food}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderTips = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Tips</Text>
        <Text style={styles.sectionDescription}>
          Practical advice for your current stage:
        </Text>
      </View>

      <View style={styles.tipsList}>
        {getTrimesterTips(userTrimester).map((tip, index) => (
          <View key={index} style={styles.tipCard}>
            <Text style={styles.tipIcon}>{tip.icon}</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.tipDescription}>{tip.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const getVitaminDescription = (vitamin: string, trimester: string): string => {
    const descriptions: { [key: string]: { [key: string]: string } } = {
      'Folic Acid': {
        first: 'Critical for neural tube development in early pregnancy',
        second: 'Continues to support brain and spinal cord development',
        third: 'Helps prevent birth defects and supports final development',
        not_pregnant: 'Important for preconception health and cell division'
      },
      'Iron': {
        first: 'Prevents anemia and supports increased blood volume',
        second: 'Essential for oxygen transport to growing baby',
        third: 'Prevents maternal anemia and supports final growth',
        not_pregnant: 'Maintains healthy blood and energy levels'
      },
      'Vitamin D': {
        first: 'Supports bone development and immune function',
        second: 'Helps with calcium absorption for bone growth',
        third: 'Prepares for strong bones at birth',
        not_pregnant: 'Essential for bone health and immune function'
      },
      'Calcium': {
        first: 'Builds strong bones and teeth foundation',
        second: 'Supports rapid bone development',
        third: 'Ensures strong bones for birth',
        not_pregnant: 'Maintains bone density and muscle function'
      },
      'Omega-3': {
        first: 'Supports brain and eye development',
        second: 'Critical for brain growth and development',
        third: 'Final brain development and preparation for birth',
        not_pregnant: 'Supports heart and brain health'
      }
    };

    return descriptions[vitamin]?.[trimester] || 'Important for overall health and wellness';
  };

  const getTrimesterTips = (trimester: string) => {
    const tips: { [key: string]: Array<{ icon: string; title: string; description: string }> } = {
      first: [
        { icon: '🌱', title: 'Early Development', description: 'Focus on folic acid and avoid harmful substances' },
        { icon: '💧', title: 'Stay Hydrated', description: 'Drink plenty of water to support increased blood volume' },
        { icon: '🍎', title: 'Small Frequent Meals', description: 'Eat smaller meals more often to manage nausea' },
        { icon: '😴', title: 'Rest Well', description: 'Get extra sleep to support your body\'s changes' }
      ],
      second: [
        { icon: '🌿', title: 'Growth Phase', description: 'Focus on protein and calcium for rapid development' },
        { icon: '🏃‍♀️', title: 'Stay Active', description: 'Light exercise helps with energy and circulation' },
        { icon: '🥗', title: 'Balanced Diet', description: 'Include variety of colorful fruits and vegetables' },
        { icon: '📱', title: 'Track Progress', description: 'Monitor your nutrition and energy levels' }
      ],
      third: [
        { icon: '🌳', title: 'Final Preparation', description: 'Focus on iron and protein for birth preparation' },
        { icon: '💪', title: 'Build Strength', description: 'Prepare your body for labor and delivery' },
        { icon: '🧘‍♀️', title: 'Manage Stress', description: 'Practice relaxation techniques for birth' },
        { icon: '📋', title: 'Prepare', description: 'Get everything ready for your baby\'s arrival' }
      ],
      not_pregnant: [
        { icon: '💪', title: 'General Health', description: 'Focus on overall wellness and nutrition' },
        { icon: '🏃‍♀️', title: 'Stay Active', description: 'Regular exercise supports overall health' },
        { icon: '🥗', title: 'Balanced Diet', description: 'Eat a variety of nutrient-rich foods' },
        { icon: '😴', title: 'Quality Sleep', description: 'Aim for 7-9 hours of quality sleep nightly' }
      ]
    };

    return tips[trimester] || tips.not_pregnant;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'vitamins':
        return renderVitamins();
      case 'foods':
        return renderFoods();
      case 'tips':
        return renderTips();
      default:
        return renderOverview();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Information</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Trimester Badge */}
      <View style={styles.trimesterBadge}>
        <Text style={styles.trimesterIcon}>
          {userTrimester === 'first' ? '🌱' : 
           userTrimester === 'second' ? '🌿' : 
           userTrimester === 'third' ? '🌳' : '💪'}
        </Text>
        <Text style={styles.trimesterText}>
          {userTrimester === 'first' ? 'First Trimester' : 
           userTrimester === 'second' ? 'Second Trimester' : 
           userTrimester === 'third' ? 'Third Trimester' : 'General Health'}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {[
          { key: 'overview', label: 'Overview', icon: '📋' },
          { key: 'vitamins', label: 'Vitamins', icon: '💊' },
          { key: 'foods', label: 'Foods', icon: '🍎' },
          { key: 'tips', label: 'Tips', icon: '💡' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabLabel,
              activeTab === tab.key && styles.activeTabLabel
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {renderTabContent()}
      </ScrollView>
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
  trimesterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F5',
    marginHorizontal: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  trimesterIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  trimesterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E91E63',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#FFE4E1',
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#FF69B4',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E91E63',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  nutrientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nutrientCard: {
    backgroundColor: '#FFE4E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  nutrientText: {
    fontSize: 14,
    color: '#E91E63',
    fontWeight: '500',
  },
  foodList: {
    gap: 8,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  foodIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  foodText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  vitaminList: {
    gap: 16,
  },
  vitaminCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE4E1',
  },
  vitaminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vitaminIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  vitaminName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E91E63',
  },
  vitaminDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF69B4',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },
  scanButtonIcon: {
    fontSize: 20,
    marginRight: 12,
    color: '#ffffff',
  },
  scanButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  foodCategory: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E91E63',
    marginBottom: 12,
  },
  foodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE4E1',
  },
  foodCardIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  foodCardText: {
    fontSize: 14,
    color: '#333',
  },
  tipsList: {
    gap: 16,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE4E1',
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E91E63',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default InformationScreen;
