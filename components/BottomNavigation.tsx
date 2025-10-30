import React, { useRef, useEffect } from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions} from 'react-native';

const { width } = Dimensions.get('window');

interface BottomNavigationProps {
  activeTab: 'home' | 'scan' | 'tracker' | 'info' | 'search' | 'profile' | 'articles';
  onTabChange: (tab: 'home' | 'scan' | 'tracker' | 'info' | 'search' | 'profile' | 'articles') => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const animatedValues = useRef({
    home: new Animated.Value(activeTab === 'home' ? 1 : 0),
    scan: new Animated.Value(activeTab === 'scan' ? 1 : 0),
    articles: new Animated.Value(activeTab === 'articles' ? 1 : 0),
    profile: new Animated.Value(activeTab === 'profile' ? 1 : 0),
  }).current;

  const indicatorPosition = useRef(new Animated.Value(getTabIndex(activeTab))).current;
  
  // Pink blurb animations for each tab
  const blurbAnimations = useRef({
    home: new Animated.Value(activeTab === 'home' ? 1 : 0),
    scan: new Animated.Value(activeTab === 'scan' ? 1 : 0),
    articles: new Animated.Value(activeTab === 'articles' ? 1 : 0),
    profile: new Animated.Value(activeTab === 'profile' ? 1 : 0),
  }).current;

  function getTabIndex(tab: string): number {
    const tabs = ['home', 'scan', 'articles', 'profile'];
    return tabs.indexOf(tab) * (width / 4);
  }

  useEffect(() => {
    const tabKey = activeTab as keyof typeof animatedValues;
    
    // Animate all tabs
    Object.keys(animatedValues).forEach(key => {
      const isActive = key === tabKey;
      Animated.spring(animatedValues[key as keyof typeof animatedValues], {
        toValue: isActive ? 1 : 0,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }).start();
    });

    // Animate pink blurb for active tab
    Object.keys(blurbAnimations).forEach(key => {
      const isActive = key === tabKey;
      Animated.sequence([
        Animated.spring(blurbAnimations[key as keyof typeof blurbAnimations], {
          toValue: isActive ? 1 : 0,
          useNativeDriver: true,
          tension: 400,
          friction: 15,
        }),
        // Add a subtle bounce effect for the active tab
        ...(isActive ? [
          Animated.timing(blurbAnimations[key as keyof typeof blurbAnimations], {
            toValue: 0.8,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.spring(blurbAnimations[key as keyof typeof blurbAnimations], {
            toValue: 1,
            useNativeDriver: true,
            tension: 500,
            friction: 10,
          })
        ] : [])
      ]).start();
    });

    // Animate indicator position
    Animated.spring(indicatorPosition, {
      toValue: getTabIndex(activeTab),
      useNativeDriver: false,
      tension: 300,
      friction: 20,
    }).start();
  }, [activeTab]);

  const tabs = [
    { key: 'home', label: 'Home', icon: '🏡', activeIcon: '🏡' },
    { key: 'scan', label: 'Scan', icon: '💕', activeIcon: '💕' },
    { key: 'articles', label: 'Articles', icon: '🌸', activeIcon: '🌸' },
    { key: 'profile', label: 'Settings', icon: '🌺', activeIcon: '🌺' },
  ];

  return (
    <View style={styles.container}>
      {/* Animated background indicator */}
      <Animated.View 
        style={[
          styles.indicator,
          {
            transform: [{ translateX: indicatorPosition }],
          }
        ]} 
      />
      
      {tabs.map((tab) => {
        const tabKey = tab.key as keyof typeof animatedValues;
        const isActive = activeTab === tab.key;
        
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabChange(tab.key as any)}
            activeOpacity={0.7}
          >
            {/* Pink blurb behind the icon */}
            <Animated.View
              style={[
                styles.pinkBlurb,
                {
                  opacity: blurbAnimations[tabKey].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.3],
                  }),
                  transform: [
                    {
                      scale: blurbAnimations[tabKey].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            />
            
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [
                    {
                      scale: animatedValues[tabKey].interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={[styles.icon, isActive && styles.activeIcon]}>
                {isActive ? tab.activeIcon : tab.icon}
              </Text>
            </Animated.View>
            
            <Animated.Text 
              style={[
                styles.label,
                isActive && styles.activeLabel,
                {
                  opacity: animatedValues[tabKey].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                },
              ]}
            >
              {tab.label}
            </Animated.Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 6,
    left: 12,
    width: (width - 24) / 4,
    height: 2,
    backgroundColor: '#E91E63',
    borderRadius: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    marginBottom: 2,
    position: 'relative',
    zIndex: 2,
  },
  pinkBlurb: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#E91E63',
    borderRadius: 20,
    zIndex: 1,
  },
  icon: {
    fontSize: 22,
    textAlign: 'center',
  },
  activeIcon: {
    fontSize: 24,
  },
  label: {
    fontSize: 11,
    color: '#9E9E9E',
    fontWeight: '500',
    textAlign: 'center',
  },
  activeLabel: {
    color: '#E91E63',
    fontWeight: '700',
    fontSize: 12,
  },
});

export default BottomNavigation;
