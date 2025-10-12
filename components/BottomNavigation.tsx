import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

interface BottomNavigationProps {
  activeTab: 'home' | 'scan' | 'tracker';
  onTabChange: (tab: 'home' | 'scan' | 'tracker') => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabChange('home')}>
        <View style={[styles.iconContainer, activeTab === 'home' && styles.activeIconContainer]}>
          <Text style={[styles.icon, activeTab === 'home' && styles.activeIcon]}>🏠</Text>
        </View>
        <Text style={[styles.label, activeTab === 'home' && styles.activeLabel]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabChange('scan')}>
        <View style={[styles.iconContainer, activeTab === 'scan' && styles.activeIconContainer]}>
          <Text style={[styles.icon, activeTab === 'scan' && styles.activeIcon]}>📷</Text>
        </View>
        <Text style={[styles.label, activeTab === 'scan' && styles.activeLabel]}>Scan</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabChange('tracker')}>
        <View style={[styles.iconContainer, activeTab === 'tracker' && styles.activeIconContainer]}>
          <Text style={[styles.icon, activeTab === 'tracker' && styles.activeIcon]}>📅</Text>
          {activeTab === 'tracker' && <View style={styles.badge} />}
        </View>
        <Text style={[styles.label, activeTab === 'tracker' && styles.activeLabel]}>Tracker</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  activeIconContainer: {
    backgroundColor: '#FF69B4',
    borderRadius: 12,
    width: 32,
    height: 32,
  },
  icon: {
    fontSize: 20,
  },
  activeIcon: {
    fontSize: 18,
  },
  label: {
    fontSize: 12,
    color: '#9E9E9E',
    fontWeight: '500',
  },
  activeLabel: {
    color: '#FF69B4',
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF69B4',
  },
});

export default BottomNavigation;
