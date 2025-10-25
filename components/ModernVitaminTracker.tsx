import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CalendarView from './CalendarView';
import { UserProfile } from '../services/supabase';

interface ModernVitaminTrackerProps {
  onBack: () => void;
  userProfile?: UserProfile | null;
}

interface VitaminLog {
  date: string;
  vitamins: string[];
  scannedProduct?: string;
  scannedData?: Array<{
    name: string;
    amount?: string;
    unit?: string;
    percentDailyValue?: string;
    description?: string;
  }>;
}

const ModernVitaminTracker: React.FC<ModernVitaminTrackerProps> = ({onBack, userProfile}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [vitaminLogs, setVitaminLogs] = useState<VitaminLog[]>([]);
  const [recentIntake, setRecentIntake] = useState<VitaminLog[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('@vitamin_log');
      if (storedData) {
        const data: VitaminLog[] = JSON.parse(storedData);
        setVitaminLogs(data);
        
        // Get recent intake (last 3 entries)
        const sortedData = data.sort((a, b) => b.date.localeCompare(a.date));
        setRecentIntake(sortedData.slice(0, 3));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const getMarkedDates = (): Date[] => {
    return vitaminLogs
      .filter(log => log.vitamins.length > 0)
      .map(log => new Date(log.date));
  };

  const markAsTaken = async () => {
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      
      // Check if log already exists for this date
      const existingLogIndex = vitaminLogs.findIndex(log => log.date === dateString);
      
      let updatedLogs;
      if (existingLogIndex >= 0) {
        // Update existing log
        updatedLogs = [...vitaminLogs];
        updatedLogs[existingLogIndex] = {
          date: dateString,
          vitamins: ['Prenatal Vitamins', 'Folic Acid', 'Iron', 'Vitamin D'],
        };
      } else {
        // Add new log
        updatedLogs = [
          ...vitaminLogs,
          {
            date: dateString,
            vitamins: ['Prenatal Vitamins', 'Folic Acid', 'Iron', 'Vitamin D'],
          },
        ];
      }
      
      setVitaminLogs(updatedLogs);
      await AsyncStorage.setItem('@vitamin_log', JSON.stringify(updatedLogs));
      
      // Update recent intake
      const sortedData = updatedLogs.sort((a, b) => b.date.localeCompare(a.date));
      setRecentIntake(sortedData.slice(0, 3));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Daily Vitamin Tracker</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Calendar */}
        <CalendarView
          onDateSelect={setSelectedDate}
          selectedDate={selectedDate}
          markedDates={getMarkedDates()}
        />

        {/* Log for Today */}
        <View style={styles.logSection}>
          <Text style={styles.sectionTitle}>Log for Today</Text>
          
          {/* Reminder Status */}
          {userProfile?.reminder_enabled && (
            <View style={styles.reminderStatus}>
              <Text style={styles.reminderStatusText}>
                🔔 Daily reminders enabled at {userProfile.reminder_time}
              </Text>
            </View>
          )}
          
          <TouchableOpacity style={styles.markTakenButton} onPress={markAsTaken}>
            <View style={styles.checkmarkContainer}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
            <Text style={styles.markTakenText}>Mark as Taken</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Intake */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Intake</Text>
          {recentIntake.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No recent vitamin intake recorded</Text>
              <Text style={styles.emptySubtext}>Scan a vitamin label to get started!</Text>
            </View>
          ) : (
            recentIntake.map((log, index) => (
              <View key={index} style={styles.intakeCard}>
                <View style={styles.intakeIcon}>
                  <Text style={styles.intakeCheckmark}>✓</Text>
                </View>
                <View style={styles.intakeInfo}>
                  <Text style={styles.intakeTitle}>
                    {log.scannedProduct || 'Vitamins Taken'}
                  </Text>
                  <Text style={styles.intakeDate}>{formatDate(log.date)}</Text>
                  {log.scannedData && log.scannedData.length > 0 && (
                    <Text style={styles.intakeVitamins}>
                      {log.scannedData.length} ingredients: {log.scannedData.slice(0, 3).map(v => v.name).join(', ')}
                      {log.scannedData.length > 3 && ` +${log.scannedData.length - 3} more`}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#E91E63',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  logSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  markTakenButton: {
    backgroundColor: '#FF69B4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#FF69B4',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkmark: {
    color: '#FF69B4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  markTakenText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  recentSection: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for bottom navigation
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9E9E9E',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BDBDBD',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  intakeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  intakeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE4E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  intakeCheckmark: {
    color: '#FF69B4',
    fontSize: 20,
    fontWeight: 'bold',
  },
  intakeInfo: {
    flex: 1,
  },
  intakeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  intakeDate: {
    fontSize: 14,
    color: '#9E9E9E',
    marginBottom: 4,
  },
  intakeVitamins: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  reminderStatus: {
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  reminderStatusText: {
    fontSize: 14,
    color: '#2E5BBA',
    fontWeight: '500',
  },
});

export default ModernVitaminTracker;
