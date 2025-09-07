import React from "react";
import { StyleSheet } from "react-native";
import { Button } from "react-native-paper";

export default function CustomButton({ text, onPress, mode = "contained", style }) {
  return (
    <Button
      mode={mode}
      onPress={onPress}
      style={[styles.button, style]}
      labelStyle={styles.label}
    >
      {text}
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#FF8FAB",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 6,
  },
  label: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
