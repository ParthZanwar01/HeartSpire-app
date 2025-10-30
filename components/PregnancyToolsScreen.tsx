import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { UserProfile } from '../services/supabase';

interface PregnancyToolsScreenProps {
  onBack: () => void;
  onScanPress: () => void;
  onTrackerPress: () => void;
  onInfoPress: () => void;
  onSearchPress: () => void;
  onProfilePress: () => void;
  onArticlesPress: () => void;
  userProfile: UserProfile | null;
}

const PregnancyToolsScreen: React.FC<PregnancyToolsScreenProps> = ({
  onBack,
  onScanPress,
  onTrackerPress,
  onInfoPress,
  onSearchPress,
  onProfilePress,
  onArticlesPress,
  userProfile,
}) => {
  const getTrimesterInfo = () => {
    if (!userProfile?.trimester || userProfile.trimester === 'not_pregnant') {
      return { title: 'General Health', color: '#4CAF50', icon: '💪' };
    }
    
    const trimesterInfo = {
      first: { title: 'First Trimester', color: '#FF9800', icon: '🌱' },
      second: { title: 'Second Trimester', color: '#2196F3', icon: '🌿' },
      third: { title: 'Third Trimester', color: '#9C27B0', icon: '🌳' },
    };
    
    return trimesterInfo[userProfile.trimester] || trimesterInfo.first;
  };

  const trimesterInfo = getTrimesterInfo();

  const tools = [
    {
      id: 'scan',
      title: 'Vitamin Scanner',
      description: 'Scan vitamin labels to check ingredients and safety',
      icon: '📱',
      color: '#FF69B4',
      onPress: onScanPress,
    },
    {
      id: 'tracker',
      title: 'Vitamin Tracker',
      description: 'Track your daily vitamin intake and progress',
      icon: '📊',
      color: '#4CAF50',
      onPress: onTrackerPress,
    },
    {
      id: 'search',
      title: 'Vitamin Search',
      description: 'Search for vitamins and get detailed information',
      icon: '🔍',
      color: '#2196F3',
      onPress: onSearchPress,
    },
    {
      id: 'info',
      title: 'Pregnancy Guide',
      description: 'Get trimester-specific health information',
      icon: '📚',
      color: '#FF9800',
      onPress: onInfoPress,
    },
    {
      id: 'articles',
      title: 'Articles',
      description: 'Browse pregnancy and parenting guides',
      icon: '📖',
      color: '#E91E63',
      onPress: onArticlesPress,
    },
    {
      id: 'profile',
      title: 'My Profile',
      description: 'View and update your health information',
      icon: '👤',
      color: '#9C27B0',
      onPress: onProfilePress,
    },
  ];

  const getPersonalizedMessage = () => {
    if (!userProfile) return 'Welcome to VitaMom!';
    
    const name = userProfile.name || 'there';
    const trimester = userProfile.trimester;
    
    if (trimester === 'not_pregnant') {
      return `Welcome, ${name}! Ready to optimize your health?`;
    }
    
    return `Welcome, ${name}! You're in your ${trimester} trimester. Let's keep you and your baby healthy!`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>VitaMom Tools</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>{getPersonalizedMessage()}</Text>
          
          {userProfile?.trimester && userProfile.trimester !== 'not_pregnant' && (
            <View style={[styles.trimesterCard, { backgroundColor: `${trimesterInfo.color}20` }]}>
              <Text style={styles.trimesterIcon}>{trimesterInfo.icon}</Text>
              <View style={styles.trimesterInfo}>
                <Text style={[styles.trimesterTitle, { color: trimesterInfo.color }]}>
                  {trimesterInfo.title}
                </Text>
                {userProfile.due_date && (
                  <Text style={styles.dueDateText}>
                    Due Date: {userProfile.due_date}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Tools Grid */}
        <View style={styles.toolsSection}>
          <Text style={styles.sectionTitle}>Your Health Tools</Text>
          
          {tools.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={[styles.toolCard, { borderLeftColor: tool.color }]}
              onPress={tool.onPress}
            >
              <View style={styles.toolContent}>
                <Text style={styles.toolIcon}>{tool.icon}</Text>
                <View style={styles.toolInfo}>
                  <Text style={styles.toolTitle}>{tool.title}</Text>
                  <Text style={styles.toolDescription}>{tool.description}</Text>
                </View>
                <Text style={styles.toolArrow}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Stats */}
        {userProfile && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Your Health Profile</Text>
            
            <View style={styles.statsCard}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Age</Text>
                <Text style={styles.statValue}>{userProfile.age || 'Not set'} years</Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Weight</Text>
                <Text style={styles.statValue}>{userProfile.weight || 'Not set'} lbs</Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Allergies</Text>
                <Text style={styles.statValue}>
                  {userProfile.allergies?.length || 0} recorded
                </Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Focus Areas</Text>
                <Text style={styles.statValue}>
                  {userProfile.focus_areas?.length || 0} selected
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Safety Reminder */}
        <View style={styles.safetySection}>
          <Text style={styles.sectionTitle}>Important Reminders</Text>
          
          <View style={styles.safetyCard}>
            <Text style={styles.safetyIcon}>⚠️</Text>
            <View style={styles.safetyContent}>
              <Text style={styles.safetyTitle}>Always Consult Your Doctor</Text>
              <Text style={styles.safetyText}>
                VitaMom provides general guidance only. Always consult your healthcare provider before making any changes to your vitamin routine, especially during pregnancy.
              </Text>
            </View>
          </View>
        </View>

        {/* Get Started Button */}
        <TouchableOpacity style={styles.getStartedButton} onPress={onScanPress}>
          <Text style={styles.getStartedButtonText}>Start Scanning Vitamins</Text>
        </TouchableOpacity>
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
    padding: 20,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E91E63',
    textAlign: 'center',
    marginBottom: 16,
  },
  trimesterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  trimesterIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  trimesterInfo: {
    flex: 1,
  },
  trimesterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dueDateText: {
    fontSize: 14,
    color: '#666',
  },
  toolsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E91E63',
    marginBottom: 16,
  },
  toolCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toolContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  toolInfo: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 14,
    color: '#666',
  },
  toolArrow: {
    fontSize: 18,
    color: '#FF69B4',
    fontWeight: 'bold',
  },
  statsSection: {
    marginBottom: 24,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    color: '#333',
  },
  safetySection: {
    marginBottom: 24,
  },
  safetyCard: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  safetyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  safetyContent: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  safetyText: {
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
  },
  getStartedButton: {
    backgroundColor: '#FF69B4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  getStartedButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default PregnancyToolsScreen;
