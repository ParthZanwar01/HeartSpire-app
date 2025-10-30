import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { articlesDatabase, ArticleContent } from '../data/articlesDatabase';

interface ArticlesScreenProps {
  onBack: () => void;
  showBackButton?: boolean;
}

interface ArticleCategory {
  id: string;
  title: string;
  icon: string;
  category: 'pregnancy' | 'child';
  description?: string;
}

const ArticlesScreen: React.FC<ArticlesScreenProps> = ({ onBack, showBackButton = true }) => {
  const [activeCategory, setActiveCategory] = useState<'pregnancy' | 'child'>('pregnancy');
  const [searchQuery, setSearchQuery] = useState('');
  const [articleContent, setArticleContent] = useState<ArticleContent | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Animation values
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const searchFocusAnimation = useRef(new Animated.Value(0)).current;
  const tabIndicatorAnimation = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;
  const fadeAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;
  
  // Reading animations
  const readingProgressAnimation = useRef(new Animated.Value(0)).current;
  const contentFadeAnimation = useRef(new Animated.Value(0)).current;
  const imageAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;

  // Initialize card animations
  useEffect(() => {
    filteredCategories.forEach((category, index) => {
      if (!cardAnimations[category.id]) {
        cardAnimations[category.id] = new Animated.Value(0);
        fadeAnimations[category.id] = new Animated.Value(0);
      }
    });

    // Staggered entrance animation for cards
    const animations = filteredCategories.map((category, index) => {
      return Animated.sequence([
        Animated.delay(index * 100),
        Animated.parallel([
          Animated.spring(cardAnimations[category.id], {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.timing(fadeAnimations[category.id], {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.parallel(animations).start();
  }, [activeCategory, searchQuery]);

  // Tab indicator animation
  useEffect(() => {
    Animated.spring(tabIndicatorAnimation, {
      toValue: activeCategory === 'pregnancy' ? 0 : 1,
      useNativeDriver: false,
      tension: 300,
      friction: 20,
    }).start();
  }, [activeCategory]);

  // Modal animation
  useEffect(() => {
    if (articleContent) {
      // Reset animations
      readingProgressAnimation.setValue(0);
      contentFadeAnimation.setValue(0);
      
      Animated.parallel([
        Animated.spring(modalAnimation, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        // Reading progress animation
        Animated.timing(readingProgressAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        // Content fade in
        Animated.timing(contentFadeAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.spring(modalAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [articleContent]);

  const articleCategories: ArticleCategory[] = [
    {
      id: 'pregnancy',
      title: 'Pregnancy',
      icon: '🌸',
      category: 'pregnancy',
      description: 'Track your pregnancy progress and learn what to expect each week'
    },
    {
      id: 'symptoms',
      title: 'Symptoms & Diseases',
      icon: '🌺',
      category: 'pregnancy',
      description: 'Understand common pregnancy symptoms and when to seek medical help'
    },
    {
      id: 'fetal-movement',
      title: 'Fetal Movement',
      icon: '💕',
      category: 'pregnancy',
      description: 'Learn about baby kicks, patterns, and what to monitor'
    },
    {
      id: 'mental-health',
      title: 'Mental Health',
      icon: '🧘‍♀️',
      category: 'pregnancy',
      description: 'Support for anxiety, depression, and emotional well-being'
    },
    {
      id: 'diet-advice',
      title: 'Diet Advice',
      icon: '🥗',
      category: 'pregnancy',
      description: 'Nutritional guidance and food safety during pregnancy'
    },
    {
      id: 'informed-choices',
      title: 'Informed Choices',
      icon: '💭',
      category: 'pregnancy',
      description: 'Make informed decisions about your pregnancy and birth'
    },
    {
      id: 'labor',
      title: 'Labor',
      icon: '🏥',
      category: 'pregnancy',
      description: 'Prepare for labor, delivery, and what to expect'
    },
    {
      id: 'breastfeeding',
      title: 'Breastfeeding Guide',
      icon: '🍼',
      category: 'pregnancy',
      description: 'Essential breastfeeding tips and support'
    },
    {
      id: 'car-seat',
      title: 'Car Seat Guide',
      icon: '🚗',
      category: 'child',
      description: 'Choose the right car seat for your baby'
    },
    {
      id: 'partner',
      title: 'For You As A Partner',
      icon: '💑',
      category: 'pregnancy',
      description: 'Support and guidance for partners during pregnancy'
    },
    {
      id: 'prenatal-vitamins',
      title: 'Prenatal Vitamins',
      icon: '💊',
      category: 'pregnancy',
      description: 'Essential nutrients for healthy pregnancy and baby development'
    },
    {
      id: 'exercise-pregnancy',
      title: 'Exercise & Fitness',
      icon: '🏃‍♀️',
      category: 'pregnancy',
      description: 'Safe exercise routines and fitness tips during pregnancy'
    },
    {
      id: 'newborn-care',
      title: 'Newborn Care',
      icon: '👶',
      category: 'child',
      description: 'Essential tips for caring for your newborn'
    },
    {
      id: 'feeding',
      title: 'Feeding Your Baby',
      icon: '🥄',
      category: 'child',
      description: 'Breastfeeding, formula feeding, and introducing solids'
    },
    {
      id: 'sleep',
      title: 'Baby Sleep',
      icon: '😴',
      category: 'child',
      description: 'Establish healthy sleep routines and patterns'
    },
    {
      id: 'development',
      title: 'Baby Development',
      icon: '📈',
      category: 'child',
      description: 'Track milestones and support your baby\'s growth'
    },
  ];

  const filteredCategories = articleCategories.filter(category => {
    const matchesCategory = category.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCategoryPress = (category: ArticleCategory) => {
    // Press animation
    Animated.sequence([
      Animated.timing(cardAnimations[category.id], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(cardAnimations[category.id], {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
    ]).start();

    setSelectedCategory(category.id);
    const content = articlesDatabase[category.id];
    
    if (content) {
      setArticleContent(content);
    } else {
      Alert.alert('Coming Soon', 'This article is being prepared and will be available soon.');
    }
  };

  const handleSearchFocus = () => {
    Animated.spring(searchFocusAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  const handleSearchBlur = () => {
    Animated.spring(searchFocusAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  const renderArticleContent = () => {
    if (!articleContent) return null;

    // Sample images for different article types
    const getArticleImage = (categoryId: string) => {
      const images: { [key: string]: string } = {
        'pregnancy': '🌸',
        'symptoms': '🌺',
        'fetal-movement': '💕',
        'mental-health': '🧘‍♀️',
        'diet-advice': '🥗',
        'informed-choices': '💭',
        'labor': '🏥',
        'breastfeeding': '🍼',
        'car-seat': '🚗',
        'partner': '💑',
        'prenatal-vitamins': '💊',
        'exercise-pregnancy': '🏃‍♀️',
        'newborn-care': '👶',
        'feeding': '🥄',
        'sleep': '😴',
        'development': '📈',
      };
      return images[categoryId] || '🌸';
    };

    return (
      <ScrollView style={styles.modalOverlay} showsVerticalScrollIndicator={false}>
        <Animated.View style={[
          styles.modalContainer,
          {
            opacity: contentFadeAnimation,
            transform: [{
              translateY: contentFadeAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }
        ]}>
          {/* Reading Progress Bar */}
          <Animated.View style={styles.progressBarContainer}>
            <Animated.View style={[
              styles.progressBar,
              {
                width: readingProgressAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }
            ]} />
          </Animated.View>

          <View style={styles.modalHeader}>
            <View style={styles.titleContainer}>
              <Animated.Text style={[
                styles.articleTitle,
                {
                  opacity: contentFadeAnimation,
                  transform: [{
                    translateX: contentFadeAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  }],
                }
              ]}>
                {articleContent.title || 'Article'}
              </Animated.Text>
            </View>
            <TouchableOpacity onPress={() => { setArticleContent(null); setSelectedCategory(null); }}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Article Image */}
          <Animated.View style={[
            styles.articleImageContainer,
            {
              opacity: contentFadeAnimation,
              transform: [{
                scale: contentFadeAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              }],
            }
          ]}>
            <Text style={styles.articleImage}>{getArticleImage(selectedCategory || '')}</Text>
          </Animated.View>

          <Animated.Text style={[
            styles.articleSummary,
            {
              opacity: contentFadeAnimation,
              transform: [{
                translateY: contentFadeAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              }],
            }
          ]}>
            {articleContent.summary || ''}
          </Animated.Text>

          <Animated.View style={[
            styles.keyPointsSection,
            {
              opacity: contentFadeAnimation,
              transform: [{
                translateY: contentFadeAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [15, 0],
                }),
              }],
            }
          ]}>
            <Text style={styles.sectionHeading}>Key Points</Text>
            {articleContent.keyPoints && articleContent.keyPoints.length > 0 && articleContent.keyPoints.map((point, index) => (
              <Animated.View 
                key={index} 
                style={[
                  styles.keyPointItem,
                  {
                    opacity: contentFadeAnimation,
                    transform: [{
                      translateX: contentFadeAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-30, 0],
                      }),
                    }],
                  }
                ]}
              >
                <Text style={styles.bullet}>🌸</Text>
                <Text style={styles.keyPointText}>{point}</Text>
              </Animated.View>
            ))}
          </Animated.View>

          {articleContent.sections && articleContent.sections.length > 0 && articleContent.sections.map((section, index) => (
            <Animated.View 
              key={index} 
              style={[
                styles.section,
                {
                  opacity: contentFadeAnimation,
                  transform: [{
                    translateY: contentFadeAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  }],
                }
              ]}
            >
              <Text style={styles.sectionHeading}>{section.heading}</Text>
              <Text style={styles.sectionContent}>{section.content}</Text>
            </Animated.View>
          ))}

          {articleContent.sources && articleContent.sources.length > 0 && (
            <Animated.View style={[
              styles.sourcesSection,
              {
                opacity: contentFadeAnimation,
                transform: [{
                  translateY: contentFadeAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [25, 0],
                  }),
                }],
              }
            ]}>
              <Text style={styles.sectionHeading}>Sources</Text>
              {articleContent.sources.map((source, index) => (
                <Text key={index} style={styles.sourceText}>{source}</Text>
              ))}
            </Animated.View>
          )}

          <Animated.View style={{
            opacity: contentFadeAnimation,
            transform: [{
              translateY: contentFadeAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            }],
          }}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => { setArticleContent(null); setSelectedCategory(null); }}
            >
              <Text style={styles.closeButtonText}>🌸 Close Article</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {showBackButton ? (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}
        <Text style={styles.headerTitle}>Articles</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Animated.View style={[
          styles.searchBar,
          {
            transform: [{
              scale: searchFocusAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.02],
              }),
            }],
            shadowOpacity: searchFocusAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.1],
            }),
          }
        ]}>
          <Text style={styles.searchIcon}>🌺</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for articles and guides"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabContainer}>
        <Animated.View style={[
          styles.tabIndicator,
          {
            transform: [{
              translateX: tabIndicatorAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Dimensions.get('window').width / 2 - 20],
              }),
            }],
          }
        ]} />
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeCategory === 'pregnancy' && styles.activeTab
          ]}
          onPress={() => setActiveCategory('pregnancy')}
        >
          <Text style={[
            styles.tabText,
            activeCategory === 'pregnancy' && styles.activeTabText
          ]}>
            PREGNANCY
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeCategory === 'child' && styles.activeTab
          ]}
          onPress={() => setActiveCategory('child')}
        >
          <Text style={[
            styles.tabText,
            activeCategory === 'child' && styles.activeTabText
          ]}>
            CHILD
          </Text>
        </TouchableOpacity>
      </View>

      {/* Article Categories Grid */}
      <ScrollView style={styles.content}>
        <View style={styles.grid}>
          {filteredCategories.map((category) => (
            <Animated.View
              key={category.id}
              style={[
                styles.categoryCard,
                {
                  transform: [
                    {
                      scale: cardAnimations[category.id]?.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }) || 1,
                    },
                    {
                      translateY: cardAnimations[category.id]?.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }) || 0,
                    },
                  ],
                  opacity: fadeAnimations[category.id]?.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }) || 1,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.categoryCardTouchable}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.8}
              >
                <View style={styles.iconContainer}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                </View>
                <Text style={styles.categoryTitle}>{category.title}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {filteredCategories.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🌺</Text>
            <Text style={styles.emptyText}>No articles found</Text>
            <Text style={styles.emptySubtext}>Try a different search term</Text>
          </View>
        )}
      </ScrollView>

      {/* Article Content Modal */}
      {articleContent && (
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: modalAnimation,
              transform: [{
                scale: modalAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              }],
            },
          ]}
        >
          {renderArticleContent()}
        </Animated.View>
      )}
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
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
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
  },
  headerSpacer: {
    width: 60,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#FFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
    color: '#999',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  clearIcon: {
    fontSize: 18,
    color: '#999',
    paddingLeft: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 12,
    left: 20,
    width: '50%',
    height: 3,
    backgroundColor: '#E91E63',
    borderRadius: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#000',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#333',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  categoryCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    margin: '1.5%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryCardTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 40,
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    lineHeight: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(254, 247, 247, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E91E63',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(254, 247, 247, 0.95)',
    zIndex: 1001,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  articleTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E91E63',
    flex: 1,
    marginRight: 12,
  },
  closeIcon: {
    fontSize: 24,
    color: '#999',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#E91E63',
    borderRadius: 2,
  },
  articleImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 20,
    backgroundColor: '#FFF0F5',
    borderRadius: 16,
  },
  articleImage: {
    fontSize: 80,
    textAlign: 'center',
  },
  articleSummary: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  keyPointsSection: {
    backgroundColor: '#FFF0F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E91E63',
    marginBottom: 12,
  },
  keyPointItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#E91E63',
    marginRight: 8,
  },
  keyPointText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionContent: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  sourcesSection: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  sourceText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  closeButton: {
    backgroundColor: '#FF69B4',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ArticlesScreen;
