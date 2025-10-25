import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface HomeScreenProps {
  onScanPress: () => void;
  onTrackerPress: () => void;
  onInfoPress: () => void;
  onProfilePress: () => void;
  onSettingsPress: () => void;
  userName?: string;
  userTrimester?: 'first' | 'second' | 'third' | 'not_pregnant';
  isAuthenticated?: boolean;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  onScanPress,
  onTrackerPress,
  onInfoPress,
  onProfilePress,
  onSettingsPress,
  userName = 'Sarah',
  userTrimester = 'not_pregnant',
  isAuthenticated = false,
}) => {
  const testPermissions = async () => {
    try {
      // Test camera permission
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      // Test photo library permission
      const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      Alert.alert(
        'Permission Status',
        `Camera: ${cameraStatus.status}\nPhoto Library: ${libraryStatus.status}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error checking permissions:', error);
      Alert.alert('Error', 'Failed to check permissions.');
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>VitaMom</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.infoButton} onPress={onInfoPress}>
            <Text style={styles.infoIcon}>ℹ️</Text>
          </TouchableOpacity>
          {isAuthenticated && (
            <TouchableOpacity style={styles.profileButton} onPress={onProfilePress}>
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.settingsButton} onPress={onSettingsPress}>
            <Text style={styles.settingsIcon}>🔧</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome, {userName}</Text>
        <Text style={styles.tagline}>
          {userTrimester === 'not_pregnant' 
            ? 'Supporting your health journey, every day.'
            : `Nurturing you and your baby, every day.`
          }
        </Text>
        {userTrimester !== 'not_pregnant' && (
          <View style={styles.trimesterBadge}>
            <Text style={styles.trimesterIcon}>
              {userTrimester === 'first' ? '🌱' : 
               userTrimester === 'second' ? '🌿' : '🌳'}
            </Text>
            <Text style={styles.trimesterText}>
              {userTrimester === 'first' ? 'First Trimester' : 
               userTrimester === 'second' ? 'Second Trimester' : 'Third Trimester'}
            </Text>
          </View>
        )}
      </View>

      {/* Main Action Card */}
      <View style={styles.actionCard}>
        {/* Top Heart Icon */}
        <View style={styles.topHeartContainer}>
          <Text style={styles.heartIcon}>💖</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.scanButton} onPress={onScanPress}>
            <Text style={styles.scanButtonIcon}>📱</Text>
            <Text style={styles.scanButtonText}>Scan Ingredients</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.trackerButton} onPress={onTrackerPress}>
            <Text style={styles.trackerButtonIcon}>📅</Text>
            <Text style={styles.trackerButtonText}>Daily Tracker</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Heart Icon */}
        <View style={styles.bottomHeartContainer}>
          <Text style={styles.heartIcon}>💖</Text>
        </View>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E91E63',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  infoIcon: {
    fontSize: 20,
  },
  profileButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  profileIcon: {
    fontSize: 20,
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 60,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E91E63',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#FF69B4',
    textAlign: 'center',
    marginBottom: 12,
  },
  trimesterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  trimesterIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  trimesterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E91E63',
  },
  actionCard: {
    backgroundColor: '#FFE4E1',
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ffffff',
    paddingVertical: 40,
    paddingHorizontal: 30,
    alignItems: 'center',
    shadowColor: '#FF69B4',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  topHeartContainer: {
    marginBottom: 20,
  },
  bottomHeartContainer: {
    marginTop: 20,
  },
  heartIcon: {
    fontSize: 20,
  },
  actionButtons: {
    width: '100%',
  },
  scanButton: {
    backgroundColor: '#FF69B4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#FF69B4',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  scanButtonIcon: {
    fontSize: 20,
    marginRight: 12,
    color: '#ffffff',
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  trackerButton: {
    backgroundColor: '#FFB6C1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#FF69B4',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  trackerButtonIcon: {
    fontSize: 20,
    marginRight: 12,
    color: '#E91E63',
  },
  trackerButtonText: {
    color: '#E91E63',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default HomeScreen;
