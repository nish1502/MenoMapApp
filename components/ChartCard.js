import React from "react";
import { StyleSheet, View } from "react-native";
import { Card, Title, Paragraph, Button } from "react-native-paper";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

const screenWidth = Dimensions.get("window").width - 40;

export default function ChartCard({ title, description, chartType, onPress }) {
  const data = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        data: [3, 4, 2, 5, 4, 6],
        color: () => "#FF8FAB", // line color
        strokeWidth: 2,
      },
    ],
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.title}>{title}</Title>
        <Paragraph style={styles.description}>{description}</Paragraph>
        {chartType === "line" && (
          <LineChart
            data={data}
            width={screenWidth}
            height={150}
            chartConfig={{
              backgroundColor: "#FFB3C6",
              backgroundGradientFrom: "#FFE5EC",
              backgroundGradientTo: "#FFB3C6",
              color: (opacity = 1) => `rgba(251, 111, 146, ${opacity})`,
              labelColor: () => "#000",
              propsForDots: { r: "5", strokeWidth: "2", stroke: "#FB6F92" },
            }}
            style={{ marginTop: 10, borderRadius: 10 }}
          />
        )}
      </Card.Content>
      <Card.Actions>
        <Button mode="contained" onPress={onPress} style={styles.button}>
          Open
        </Button>
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFB3C6",
    marginBottom: 15,
    borderRadius: 15,
    paddingBottom: 10,
  },
  title: {
    color: "#FF8FAB",
    fontWeight: "bold",
  },
  description: {
    color: "#000000",
    marginTop: 5,
  },
  button: {
    backgroundColor: "#FB6F92",
    marginTop: 10,
  },
});
