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
} from 'react-native';
import {StatusBar as ExpoStatusBar} from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './components/HomeScreen';
import ScanIngredients from './components/ScanIngredients';
import ModernVitaminTracker from './components/ModernVitaminTracker';
import UserQuestionnaire from './components/UserQuestionnaire';
import InformationScreen from './components/InformationScreen';
import BottomNavigation from './components/BottomNavigation';
import { UserProfile, userService } from './services/supabase';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [currentTab, setCurrentTab] = useState<'home' | 'scan' | 'tracker' | 'info'>('home');
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#FEF7F7',
  };

  // Load user profile on app start
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const storedProfile = await AsyncStorage.getItem('userProfile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        setUserProfile(profile);
        setShowQuestionnaire(false);
      } else {
        setShowQuestionnaire(true);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setShowQuestionnaire(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionnaireComplete = async (profile: Partial<UserProfile>) => {
    try {
      // Generate a simple user ID for demo purposes
      const userId = `user_${Date.now()}`;
      const fullProfile: UserProfile = {
        id: userId,
        name: profile.name || 'User',
        email: profile.email,
        trimester: profile.trimester || 'not_pregnant',
        allergies: profile.allergies || [],
        focus_areas: profile.focus_areas || [],
        dietary_restrictions: profile.dietary_restrictions || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save to AsyncStorage for demo purposes
      await AsyncStorage.setItem('userProfile', JSON.stringify(fullProfile));
      
      // In a real app, you would save to Supabase here
      // await userService.upsertProfile(fullProfile);
      
      setUserProfile(fullProfile);
      setShowQuestionnaire(false);
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  };

  const handleQuestionnaireSkip = () => {
    setShowQuestionnaire(false);
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

    if (showQuestionnaire) {
      return (
        <UserQuestionnaire
          onComplete={handleQuestionnaireComplete}
          onSkip={handleQuestionnaireSkip}
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
            onSettingsPress={() => setShowQuestionnaire(true)}
            userName={userProfile?.name || 'User'}
            userTrimester={userProfile?.trimester || 'not_pregnant'}
          />
        );
      case 'scan':
        return (
          <ScanIngredients
            onStartScanning={handleStartScanning}
            onBack={() => setCurrentTab('home')}
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
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[backgroundStyle, {flex: 1}]}>
      <ExpoStatusBar style={isDarkMode ? 'light' : 'dark'} />
      {renderCurrentScreen()}
      {!showQuestionnaire && !isLoading && (
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
