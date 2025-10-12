/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import {StatusBar as ExpoStatusBar} from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import HomeScreen from './components/HomeScreen';
import ScanIngredients from './components/ScanIngredients';
import ModernVitaminTracker from './components/ModernVitaminTracker';
import BottomNavigation from './components/BottomNavigation';

import {Colors} from 'react-native/Libraries/NewAppScreen';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [currentTab, setCurrentTab] = useState<'home' | 'scan' | 'tracker'>('home');

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : '#FEF7F7',
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
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
    switch (currentTab) {
      case 'home':
        return (
          <HomeScreen
            onScanPress={() => setCurrentTab('scan')}
            onTrackerPress={() => setCurrentTab('tracker')}
            onSettingsPress={() => console.log('Settings pressed')}
            userName="Sarah"
          />
        );
      case 'scan':
        return (
          <ScanIngredients
            onStartScanning={handleStartScanning}
            onBack={() => setCurrentTab('home')}
          />
        );
      case 'tracker':
        return (
          <ModernVitaminTracker
            onBack={() => setCurrentTab('home')}
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
      <BottomNavigation
        activeTab={currentTab}
        onTabChange={setCurrentTab}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
