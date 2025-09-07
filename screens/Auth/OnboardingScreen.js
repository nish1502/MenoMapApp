// screens/Onboarding/OnboardingScreen.js
import React, { useState, useRef } from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import { Button, Card, Title, Paragraph } from "react-native-paper";

const { width } = Dimensions.get("window");

const slides = [
  {
    title: "Welcome to MenoMap",
    description: "Track and manage your menopause journey effortlessly.",
  },
  {
    title: "Symptom Tracker",
    description: "Log daily symptoms and spot patterns over time.",
  },
  {
    title: "Diet Planner",
    description: "Get region-specific diet recommendations for your stage.",
  },
  {
    title: "Relief & Reports",
    description: "Track relief from treatments and generate doctor-ready reports.",
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef();

  const nextSlide = () => {
    if (currentIndex < slides.length - 1) {
      scrollRef.current.scrollTo({ x: width * (currentIndex + 1), animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.replace("LoginScreen"); // Navigate to Login after last slide
    }
  };

  const skip = () => {
    navigation.replace("LoginScreen"); // Skip onboarding
  };

  const onScrollEnd = (e) => {
    const index = Math.floor(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
      >
        {slides.map((slide, index) => (
          <Card key={index} style={styles.card}>
            <Card.Content>
              <Title style={styles.title}>{slide.title}</Title>
              <Paragraph style={styles.description}>{slide.description}</Paragraph>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      {/* Slide Indicators */}
      <View style={styles.indicatorContainer}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.indicator,
              { backgroundColor: i === currentIndex ? "#FF8FAB" : "#FFC2D1" },
            ]}
          />
        ))}
      </View>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <Button onPress={skip} textColor="#FB6F92">
          Skip
        </Button>
        <Button mode="contained" buttonColor="#FF8FAB" onPress={nextSlide}>
          {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFE5EC" },
  card: {
    width,
    margin: 20,
    borderRadius: 20,
    backgroundColor: "#FFDDE4",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    elevation: 3,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FB6F92",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
});
