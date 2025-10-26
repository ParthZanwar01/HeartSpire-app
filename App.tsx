/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  Alert,
} from 'react-native';
import {StatusBar as ExpoStatusBar} from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './components/HomeScreen';
import ScanIngredients from './components/ScanIngredients';
import ModernVitaminTracker from './components/ModernVitaminTracker';
import UserQuestionnaire from './components/UserQuestionnaire';
import InformationScreen from './components/InformationScreen';
import VitaminSearch from './components/VitaminSearch';
import AuthScreen from './components/AuthScreen';
import ProfileScreen from './components/ProfileScreen';
import PregnancyToolsScreen from './components/PregnancyToolsScreen';
import ReminderSettingsScreen from './components/ReminderSettingsScreen';
import BottomNavigation from './components/BottomNavigation';
import { UserProfile, userService, authService } from './services/supabase';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [currentTab, setCurrentTab] = useState<'home' | 'scan' | 'tracker' | 'info' | 'search' | 'profile'>('home');
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#FEF7F7',
  };

  // Load user profile and check authentication on app start
  useEffect(() => {
    checkAuthAndLoadProfile();
  }, []);

  const checkAuthAndLoadProfile = async () => {
    try {
      // Check if user is authenticated
      const currentUser = await authService.getCurrentUser();
      
      if (currentUser) {
        setIsAuthenticated(true);
        // Load user profile from Supabase
        const profile = await userService.getProfile(currentUser.id);
        if (profile) {
          setUserProfile(profile);
          // Check if user needs to complete questionnaire
          if (profile.account_status === 'pending') {
            setShowQuestionnaire(true);
          }
        } else {
          setShowQuestionnaire(true);
        }
      } else {
        // Always show auth screen first - no guest access
        setShowAuth(true);
      }
    } catch (error) {
      console.error('Error checking auth and loading profile:', error);
      setShowAuth(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionnaireComplete = async (profile: Partial<UserProfile>) => {
    try {
      // All users must be authenticated now
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        // Create complete profile with all questionnaire data
        const completeProfile: UserProfile = {
          id: currentUser.id,
          name: profile.name || userProfile?.name || 'User',
          email: profile.email || userProfile?.email || currentUser.email || '',
          age: profile.age || '',
          gender: profile.gender || '',
          weight: profile.weight || '',
          due_date: profile.due_date || '',
          trimester: profile.trimester || 'not_pregnant',
          allergies: profile.allergies || [],
          focus_areas: profile.focus_areas || [],
          dietary_restrictions: profile.dietary_restrictions || [],
          account_status: 'active', // Complete profile = active status
          created_at: userProfile?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        console.log('Saving complete profile with questionnaire data:', completeProfile);

        const savedProfile = await userService.updateProfile(completeProfile);
        if (savedProfile) {
          setUserProfile(savedProfile);
          setShowTools(true); // Show tools screen after questionnaire completion
        } else {
          console.error('Failed to update user profile');
          Alert.alert('Error', 'Failed to save your profile. Please try again.');
        }
      }
      
      setShowQuestionnaire(false);
    } catch (error) {
      console.error('Error saving user profile:', error);
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
    }
  };

  const handleQuestionnaireSkip = () => {
    setShowQuestionnaire(false);
  };

  const handleAuthSuccess = async (user: any) => {
    console.log('Auth success - User object:', user);
    console.log('User ID:', user.id);
    console.log('User email:', user.email);
    console.log('User metadata:', user.user_metadata);
    
    setIsAuthenticated(true);
    setShowAuth(false);
    setCurrentUser(user);
    
    // Load user profile from Supabase
    const profile = await userService.getProfile(user.id);
    if (profile) {
      setUserProfile(profile);
      // Check if user needs to complete questionnaire
      if (profile.account_status === 'pending') {
        setShowQuestionnaire(true);
      }
    } else {
      // Create a basic profile with auth data for new users
      const basicProfile: Partial<UserProfile> = {
        id: user.id,
        name: user.user_metadata?.name || 'User',
        email: user.email || '',
        trimester: 'not_pregnant',
        allergies: [],
        focus_areas: [],
        dietary_restrictions: [],
        account_status: 'pending', // New users start with pending status
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      console.log('Creating basic profile:', basicProfile);
      
      // Save the basic profile to Supabase (new user, so use createProfile)
      const savedProfile = await userService.createProfile(basicProfile);
      if (savedProfile) {
        setUserProfile(savedProfile);
        // Show questionnaire for additional details
        setShowQuestionnaire(true);
      } else {
        console.error('Failed to create user profile');
        Alert.alert('Error', 'Failed to create your profile. Please try again.');
      }
    }
  };

  const handleAuthSkip = () => {
    // No longer allow skipping - users must create an account
    Alert.alert(
      'Account Required',
      'You must create an account to use VitaMom. This ensures your data is securely saved and you can access it from any device.',
      [{ text: 'OK' }]
    );
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      setIsAuthenticated(false);
      setUserProfile(null);
      setShowAuth(true);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleUpdateProfile = (updatedProfile: Partial<UserProfile>) => {
    if (userProfile) {
      const newProfile = { ...userProfile, ...updatedProfile };
      setUserProfile(newProfile);
    }
  };

  const handleToolsComplete = () => {
    setShowTools(false);
  };

  const handleReminderSettingsSave = async (settings: any) => {
    try {
      if (userProfile) {
        const updatedProfile = {
          ...userProfile,
          reminder_enabled: settings.enabled,
          reminder_time: settings.time,
          reminder_message: settings.message,
          reminder_trimester_specific: settings.trimesterSpecific,
        };
        
        await userService.upsertProfile(updatedProfile);
        setUserProfile(updatedProfile);
        setShowReminderSettings(false);
      }
    } catch (error) {
      console.error('Error saving reminder settings:', error);
    }
  };

  const handleStartScanning = async () => {
    try {
      // Request permission first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to scan vitamin labels!');
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Support HEIC files
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        exif: false, // Reduce file size
      });
      
      if (!res.canceled && res.assets[0]) {
        // Handle scanned image here
        console.log('Scanned image:', res.assets[0].uri);
        alert(`Successfully selected image: ${res.assets[0].fileName || 'Unknown'}`);
      }
    } catch (error) {
      console.error('Error accessing photo library:', error);
      alert('Error accessing photo library. Please try again.');
    }
  };

  const renderCurrentScreen = () => {
    if (isLoading) {
      return null; // You could add a loading screen here
    }

    if (showAuth) {
      return (
        <AuthScreen
          onAuthSuccess={handleAuthSuccess}
        />
      );
    }

    if (showQuestionnaire) {
      return (
        <UserQuestionnaire
          onComplete={handleQuestionnaireComplete}
          onSkip={handleQuestionnaireSkip}
          user={currentUser}
          existingProfile={userProfile}
        />
      );
    }

    if (showTools) {
      return (
        <PregnancyToolsScreen
          onBack={handleToolsComplete}
          onScanPress={() => {
            setShowTools(false);
            setCurrentTab('scan');
          }}
          onTrackerPress={() => {
            setShowTools(false);
            setCurrentTab('tracker');
          }}
          onInfoPress={() => {
            setShowTools(false);
            setCurrentTab('info');
          }}
          onSearchPress={() => {
            setShowTools(false);
            setCurrentTab('search');
          }}
          onProfilePress={() => {
            setShowTools(false);
            setCurrentTab('profile');
          }}
          userProfile={userProfile}
        />
      );
    }

    if (showReminderSettings) {
      return (
        <ReminderSettingsScreen
          onBack={() => setShowReminderSettings(false)}
          userProfile={userProfile}
          onSaveSettings={handleReminderSettingsSave}
        />
      );
    }

    switch (currentTab) {
      case 'home':
        return (
          <HomeScreen
            onScanPress={() => setCurrentTab('scan')}
            onTrackerPress={() => setCurrentTab('tracker')}
            onInfoPress={() => setCurrentTab('info')}
            onProfilePress={() => setCurrentTab('profile')}
            onSettingsPress={() => setShowQuestionnaire(true)}
            userName={userProfile?.name || 'User'}
            userTrimester={userProfile?.trimester || 'not_pregnant'}
            isAuthenticated={isAuthenticated}
          />
        );
      case 'scan':
        return (
          <ScanIngredients
            onStartScanning={handleStartScanning}
            onBack={() => setCurrentTab('home')}
            onSearchPress={() => setCurrentTab('search')}
            userProfile={userProfile}
          />
        );
      case 'tracker':
        return (
          <ModernVitaminTracker
            onBack={() => setCurrentTab('home')}
            userProfile={userProfile}
          />
        );
      case 'info':
        return (
          <InformationScreen
            userTrimester={userProfile?.trimester || 'not_pregnant'}
            onBack={() => setCurrentTab('home')}
            onScanVitamins={() => setCurrentTab('scan')}
          />
        );
      case 'search':
        return (
          <VitaminSearch
            onBack={() => setCurrentTab('scan')}
            userProfile={userProfile}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            onBack={() => setCurrentTab('home')}
            onSignOut={handleSignOut}
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            onReminderSettings={() => setShowReminderSettings(true)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[backgroundStyle, {flex: 1}]}>
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />
      {renderCurrentScreen()}
      {!showQuestionnaire && !showTools && !showReminderSettings && !isLoading && (
        <BottomNavigation
          activeTab={currentTab}
          onTabChange={setCurrentTab}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
