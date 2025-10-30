import React, {useRef, useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ProfilePicturePicker from './ProfilePicturePicker';

interface HomeScreenProps {
  onScanPress: () => void;
  onProfilePress: () => void;
  onSettingsPress: () => void;
  onAddVitaminPress?: () => void; // Add callback for add vitamin button
  userName?: string;
  userTrimester?: 'first' | 'second' | 'third' | 'not_pregnant';
  isAuthenticated?: boolean;
  userProfilePicture?: string;
  onProfilePictureUpdate?: (newPicture: string) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  onScanPress,
  onProfilePress,
  onSettingsPress,
  onAddVitaminPress,
  userName = 'Sarah',
  userTrimester = 'not_pregnant',
  isAuthenticated = false,
  userProfilePicture,
  onProfilePictureUpdate,
}) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const cardAnim1 = useRef(new Animated.Value(0)).current;
  const cardAnim2 = useRef(new Animated.Value(0)).current;
  const cardAnim3 = useRef(new Animated.Value(0)).current;

  // State for vitamin tracking
  const [vitamins, setVitamins] = useState([
    { name: 'Folic Acid', dosage: '800 mcg', taken: true },
    { name: 'Vitamin D3', dosage: '2000 IU', taken: false },
    { name: 'Omega-3 DHA', dosage: '600 mg', taken: true },
    { name: 'Iron Supplement', dosage: '27 mg', taken: false },
  ]);

  // Update vitamins based on trimester
  useEffect(() => {
    let personalizedVitamins = [...vitamins];
    
    // Adjust dosages based on trimester
    if (userTrimester === 'first') {
      personalizedVitamins = personalizedVitamins.map(v => ({
        ...v,
        dosage: v.name === 'Folic Acid' ? '800 mcg' : 
                v.name === 'Iron Supplement' ? '27 mg' : v.dosage
      }));
    } else if (userTrimester === 'second' || userTrimester === 'third') {
      personalizedVitamins = personalizedVitamins.map(v => ({
        ...v,
        dosage: v.name === 'Iron Supplement' ? '30 mg' : v.dosage
      }));
    }
    
    setVitamins(personalizedVitamins);
  }, [userTrimester]);

  const [streakData, setStreakData] = useState({
    daysInRow: 5,
    longestStreak: 12,
  });

  // Calculate streak data based on trimester
  useEffect(() => {
    // For now, we'll use mock data, but this could be connected to real tracking data
    const mockStreakData = {
      daysInRow: Math.floor(Math.random() * 15) + 1, // 1-15 days
      longestStreak: Math.floor(Math.random() * 30) + 10, // 10-40 days
    };
    setStreakData(mockStreakData);
  }, [userTrimester]);

  useEffect(() => {
    // Welcome section animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Stagger card animations
    Animated.stagger(150, [
      Animated.spring(cardAnim1, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(cardAnim2, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(cardAnim3, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const toggleVitamin = (index: number) => {
    setVitamins(prev => prev.map((vitamin, i) => 
      i === index ? { ...vitamin, taken: !vitamin.taken } : vitamin
    ));
  };

  const getProgressPercentage = () => {
    const takenCount = vitamins.filter(v => v.taken).length;
    return takenCount / vitamins.length;
  };

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
        <Text style={styles.headerTitle}>Home</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>💖</Text>
          </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={onProfilePress}>
            {userProfilePicture ? (
              <Image source={{ uri: userProfilePicture }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImage}>
                <Text style={styles.profileIcon}>👩</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <ProfilePicturePicker
            currentProfilePicture={userProfilePicture}
            onProfilePictureUpdate={onProfilePictureUpdate || (() => {})}
            userName={userName}
          />
          <Text style={styles.welcomeText}>
            Welcome{userName && userName !== 'User' ? `, ${userName.split(' ')[0].charAt(0).toUpperCase() + userName.split(' ')[0].slice(1).toLowerCase()}` : ', expecting mother'}!
          </Text>
          <Text style={styles.encouragementText}>
          {userTrimester === 'not_pregnant' 
              ? 'Keep up the great work with your health journey!'
              : `Keep up the great work with your prenatal vitamins${userTrimester ? ` during your ${userTrimester === 'first' ? 'first' : userTrimester === 'second' ? 'second' : 'third'} trimester` : ''}!`
          }
        </Text>
        {userTrimester !== 'not_pregnant' && (
          <View style={styles.trimesterBadge}>
            <View style={styles.trimesterIconContainer}>
            <Text style={styles.trimesterIcon}>
              {userTrimester === 'first' ? '🌱' : 
               userTrimester === 'second' ? '🌿' : '🌳'}
            </Text>
            </View>
            <Text style={styles.trimesterText}>
              {userTrimester === 'first' ? 'First Trimester' : 
               userTrimester === 'second' ? 'Second Trimester' : 'Third Trimester'}
            </Text>
          </View>
        )}
        </View>

        {/* Streak Tracker */}
        <View style={styles.streakSection}>
          <View style={styles.streakCard}>
            <View style={styles.streakColumn}>
              <Text style={styles.streakLabel}>Days in a row</Text>
              <Text style={styles.streakNumber}>{streakData.daysInRow}</Text>
            </View>
            <View style={styles.streakColumn}>
              <Text style={styles.streakLabel}>Longest streak</Text>
              <Text style={styles.streakNumber}>{streakData.longestStreak}</Text>
            </View>
          </View>
        </View>

        {/* Daily Vitamin Intake */}
        <View style={styles.vitaminSection}>
          <View style={styles.vitaminHeader}>
            <Text style={styles.vitaminTitle}>Daily Vitamin Intake</Text>
            <View style={styles.checkmarkIcon}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          </View>
          
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${getProgressPercentage() * 100}%` }
              ]} 
            />
          </View>
      </View>

          <View style={styles.vitaminList}>
            {vitamins.map((vitamin, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.vitaminItem}
                onPress={() => toggleVitamin(index)}
              >
                <View style={styles.vitaminLeft}>
                  <View style={[
                    styles.checkbox, 
                    vitamin.taken && styles.checkboxChecked
                  ]}>
                    {vitamin.taken && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
                  <View style={styles.vitaminInfo}>
                    <Text style={styles.vitaminName}>{vitamin.name}</Text>
                    <Text style={styles.vitaminDosage}>{vitamin.dosage}</Text>
            </View>
              </View>
                {vitamin.taken && (
                  <View style={styles.vitaminCheckmark}>
                    <Text style={styles.vitaminCheckmarkText}>✓</Text>
            </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.addVitaminButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => {
              console.log('Add new vitamin pressed');
              if (onAddVitaminPress) {
                onAddVitaminPress();
              } else {
                Alert.alert('Navigation Error', 'Unable to navigate. Please try again.');
              }
            }}
          >
            <Text style={styles.addVitaminIcon}>+</Text>
            <Text style={styles.addVitaminText}>Add New Vitamin</Text>
          </TouchableOpacity>
        </View>

        {/* Nutrition Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Nutrition Tips</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tipsScroll}>
            <View style={styles.tipCard}>
              <View style={styles.tipImageContainer}>
                <Text style={styles.tipEmoji}>🍃</Text>
                <Text style={styles.tipHearts}>💕💕💕</Text>
              </View>
              <Text style={styles.tipTitle}>Importance of Folic Acid</Text>
              <Text style={styles.tipDescription}>Folic acid is crucial for preventing neural tube defects in early</Text>
              <TouchableOpacity 
                style={styles.readMoreButton}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => {
                  Alert.alert(
                    'Importance of Folic Acid',
                    'Folic acid is crucial for preventing neural tube defects in early pregnancy. Neural tube defects are serious birth defects that affect the brain and spinal cord, and they occur in the first 28 days of pregnancy—often before a woman even knows she\'s pregnant.\n\n' +
                    'Key Benefits:\n' +
                    '• Prevents neural tube defects like spina bifida\n' +
                    '• Supports rapid cell growth during pregnancy\n' +
                    '• Helps form baby\'s brain and spinal cord\n' +
                    '• Reduces risk of premature birth\n\n' +
                    'Recommended Dosage:\n' +
                    '• 600-800 mcg daily for pregnant women\n' +
                    '• Start taking before conception if possible\n' +
                    '• Continue throughout pregnancy',
                    [{ text: 'Got it!', style: 'default' }]
                  );
                }}
              >
                <Text style={styles.readMoreText}>Read More</Text>
              </TouchableOpacity>
        </View>
        
            <View style={[styles.tipCard, styles.tipCardYellow]}>
              <View style={styles.tipImageContainer}>
                <Text style={styles.tipEmoji}>☀️</Text>
              </View>
              <Text style={styles.tipTitle}>Vitamin D3</Text>
              <Text style={styles.tipDescription}>Discover bone health benefits</Text>
              <TouchableOpacity 
                style={styles.readMoreButton}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => {
                  Alert.alert(
                    'Vitamin D3 Benefits',
                    'Vitamin D3 plays a crucial role in bone health and immune function for both you and your developing baby.\n\n' +
                    'Key Benefits:\n' +
                    '• Helps baby develop strong bones and teeth\n' +
                    '• Supports calcium absorption\n' +
                    '• Boosts immune system function\n' +
                    '• May reduce risk of preeclampsia\n' +
                    '• Supports healthy fetal growth\n\n' +
                    'Recommended Dosage:\n' +
                    '• 600-2000 IU daily during pregnancy\n' +
                    '• Especially important in winter months\n' +
                    '• Consult your doctor for optimal dosage',
                    [{ text: 'Got it!', style: 'default' }]
                  );
                }}
              >
                <Text style={styles.readMoreText}>Read More</Text>
              </TouchableOpacity>
          </View>
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E91E63',
    textAlign: 'center',
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 20,
  },
  notificationButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  notificationIcon: {
    fontSize: 20,
  },
  profileButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E91E63',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  encouragementText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 12,
  },
  trimesterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  trimesterIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(233, 30, 99, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  trimesterIcon: {
    fontSize: 18,
  },
  trimesterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E91E63',
  },
  streakSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  streakCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  streakColumn: {
    alignItems: 'center',
  },
  streakLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#E91E63',
  },
  vitaminSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vitaminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  vitaminTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  checkmarkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E91E63',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E91E63',
    borderRadius: 4,
  },
  vitaminList: {
    marginBottom: 16,
  },
  vitaminItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  vitaminLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#E91E63',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#E91E63',
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  vitaminInfo: {
    flex: 1,
  },
  vitaminName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  vitaminDosage: {
    fontSize: 14,
    color: '#666666',
  },
  vitaminCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E91E63',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitaminCheckmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addVitaminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E91E63',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addVitaminIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  addVitaminText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  tipsScroll: {
    paddingRight: 20,
  },
  tipCard: {
    width: 280,
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
  },
  tipCardYellow: {
    backgroundColor: '#FFF8E1',
  },
  tipImageContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  tipEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  tipHearts: {
    fontSize: 16,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  tipDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
  },
  readMoreButton: {
    backgroundColor: '#E91E63',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HomeScreen;
