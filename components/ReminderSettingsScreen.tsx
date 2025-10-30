import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { notificationService, ReminderSettings } from '../services/notificationService';
import { UserProfile } from '../services/supabase';

interface ReminderSettingsScreenProps {
  onBack: () => void;
  userProfile?: UserProfile | null;
  onSaveSettings?: (settings: ReminderSettings) => void;
}

const ReminderSettingsScreen: React.FC<ReminderSettingsScreenProps> = ({
  onBack,
  userProfile,
  onSaveSettings,
}) => {
  const [settings, setSettings] = useState<ReminderSettings>(notificationService.getDefaultSettings());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const granted = await notificationService.requestPermissions();
    setPermissionsGranted(granted);
    
    if (!granted) {
      Alert.alert(
        'Notification Permissions Required',
        'VitaMom needs notification permissions to send you daily vitamin reminders. Please enable notifications in your device settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleTimeChange = (hours: number, minutes: number) => {
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    setSettings({ ...settings, time: timeString });
    setShowTimePicker(false);
  };

  const handleSave = async () => {
    if (!permissionsGranted) {
      Alert.alert(
        'Permissions Required',
        'Please enable notification permissions to set up reminders.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      // Schedule the reminder
      const notificationId = await notificationService.scheduleDailyReminder(settings, userProfile || undefined);
      
      if (notificationId) {
        Alert.alert(
          'Reminder Set!',
          `Daily vitamin reminders will be sent at ${formatTime(settings.time)}. You can change this anytime.`,
          [{ text: 'OK' }]
        );
        
        // Save settings to parent component
        if (onSaveSettings) {
          onSaveSettings(settings);
        }
      } else {
        Alert.alert(
          'Error',
          'Failed to set up reminder. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error saving reminder settings:', error);
      Alert.alert(
        'Error',
        'Failed to save reminder settings. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTestReminder = async () => {
    if (!permissionsGranted) {
      Alert.alert(
        'Permissions Required',
        'Please enable notification permissions to test reminders.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Schedule a test notification in 5 seconds
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🧪 Test Reminder",
          body: "This is a test of your vitamin reminder!",
          data: { type: 'test' },
        },
        trigger: { type: 'timeInterval', seconds: 5 } as any,
      });
      
      Alert.alert(
        'Test Reminder Sent!',
        'You should receive a test notification in 5 seconds.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to send test reminder. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = formatTime(timeString);
        options.push({ timeString, displayTime, hour, minute });
      }
    }
    return options;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reminder Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Permission Status */}
        <View style={styles.permissionCard}>
          <View style={styles.permissionHeader}>
            <Text style={styles.permissionIcon}>
              {permissionsGranted ? '✅' : '⚠️'}
            </Text>
            <Text style={styles.permissionTitle}>
              {permissionsGranted ? 'Notifications Enabled' : 'Permissions Required'}
            </Text>
          </View>
          <Text style={styles.permissionText}>
            {permissionsGranted 
              ? 'You\'ll receive daily vitamin reminders'
              : 'Enable notifications to receive daily reminders'
            }
          </Text>
          {!permissionsGranted && (
            <TouchableOpacity style={styles.permissionButton} onPress={checkPermissions}>
              <Text style={styles.permissionButtonText}>Enable Notifications</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Reminder Settings */}
        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Daily Reminder</Text>
          
          {/* Enable/Disable Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Daily Reminders</Text>
              <Text style={styles.settingDescription}>
                Get reminded to take your vitamins every day
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => setSettings({ ...settings, enabled: value })}
              trackColor={{ false: '#E0E0E0', true: '#FF69B4' }}
              thumbColor={settings.enabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          {/* Time Picker */}
          {settings.enabled && (
            <>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Reminder Time</Text>
                  <Text style={styles.settingDescription}>
                    When would you like to be reminded?
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.timeButtonText}>
                    {formatTime(settings.time)}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Trimester-Specific Toggle */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Trimester-Specific Messages</Text>
                  <Text style={styles.settingDescription}>
                    Get personalized messages based on your pregnancy stage
                  </Text>
                </View>
                <Switch
                  value={settings.trimesterSpecific}
                  onValueChange={(value) => setSettings({ ...settings, trimesterSpecific: value })}
                  trackColor={{ false: '#E0E0E0', true: '#FF69B4' }}
                  thumbColor={settings.trimesterSpecific ? '#ffffff' : '#f4f3f4'}
                />
              </View>
            </>
          )}
        </View>

        {/* Preview Message */}
        {settings.enabled && (
          <View style={styles.previewCard}>
            <Text style={styles.sectionTitle}>Preview Message</Text>
            <View style={styles.messagePreview}>
              <Text style={styles.messageTitle}>💊 Time for your vitamins!</Text>
              <Text style={styles.messageText}>
                {settings.trimesterSpecific 
                  ? notificationService.getPersonalizedMessage(userProfile || undefined)
                  : settings.message
                }
              </Text>
            </View>
          </View>
        )}

        {/* Test Button */}
        {settings.enabled && permissionsGranted && (
          <TouchableOpacity style={styles.testButton} onPress={handleTestReminder}>
            <Text style={styles.testButtonText}>Send Test Reminder</Text>
          </TouchableOpacity>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Reminder Settings</Text>
          )}
        </TouchableOpacity>

        {/* Help Text */}
        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>💡 Tips for Success</Text>
          <Text style={styles.helpText}>
            • Set your reminder for a time when you're usually home{'\n'}
            • Take vitamins with food to reduce nausea{'\n'}
            • Keep vitamins in a visible place{'\n'}
            • Set a backup reminder if you often miss the first one
          </Text>
        </View>
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timePickerModal}>
            <Text style={styles.modalTitle}>Select Reminder Time</Text>
            <ScrollView style={styles.timeOptionsContainer}>
              {getTimeOptions().map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.timeOption,
                    settings.time === option.timeString && styles.selectedTimeOption
                  ]}
                  onPress={() => handleTimeChange(option.hour, option.minute)}
                >
                  <Text style={[
                    styles.timeOptionText,
                    settings.time === option.timeString && styles.selectedTimeOptionText
                  ]}>
                    {option.displayTime}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  permissionCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  permissionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  permissionButton: {
    backgroundColor: '#FF69B4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E91E63',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  timeButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timeButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  previewCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messagePreview: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF69B4',
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  testButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#FF69B4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#FFB6C1',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  helpCard: {
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E5BBA',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#2E5BBA',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerModal: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E91E63',
    textAlign: 'center',
    marginBottom: 16,
  },
  timeOptionsContainer: {
    maxHeight: 300,
  },
  timeOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedTimeOption: {
    backgroundColor: '#FF69B4',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  selectedTimeOptionText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
});

export default ReminderSettingsScreen;