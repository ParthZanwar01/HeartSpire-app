import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { UserProfile } from '../services/supabase';

interface UserQuestionnaireProps {
  onComplete: (profile: Partial<UserProfile>) => void;
  onSkip: () => void;
  user?: {
    id: string;
    email?: string;
    user_metadata?: {
      name?: string;
    };
  };
  existingProfile?: UserProfile | null;
}

const UserQuestionnaire: React.FC<UserQuestionnaireProps> = ({
  onComplete,
  onSkip,
  user,
  existingProfile,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: existingProfile?.name || user?.user_metadata?.name || '',
    email: existingProfile?.email || user?.email || '',
    age: existingProfile?.age || '',
    gender: existingProfile?.gender || '',
    weight: existingProfile?.weight || '',
    due_date: existingProfile?.due_date || '',
    trimester: existingProfile?.trimester || 'not_pregnant',
    allergies: existingProfile?.allergies || [],
    focus_areas: existingProfile?.focus_areas || [],
    dietary_restrictions: existingProfile?.dietary_restrictions || [],
    account_status: existingProfile?.account_status || 'pending',
  });

  const steps = [
    {
      title: 'Welcome to VitaMom!',
      subtitle: 'Let\'s personalize your experience',
      content: 'welcome'
    },
    {
      title: 'How old are you?',
      subtitle: 'This helps us provide age-appropriate guidance',
      content: 'age'
    },
    {
      title: 'What\'s your current weight?',
      subtitle: 'This helps us calculate appropriate vitamin dosages',
      content: 'weight'
    },
    {
      title: 'Are you currently pregnant?',
      subtitle: 'This helps us provide pregnancy-specific guidance',
      content: 'pregnancy'
    },
    {
      title: 'What\'s your estimated due date?',
      subtitle: 'This helps us calculate your exact trimester',
      content: 'due_date'
    },
    {
      title: 'Which trimester are you in?',
      subtitle: 'This helps us give you trimester-specific advice',
      content: 'trimester'
    },
    {
      title: 'Do you have any allergies?',
      subtitle: 'We\'ll help you avoid problematic ingredients',
      content: 'allergies'
    },
    {
      title: 'What are you most focused on?',
      subtitle: 'Select all that apply',
      content: 'focus'
    },
    {
      title: 'Any dietary restrictions?',
      subtitle: 'Help us understand your dietary needs',
      content: 'dietary'
    },
    {
      title: 'All set!',
      subtitle: 'Your personalized VitaMom experience is ready',
      content: 'complete'
    }
  ];

  const allergyOptions = [
    'Nuts', 'Dairy', 'Gluten', 'Soy', 'Eggs', 'Fish', 'Shellfish', 'Sesame'
  ];

  const focusOptions = [
    'Nutritional balance',
    'Weight management',
    'Energy levels',
    'Digestive health',
    'Immune support',
    'Bone health',
    'Heart health',
    'Mental wellness'
  ];

  const dietaryOptions = [
    'Vegetarian',
    'Vegan',
    'Keto',
    'Paleo',
    'Mediterranean',
    'Low-carb',
    'Dairy-free',
    'Gluten-free'
  ];


  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      console.log('Questionnaire completed with profile data:', profile);
      onComplete(profile);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };


  const handleAgeChange = (age: string) => {
    setProfile({ ...profile, age });
  };


  const handleWeightChange = (weight: string) => {
    setProfile({ ...profile, weight });
  };

  const handleDueDateChange = (due_date: string) => {
    setProfile({ ...profile, due_date });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const formattedDate = selectedDate.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
      setProfile({ ...profile, due_date: formattedDate });
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const handlePregnancyChange = (isPregnant: boolean) => {
    setProfile({ 
      ...profile, 
      trimester: isPregnant ? 'first' : 'not_pregnant' 
    });
  };

  const handleTrimesterChange = (trimester: 'first' | 'second' | 'third') => {
    setProfile({ ...profile, trimester });
  };

  const toggleAllergy = (allergy: string) => {
    const currentAllergies = profile.allergies || [];
    const newAllergies = currentAllergies.includes(allergy)
      ? currentAllergies.filter(a => a !== allergy)
      : [...currentAllergies, allergy];
    setProfile({ ...profile, allergies: newAllergies });
  };

  const toggleFocus = (focus: string) => {
    const currentFocus = profile.focus_areas || [];
    const newFocus = currentFocus.includes(focus)
      ? currentFocus.filter(f => f !== focus)
      : [...currentFocus, focus];
    setProfile({ ...profile, focus_areas: newFocus });
  };

  const toggleDietary = (dietary: string) => {
    const currentDietary = profile.dietary_restrictions || [];
    const newDietary = currentDietary.includes(dietary)
      ? currentDietary.filter(d => d !== dietary)
      : [...currentDietary, dietary];
    setProfile({ ...profile, dietary_restrictions: newDietary });
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    
    switch (step.content) {
      case 'welcome':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
            <View style={styles.welcomeIcon}>
              <Text style={styles.welcomeIconText}>💖</Text>
            </View>
            <Text style={styles.welcomeDescription}>
              We'll ask you a few questions to personalize your vitamin tracking experience and provide you with the best guidance for your health journey.
            </Text>
          </View>
        );


      case 'age':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
            <TextInput
              style={styles.textInput}
              value={profile.age}
              onChangeText={handleAgeChange}
              placeholder="Enter your age"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            <Text style={styles.inputHelper}>
              This helps us provide age-appropriate vitamin recommendations
            </Text>
          </View>
        );


      case 'weight':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
            <TextInput
              style={styles.textInput}
              value={profile.weight}
              onChangeText={handleWeightChange}
              placeholder="Enter your weight (lbs or kg)"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            <Text style={styles.inputHelper}>
              This helps us calculate appropriate vitamin dosages for your body
            </Text>
          </View>
        );

      case 'due_date':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={showDatePickerModal}
            >
              <Text style={styles.datePickerButtonText}>
                {profile.due_date || 'Select your due date'}
              </Text>
              <Text style={styles.datePickerIcon}>📅</Text>
            </TouchableOpacity>
            <Text style={styles.inputHelper}>
              This helps us calculate your exact trimester and provide precise guidance
            </Text>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
                maximumDate={new Date(new Date().getFullYear() + 1, 11, 31)}
              />
            )}
          </View>
        );

      case 'pregnancy':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
            <View style={styles.optionContainer}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  profile.trimester !== 'not_pregnant' && styles.selectedOption
                ]}
                onPress={() => handlePregnancyChange(true)}
              >
                <Text style={styles.optionIcon}>🤰</Text>
                <Text style={styles.optionText}>Yes, I'm pregnant</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  profile.trimester === 'not_pregnant' && styles.selectedOption
                ]}
                onPress={() => handlePregnancyChange(false)}
              >
                <Text style={styles.optionIcon}>💪</Text>
                <Text style={styles.optionText}>No, general health</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'trimester':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
            <View style={styles.optionContainer}>
              {['first', 'second', 'third'].map((trimester) => (
                <TouchableOpacity
                  key={trimester}
                  style={[
                    styles.optionButton,
                    profile.trimester === trimester && styles.selectedOption
                  ]}
                  onPress={() => handleTrimesterChange(trimester as 'first' | 'second' | 'third')}
                >
                  <Text style={styles.optionIcon}>
                    {trimester === 'first' ? '🌱' : trimester === 'second' ? '🌿' : '🌳'}
                  </Text>
                  <Text style={styles.optionText}>
                    {trimester === 'first' ? 'First Trimester' : 
                     trimester === 'second' ? 'Second Trimester' : 'Third Trimester'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'allergies':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
            <View style={styles.multiSelectContainer}>
              {allergyOptions.map((allergy) => (
                <TouchableOpacity
                  key={allergy}
                  style={[
                    styles.multiSelectOption,
                    profile.allergies?.includes(allergy) && styles.selectedMultiOption
                  ]}
                  onPress={() => toggleAllergy(allergy)}
                >
                  <Text style={[
                    styles.multiSelectText,
                    profile.allergies?.includes(allergy) && styles.selectedMultiText
                  ]}>
                    {allergy}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'focus':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
            <View style={styles.multiSelectContainer}>
              {focusOptions.map((focus) => (
                <TouchableOpacity
                  key={focus}
                  style={[
                    styles.multiSelectOption,
                    profile.focus_areas?.includes(focus) && styles.selectedMultiOption
                  ]}
                  onPress={() => toggleFocus(focus)}
                >
                  <Text style={[
                    styles.multiSelectText,
                    profile.focus_areas?.includes(focus) && styles.selectedMultiText
                  ]}>
                    {focus}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'dietary':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
            <View style={styles.multiSelectContainer}>
              {dietaryOptions.map((dietary) => (
                <TouchableOpacity
                  key={dietary}
                  style={[
                    styles.multiSelectOption,
                    profile.dietary_restrictions?.includes(dietary) && styles.selectedMultiOption
                  ]}
                  onPress={() => toggleDietary(dietary)}
                >
                  <Text style={[
                    styles.multiSelectText,
                    profile.dietary_restrictions?.includes(dietary) && styles.selectedMultiText
                  ]}>
                    {dietary}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'complete':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
            <View style={styles.completeIcon}>
              <Text style={styles.completeIconText}>🎉</Text>
            </View>
            <Text style={styles.completeDescription}>
              Great! We've personalized your VitaMom experience based on your preferences. 
              You can always update these settings later.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (steps[currentStep].content) {
      case 'age':
        return profile.age && profile.age.trim().length > 0 && !isNaN(Number(profile.age));
      case 'weight':
        return profile.weight && profile.weight.trim().length > 0 && !isNaN(Number(profile.weight));
      case 'pregnancy':
        return profile.trimester !== undefined;
      case 'due_date':
        return profile.due_date && profile.due_date.trim().length > 0;
      case 'trimester':
        return profile.trimester !== 'not_pregnant';
      default:
        return true;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentStep + 1) / steps.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} of {steps.length}
          </Text>
        </View>

        {/* Step Content */}
        {renderStepContent()}

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {currentStep > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.navigationRight}>
            <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.nextButton,
                !canProceed() && styles.nextButtonDisabled
              ]}
              onPress={handleNext}
              disabled={!canProceed()}
            >
              <Text style={[
                styles.nextButtonText,
                !canProceed() && styles.nextButtonTextDisabled
              ]}>
                {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF7F7',
  },
  scrollView: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#FFE4E1',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF69B4',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#FF69B4',
    textAlign: 'center',
  },
  stepContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E91E63',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#FF69B4',
    textAlign: 'center',
    marginBottom: 32,
  },
  textInput: {
    width: '100%',
    height: 50,
    borderWidth: 2,
    borderColor: '#FFE4E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#333',
  },
  inputHelper: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  optionContainer: {
    width: '100%',
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFE4E1',
  },
  selectedOption: {
    borderColor: '#FF69B4',
    backgroundColor: '#FFF0F5',
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  multiSelectContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  multiSelectOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE4E1',
  },
  selectedMultiOption: {
    backgroundColor: '#FF69B4',
    borderColor: '#FF69B4',
  },
  multiSelectText: {
    fontSize: 14,
    color: '#333',
  },
  selectedMultiText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  welcomeIcon: {
    marginBottom: 24,
  },
  welcomeIconText: {
    fontSize: 48,
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  completeIcon: {
    marginBottom: 24,
  },
  completeIconText: {
    fontSize: 48,
  },
  completeDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF69B4',
    fontWeight: '500',
  },
  navigationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#999',
  },
  nextButton: {
    backgroundColor: '#FF69B4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  nextButtonDisabled: {
    backgroundColor: '#FFE4E1',
  },
  nextButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  nextButtonTextDisabled: {
    color: '#999',
  },
  datePickerButton: {
    width: '100%',
    height: 50,
    borderWidth: 2,
    borderColor: '#FFE4E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  datePickerIcon: {
    fontSize: 20,
  },
});

export default UserQuestionnaire;
