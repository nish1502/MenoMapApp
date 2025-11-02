import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
// Note: NavigationContainer is NOT imported here
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // UPDATED
import Icon from 'react-native-vector-icons/Ionicons';

// --- Soft Pink Theme Colors ---
const COLORS = {
  primaryBackground: '#FFFBFB', // Very pale pink
  accent: '#FFB6C1',           // Main "Soft Pink"
  textPrimary: '#4A4A4A',       // Dark Grey
  textSecondary: '#8D8D8D',     // Medium Grey
  white: '#FFFFFF',
  cardBorder: '#F0E4E4',         // A light border for cards
};
// ------------------------------

// --- DYNAMIC DATA SOURCE ---
const ARTICLES_DATA = [
  {
    id: '1',
    icon: 'medkit-outline',
    title: 'What is Perimenopause?',
    excerpt: 'Learn about the transition phase before menopause.',
    content: [
      { type: 'h2', text: 'Understanding Perimenopause' },
      {
        type: 'p',
        text: 'Perimenopause, or "menopause transition," is the time in a woman\'s life when her body starts to naturally transition toward permanent infertility (menopause). This transition can last for several years.',
      },
      { type: 'h3', text: 'Common Signs You Might Notice' },
      {
        type: 'list',
        items: [
          'Irregular periods (this is often the first sign)',
          'Hot flashes and night sweats',
          'Sleep problems',
          'Mood changes, such as irritability or anxiety',
          'Vaginal and bladder problems',
        ],
      },
      {
        type: 'p',
        text: 'It\'s a natural process, but tracking your symptoms can help you and your doctor manage any discomfort.',
      },
    ],
  },
  {
    id: '2',
    icon: 'calendar-outline',
    title: 'What is a "Normal" Cycle?',
    excerpt: 'Defining what "normal" means for menstrual cycles.',
    content: [
      { type: 'h2', text: 'Defining a "Normal" Cycle' },
      {
        type: 'p',
        text: 'A "normal" menstrual cycle isn\'t the same for every woman. What\'s normal for you might be different from what\'s normal for someone else.',
      },
      { type: 'h3', text: 'Typical Ranges' },
      {
        type: 'list',
        items: [
          'Cycle Length: A cycle is counted from the first day of one period to the first day of the next. The average is 28 days, but anything between 21 and 35 days is considered "normal" for adults.',
          'Period Length: The bleeding itself (menses) typically lasts 3 to 7 days.',
          'Variability: It\'s normal for your cycle length to vary by a few days each month.',
        ],
      },
      { type: 'h3', text: 'What is "Irregular"?' },
      {
        type: 'p',
        text: 'Your cycle may be "irregular" if it frequently falls outside the 21-35 day range, if your cycle length varies by more than 7-9 days, or if you skip periods. This is a common sign of perimenopause.',
      },
    ],
  },
  {
    id: '3',
    icon: 'thermometer-outline',
    title: 'Tips for Managing Hot Flashes',
    excerpt: 'Practical advice for handling sudden waves of heat.',
    content: [
      { type: 'h2', text: 'Managing Hot Flashes' },
      {
        type: 'p',
        text: 'Hot flashes can be uncomfortable, but lifestyle adjustments can often provide significant relief. Tracking them can help you identify your personal triggers.',
      },
      { type: 'h3', text: 'Common Triggers to Avoid' },
      {
        type: 'list',
        items: [
          'Spicy foods',
          'Alcohol and caffeine',
          'Hot rooms or hot weather',
          'Stress',
          'Smoking',
        ],
      },
      { type: 'h3', text: 'What You Can Do' },
      {
        type: 'list',
        items: [
          'Dress in layers: Wear layers you can easily remove.',
          'Stay cool: Carry a small fan or a cold water bottle.',
          'Deep breathing: Practice slow, deep breathing (paced respiration) when you feel a hot flash starting.',
          'Exercise: Regular physical activity can help reduce symptoms.',
        ],
      },
    ],
  },
  {
    id: '4',
    icon: 'help-circle-outline',
    title: 'When to See a Doctor',
    excerpt: 'Knowing when to seek professional medical advice.',
    content: [
      { type: 'h2', text: 'When to See a Doctor' },
      {
        type: 'p',
        text: 'While perimenopause is a normal life stage, you should see your doctor to rule out other causes for your symptoms. We strongly recommend visiting your doctor if you experience any of the following:',
      },
      {
        type: 'list',
        items: [
          'Bleeding that is very heavy or lasts longer than 7 days.',
          'Bleeding that occurs between your periods.',
          'Bleeding that happens after sex.',
          'Periods that consistently occur closer than 21 days apart.',
          'Symptoms that significantly interfere with your daily life (like severe sleep disruption or anxiety).',
        ],
      },
      {
        type: 'p',
        text: 'Bringing your cycle and symptom data from this app can help you have a more productive conversation with your healthcare provider.',
      },
    ],
  },
];
// ------------------------------

/**
 * SCREEN 1: The list of all articles
 */
const LearnScreen = ({ navigation }) => {
  const renderArticleCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ArticleDetail', { article: item })}>
      <View style={styles.cardIconContainer}>
        <Icon name={item.icon} size={28} color={COLORS.accent} />
      </View>
      <View style={styles.cardTextContainer}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardExcerpt}>{item.excerpt}</Text>
      </View>
      <Icon name="chevron-forward-outline" size={22} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.primaryBackground} />
      <FlatList
        data={ARTICLES_DATA}
        keyExtractor={item => item.id}
        renderItem={renderArticleCard}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <Text style={styles.headerTitle}>Learn</Text>
        }
      />
    </SafeAreaView>
  );
};

/**
 * SCREEN 2: The screen that shows the article content
 */
const ArticleDetailScreen = ({ route }) => {
  const { article } = route.params;

  const renderContent = (block, index) => {
    switch (block.type) {
      case 'h2':
        return <Text key={index} style={styles.h2}>{block.text}</Text>;
      case 'h3':
        return <Text key={index} style={styles.h3}>{block.text}</Text>;
      case 'p':
        return <Text key={index} style={styles.p}>{block.text}</Text>;
      case 'list':
        return (
          <View key={index} style={styles.list}>
            {block.items.map((item, i) => (
              <Text key={i} style={styles.listItem}>
                <Text style={{ color: COLORS.accent, fontWeight: 'bold' }}>• </Text>
                {item}
              </Text>
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.articleContainer}>
        {article.content.map((block, index) => renderContent(block, index))}
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * The Navigator for this feature
 * This is what you will import into your main App.js
 */
const Stack = createNativeStackNavigator(); // UPDATED

export default function LearnFeature() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.accent, // Pink header
        },
        headerTintColor: COLORS.white, // White back arrow and title
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitleVisible: false,
      }}>
      <Stack.Screen
        name="LearnList"
        component={LearnScreen}
        options={{ headerShown: false }} // Hide header on the main list screen
      />
      <Stack.Screen
        name="ArticleDetail"
        component={ArticleDetailScreen}
        options={({ route }) => ({
          title: route.params.article.title, // Set header title from article
        })}
      />
    </Stack.Navigator>
  );
}

// ------------------------------
// --- STYLESHEET ---
// ------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryBackground,
  },
  listContainer: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#FFC0CB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIconContainer: {
    backgroundColor: '#FFF0F1',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  cardExcerpt: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  articleContainer: {
    padding: 24,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
    marginTop: 8,
  },
  h3: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
    marginTop: 16,
  },
  p: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 26,
    marginBottom: 16,
  },
  list: {
    marginBottom: 16,
  },
  listItem: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 26,
    marginBottom: 8,
    flexDirection: 'row',
  },
});