import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { UserProfile } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }) as any,
});

export interface ReminderSettings {
  enabled: boolean;
  time: string; // Format: "HH:MM" (24-hour)
  message: string;
  trimesterSpecific: boolean;
}

export const notificationService = {
  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    try {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.log('Notification permissions not granted');
          return false;
        }
        
        // Configure notification channel for Android
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('vitamin-reminders', {
            name: 'Vitamin Reminders',
            description: 'Daily reminders to take your vitamins',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF69B4',
          });
        }
        
        return true;
      } else {
        console.log('Must use physical device for notifications');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  },

  // Schedule daily vitamin reminder
  async scheduleDailyReminder(settings: ReminderSettings, userProfile?: UserProfile): Promise<string | null> {
    try {
      // Cancel existing reminders first
      await this.cancelAllReminders();
      
      if (!settings.enabled) {
        return null;
      }

      const [hours, minutes] = settings.time.split(':').map(Number);
      
      // Create personalized message
      let message = settings.message;
      if (settings.trimesterSpecific && userProfile?.trimester && userProfile.trimester !== 'not_pregnant') {
        const trimesterMessages = {
          first: "🌱 First trimester: Focus on folic acid and iron!",
          second: "🌿 Second trimester: Keep up with calcium and vitamin D!",
          third: "🌳 Third trimester: Maintain your vitamin routine for baby's final growth!"
        };
        message = `${settings.message}\n\n${trimesterMessages[userProfile.trimester]}`;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "💊 Time for your vitamins!",
          body: message,
          data: { type: 'vitamin_reminder' },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });

      console.log('Daily reminder scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      return null;
    }
  },

  // Cancel all scheduled reminders
  async cancelAllReminders(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All reminders cancelled');
    } catch (error) {
      console.error('Error cancelling reminders:', error);
    }
  },

  // Get scheduled notifications
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  },

  // Create default reminder settings
  getDefaultSettings(): ReminderSettings {
    return {
      enabled: true,
      time: '09:00',
      message: "Don't forget to take your prenatal vitamins! Your health and your baby's development depend on it. 💕",
      trimesterSpecific: true,
    };
  },

  // Get personalized reminder message based on user profile
  getPersonalizedMessage(userProfile?: UserProfile): string {
    if (!userProfile) {
      return "Don't forget to take your vitamins!";
    }

    const name = userProfile.name || 'there';
    const trimester = userProfile.trimester;
    
    if (trimester === 'not_pregnant') {
      return `Hi ${name}! Time for your daily vitamins to keep you healthy and strong! 💪`;
    }
    
    const trimesterMessages = {
      first: `Hi ${name}! Your first trimester vitamins are crucial for your baby's neural tube development. Take them with a light snack! 🌱`,
      second: `Hi ${name}! Second trimester vitamins support your baby's bone and brain development. You're doing great! 🌿`,
      third: `Hi ${name}! Final trimester - your vitamins are preparing both you and baby for birth. Almost there! 🌳`
    };
    
    return trimesterMessages[trimester] || trimesterMessages.first;
  },

  // Handle notification response (when user taps notification)
  addNotificationResponseListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  // Handle notification received (when app is in foreground)
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }
};
