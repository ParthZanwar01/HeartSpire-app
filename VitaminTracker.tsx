import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  useColorScheme,
  Switch,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import {Colors} from 'react-native/Libraries/NewAppScreen';
// import notifee, {TimestampTrigger, TriggerType, AndroidImportance} from '@notifee/react-native';
// import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';

// NOTE: This file is not currently used. The app uses ModernVitaminTracker.tsx instead.
// These imports are commented out because the packages are not installed.
// Adding stub definitions to avoid TypeScript errors:

const Colors = {
  white: '#FFFFFF',
  black: '#000000',
  light: '#999999',
  dark: '#333333',
  darker: '#111111',
  lighter: '#F8F8F8',
};

const notifee = {
  createChannel: async (_config: any) => {},
  cancelAllNotifications: async () => {},
  createTriggerNotification: async (_notification: any, _trigger: any) => {},
};

const AndroidImportance = {
  DEFAULT: 'default',
  HIGH: 'high',
};

const TriggerType = {
  TIMESTAMP: 0,
};

type TimestampTrigger = {
  type: number;
  timestamp: number;
  repeatFrequency?: string;
};

const PERMISSIONS = {
  IOS: { NOTIFICATIONS: 'ios.permission.NOTIFICATIONS' },
  ANDROID: { POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS' },
};

const RESULTS = {
  GRANTED: 'granted',
};

const request = async (_permission: string) => RESULTS.GRANTED;

interface Vitamin {
  id: string;
  name: string;
  dosage: string;
  category: string;
}

interface VitaminLog {
  date: string;
  vitamins: string[];
}

interface NotificationSettings {
  enabled: boolean;
  time: string; // Format: "HH:MM"
}

const COMMON_VITAMINS: Vitamin[] = [
  {id: '1', name: 'Prenatal Multivitamin', dosage: '1 tablet', category: 'Essential'},
  {id: '2', name: 'Folic Acid', dosage: '400-800 mcg', category: 'Essential'},
  {id: '3', name: 'Iron', dosage: '27 mg', category: 'Essential'},
  {id: '4', name: 'Calcium', dosage: '1000 mg', category: 'Essential'},
  {id: '5', name: 'Vitamin D3', dosage: '600-800 IU', category: 'Essential'},
  {id: '6', name: 'Omega-3 (DHA)', dosage: '200-300 mg', category: 'Essential'},
  {id: '7', name: 'Vitamin B12', dosage: '2.6 mcg', category: 'B-Complex'},
  {id: '8', name: 'Vitamin B6', dosage: '1.9 mg', category: 'B-Complex'},
  {id: '9', name: 'Vitamin C', dosage: '85 mg', category: 'Antioxidant'},
  {id: '10', name: 'Vitamin E', dosage: '15 mg', category: 'Antioxidant'},
  {id: '11', name: 'Magnesium', dosage: '350 mg', category: 'Mineral'},
  {id: '12', name: 'Zinc', dosage: '11 mg', category: 'Mineral'},
];

const STORAGE_KEY = '@vitamin_log';
const NOTIFICATION_SETTINGS_KEY = '@notification_settings';
const NOTIFICATION_CHANNEL_ID = 'vitamin-reminders';

const VitaminTracker = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [vitamins, setVitamins] = useState<Vitamin[]>(COMMON_VITAMINS);
  const [checkedToday, setCheckedToday] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<VitaminLog[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVitaminName, setNewVitaminName] = useState('');
  const [newVitaminDosage, setNewVitaminDosage] = useState('');
  const [currentTab, setCurrentTab] = useState<'today' | 'history' | 'settings'>('today');
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState('09:00');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempHour, setTempHour] = useState('09');
  const [tempMinute, setTempMinute] = useState('00');

  useEffect(() => {
    loadData();
    setupNotifications();
  }, []);

  useEffect(() => {
    if (notificationEnabled) {
      scheduleNotification();
    } else {
      cancelNotification();
    }
  }, [notificationEnabled, notificationTime]);

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const loadData = async () => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const data: VitaminLog[] = JSON.parse(storedData);
        setHistory(data);
        
        const today = getTodayDate();
        const todayLog = data.find(log => log.date === today);
        if (todayLog) {
          setCheckedToday(new Set(todayLog.vitamins));
        }
      }

      const customVitamins = await AsyncStorage.getItem('@custom_vitamins');
      if (customVitamins) {
        const custom: Vitamin[] = JSON.parse(customVitamins);
        setVitamins([...COMMON_VITAMINS, ...custom]);
      }

      const notifSettings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (notifSettings) {
        const settings: NotificationSettings = JSON.parse(notifSettings);
        setNotificationEnabled(settings.enabled);
        setNotificationTime(settings.time);
        const [hour, minute] = settings.time.split(':');
        setTempHour(hour);
        setTempMinute(minute);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveData = async (newChecked: Set<string>) => {
    try {
      const today = getTodayDate();
      const updatedHistory = history.filter(log => log.date !== today);
      
      if (newChecked.size > 0) {
        updatedHistory.push({
          date: today,
          vitamins: Array.from(newChecked),
        });
      }
      
      updatedHistory.sort((a, b) => b.date.localeCompare(a.date));
      setHistory(updatedHistory);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const toggleVitamin = (vitaminId: string) => {
    const newChecked = new Set(checkedToday);
    if (newChecked.has(vitaminId)) {
      newChecked.delete(vitaminId);
    } else {
      newChecked.add(vitaminId);
    }
    setCheckedToday(newChecked);
    saveData(newChecked);
  };

  const addCustomVitamin = async () => {
    if (!newVitaminName.trim()) {
      Alert.alert('Error', 'Please enter a vitamin name');
      return;
    }

    const newVitamin: Vitamin = {
      id: `custom_${Date.now()}`,
      name: newVitaminName.trim(),
      dosage: newVitaminDosage.trim() || 'Custom',
      category: 'Custom',
    };

    const updatedVitamins = [...vitamins, newVitamin];
    setVitamins(updatedVitamins);

    const customVitamins = updatedVitamins.filter(v => v.category === 'Custom');
    await AsyncStorage.setItem('@custom_vitamins', JSON.stringify(customVitamins));

    setNewVitaminName('');
    setNewVitaminDosage('');
    setShowAddForm(false);
  };

  const getVitaminName = (vitaminId: string) => {
    return vitamins.find(v => v.id === vitaminId)?.name || 'Unknown';
  };

  const setupNotifications = async () => {
    try {
      // Create notification channel for Android
      await notifee.createChannel({
        id: NOTIFICATION_CHANNEL_ID,
        name: 'Vitamin Reminders',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      });
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'ios') {
        const result = await request(PERMISSIONS.IOS.NOTIFICATIONS);
        return result === RESULTS.GRANTED;
      } else if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const result = await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
          return result === RESULTS.GRANTED;
        }
        return true; // Android < 13 doesn't need runtime permission
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const scheduleNotification = async () => {
    try {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive vitamin reminders.',
        );
        setNotificationEnabled(false);
        return;
      }

      // Cancel existing notifications
      await notifee.cancelAllNotifications();

      // Parse time
      const [hours, minutes] = notificationTime.split(':').map(Number);
      
      // Create date for notification
      const now = new Date();
      const notificationDate = new Date();
      notificationDate.setHours(hours, minutes, 0, 0);
      
      // If time has passed today, schedule for tomorrow
      if (notificationDate <= now) {
        notificationDate.setDate(notificationDate.getDate() + 1);
      }

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: notificationDate.getTime(),
        repeatFrequency: 'daily',
      };

      await notifee.createTriggerNotification(
        {
          title: '💊 Time for Your Vitamins!',
          body: 'Don\'t forget to take your daily vitamins. Your health matters!',
          android: {
            channelId: NOTIFICATION_CHANNEL_ID,
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'default',
            },
          },
          ios: {
            sound: 'default',
            interruptionLevel: 'timeSensitive',
          },
        },
        trigger,
      );

      console.log('Notification scheduled for:', notificationDate.toLocaleString());
    } catch (error) {
      console.error('Error scheduling notification:', error);
      Alert.alert('Error', 'Failed to schedule notification. Please try again.');
    }
  };

  const cancelNotification = async () => {
    try {
      await notifee.cancelAllNotifications();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    setNotificationEnabled(value);
    const settings: NotificationSettings = {
      enabled: value,
      time: notificationTime,
    };
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  };

  const saveNotificationTime = async () => {
    const newTime = `${tempHour}:${tempMinute}`;
    setNotificationTime(newTime);
    setShowTimePicker(false);
    
    const settings: NotificationSettings = {
      enabled: notificationEnabled,
      time: newTime,
    };
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    
    if (notificationEnabled) {
      await scheduleNotification();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getTodayProgress = () => {
    const total = vitamins.length;
    const completed = checkedToday.size;
    return {completed, total, percentage: Math.round((completed / total) * 100)};
  };

  const progress = getTodayProgress();

  const textColor = isDarkMode ? Colors.white : Colors.black;
  const cardBg = isDarkMode ? '#1a1a1a' : '#ffffff';
  const secondaryBg = isDarkMode ? '#2a2a2a' : '#f5f5f5';

  return (
    <ScrollView style={[styles.container, {backgroundColor: isDarkMode ? Colors.darker : Colors.lighter}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, {color: textColor}]}>Daily Vitamin Tracker</Text>
        <Text style={[styles.subtitle, {color: isDarkMode ? Colors.light : Colors.dark}]}>
          Stay healthy, one vitamin at a time
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, {backgroundColor: secondaryBg}]}>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'today' && styles.activeTab]}
          onPress={() => setCurrentTab('today')}>
          <Text style={[styles.tabText, currentTab === 'today' && styles.activeTabText]}>
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'history' && styles.activeTab]}
          onPress={() => setCurrentTab('history')}>
          <Text style={[styles.tabText, currentTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'settings' && styles.activeTab]}
          onPress={() => setCurrentTab('settings')}>
          <Text style={[styles.tabText, currentTab === 'settings' && styles.activeTabText]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {currentTab === 'settings' ? (
        // Settings Tab
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: textColor}]}>Notification Settings</Text>
          
          <View style={[styles.settingsCard, {backgroundColor: cardBg}]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, {color: textColor}]}>Daily Reminders</Text>
                <Text style={[styles.settingDescription, {color: isDarkMode ? Colors.light : Colors.dark}]}>
                  Get notified every day to take your vitamins
                </Text>
              </View>
              <Switch
                value={notificationEnabled}
                onValueChange={toggleNotifications}
                trackColor={{false: '#767577', true: '#E91E63'}}
                thumbColor={notificationEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>

            {notificationEnabled && (
              <>
                <View style={styles.settingDivider} />
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, {color: textColor}]}>Reminder Time</Text>
                    <Text style={[styles.settingDescription, {color: isDarkMode ? Colors.light : Colors.dark}]}>
                      {formatTime(notificationTime)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changeTimeButton}
                    onPress={() => setShowTimePicker(!showTimePicker)}>
                    <Text style={styles.changeTimeButtonText}>Change</Text>
                  </TouchableOpacity>
                </View>

                {showTimePicker && (
                  <View style={styles.timePicker}>
                    <Text style={[styles.timePickerLabel, {color: textColor}]}>Set Time</Text>
                    <View style={styles.timePickerInputs}>
                      <TextInput
                        style={[styles.timeInput, {color: textColor, borderColor: isDarkMode ? '#444' : '#ddd'}]}
                        value={tempHour}
                        onChangeText={(text) => {
                          const num = parseInt(text) || 0;
                          if (num >= 0 && num <= 23) {
                            setTempHour(text.padStart(2, '0'));
                          }
                        }}
                        keyboardType="number-pad"
                        maxLength={2}
                        placeholder="HH"
                        placeholderTextColor={isDarkMode ? '#666' : '#999'}
                      />
                      <Text style={[styles.timeSeparator, {color: textColor}]}>:</Text>
                      <TextInput
                        style={[styles.timeInput, {color: textColor, borderColor: isDarkMode ? '#444' : '#ddd'}]}
                        value={tempMinute}
                        onChangeText={(text) => {
                          const num = parseInt(text) || 0;
                          if (num >= 0 && num <= 59) {
                            setTempMinute(text.padStart(2, '0'));
                          }
                        }}
                        keyboardType="number-pad"
                        maxLength={2}
                        placeholder="MM"
                        placeholderTextColor={isDarkMode ? '#666' : '#999'}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.saveTimeButton}
                      onPress={saveNotificationTime}>
                      <Text style={styles.saveTimeButtonText}>Save Time</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>

          <View style={[styles.infoCard, {backgroundColor: '#E3F2FD'}]}>
            <Text style={styles.infoTitle}>💡 Tip</Text>
            <Text style={styles.infoText}>
              Set your reminder for a time when you typically have breakfast or your morning routine.
              Consistency helps build healthy habits!
            </Text>
          </View>
        </View>
      ) : currentTab === 'today' ? (
        <>
          {/* Progress Card */}
          <View style={[styles.progressCard, {backgroundColor: cardBg}]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, {color: textColor}]}>Today's Progress</Text>
              <Text style={[styles.progressPercentage, {color: '#4CAF50'}]}>
                {progress.percentage}%
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, {width: `${progress.percentage}%`}]} />
            </View>
            <Text style={[styles.progressText, {color: isDarkMode ? Colors.light : Colors.dark}]}>
              {progress.completed} of {progress.total} vitamins taken
            </Text>
          </View>

          {/* Vitamin List */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: textColor}]}>Your Vitamins</Text>
            
            {['Essential', 'B-Complex', 'Antioxidant', 'Mineral', 'Custom'].map(category => {
              const categoryVitamins = vitamins.filter(v => v.category === category);
              if (categoryVitamins.length === 0) return null;

              return (
                <View key={category}>
                  <Text style={[styles.categoryTitle, {color: isDarkMode ? '#aaa' : '#666'}]}>
                    {category}
                  </Text>
                  {categoryVitamins.map(vitamin => (
                    <TouchableOpacity
                      key={vitamin.id}
                      style={[
                        styles.vitaminCard,
                        {backgroundColor: cardBg},
                        checkedToday.has(vitamin.id) && styles.vitaminCardChecked,
                      ]}
                      onPress={() => toggleVitamin(vitamin.id)}>
                      <View style={styles.checkboxContainer}>
                        <View
                          style={[
                            styles.checkbox,
                            checkedToday.has(vitamin.id) && styles.checkboxChecked,
                          ]}>
                          {checkedToday.has(vitamin.id) && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.vitaminInfo}>
                        <Text
                          style={[
                            styles.vitaminName,
                            {color: textColor},
                            checkedToday.has(vitamin.id) && styles.vitaminNameChecked,
                          ]}>
                          {vitamin.name}
                        </Text>
                        <Text style={[styles.vitaminDosage, {color: isDarkMode ? Colors.light : Colors.dark}]}>
                          {vitamin.dosage}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })}
          </View>

          {/* Add Custom Vitamin */}
          {!showAddForm ? (
            <TouchableOpacity
              style={[styles.addButton, {backgroundColor: '#E91E63'}]}
              onPress={() => setShowAddForm(true)}>
              <Text style={styles.addButtonText}>+ Add Custom Vitamin</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.addForm, {backgroundColor: cardBg}]}>
              <Text style={[styles.formTitle, {color: textColor}]}>Add Custom Vitamin</Text>
              <TextInput
                style={[styles.input, {color: textColor, borderColor: isDarkMode ? '#444' : '#ddd'}]}
                placeholder="Vitamin name"
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                value={newVitaminName}
                onChangeText={setNewVitaminName}
              />
              <TextInput
                style={[styles.input, {color: textColor, borderColor: isDarkMode ? '#444' : '#ddd'}]}
                placeholder="Dosage (optional)"
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                value={newVitaminDosage}
                onChangeText={setNewVitaminDosage}
              />
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={() => {
                    setShowAddForm(false);
                    setNewVitaminName('');
                    setNewVitaminDosage('');
                  }}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formButton, styles.saveButton]}
                  onPress={addCustomVitamin}>
                  <Text style={styles.saveButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      ) : (
        // History Tab
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: textColor}]}>History</Text>
          {history.length === 0 ? (
            <View style={[styles.emptyState, {backgroundColor: cardBg}]}>
              <Text style={[styles.emptyStateText, {color: isDarkMode ? Colors.light : Colors.dark}]}>
                No history yet. Start tracking your vitamins today!
              </Text>
            </View>
          ) : (
            history.map(log => (
              <View key={log.date} style={[styles.historyCard, {backgroundColor: cardBg}]}>
                <View style={styles.historyHeader}>
                  <Text style={[styles.historyDate, {color: textColor}]}>
                    {formatDate(log.date)}
                  </Text>
                  <Text style={[styles.historyCount, {color: '#4CAF50'}]}>
                    {log.vitamins.length} vitamins
                  </Text>
                </View>
                <View style={styles.historyVitamins}>
                  {log.vitamins.map((vitaminId, index) => (
                    <Text
                      key={index}
                      style={[styles.historyVitaminName, {color: isDarkMode ? Colors.light : Colors.dark}]}>
                      • {getVitaminName(vitaminId)}
                    </Text>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#E91E63',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  progressCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  vitaminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  vitaminCardChecked: {
    backgroundColor: '#E8F5E9',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  vitaminInfo: {
    flex: 1,
  },
  vitaminName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  vitaminNameChecked: {
    color: '#2E7D32',
  },
  vitaminDosage: {
    fontSize: 14,
  },
  addButton: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addForm: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  formButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#E91E63',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historyCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyVitamins: {
    gap: 4,
  },
  historyVitaminName: {
    fontSize: 14,
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  settingsCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  changeTimeButton: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changeTimeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  timePicker: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  timePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  timePickerInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  timeInput: {
    width: 60,
    height: 50,
    borderWidth: 2,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
  },
  timeSeparator: {
    fontSize: 32,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  saveTimeButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveTimeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
});

export default VitaminTracker;

