// OnboardingScreen.js
import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const slides = [
  {
    key: "1",
    title: "Track Your Symptoms Easily",
    image: require("../assets/images/onboarding1.png"),
    description: "Mood, sleep, fatigue, anxiety all tracked in one place",
  },
  {
    key: "2",
    title: "Personalized Relief & Diet Plans",
    image: require("../assets/images/onboarding2.png"),
    description: "Yoga, herbal teas, diet meals tailored for you",
  },
  {
    key: "3",
    title: "AI-Powered Insights & Reports",
    image: require("../assets/images/onboarding3.png"),
    description: "Get actionable insights and progress charts",
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const renderItem = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <Image source={item.image} style={styles.image} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const onNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.replace("LoginScreen"); // after onboarding, go to login
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        onScroll={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, currentIndex === i && styles.activeDot]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={onNext}>
          <Text style={styles.nextText}>{currentIndex === slides.length - 1 ? "Finish" : "Next"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff0f5" },
  slide: { justifyContent: "center", alignItems: "center", padding: 20 },
  image: { width: 250, height: 250, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "bold", color: "#d46b9a", textAlign: "center" },
  description: { fontSize: 14, color: "#a87fa3", textAlign: "center", marginTop: 10 },
  footer: { alignItems: "center", marginBottom: 40 },
  dotsContainer: { flexDirection: "row", marginBottom: 20 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#ddd", marginHorizontal: 5 },
  activeDot: { backgroundColor: "#d46b9a" },
  nextButton: { backgroundColor: "#d46b9a", padding: 12, borderRadius: 10, width: 120 },
  nextText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});