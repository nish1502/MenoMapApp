import React from "react";
import { StyleSheet } from "react-native";
import { TextInput } from "react-native-paper";

export default function InputField({ label, value, onChangeText, secureTextEntry = false }) {
  return (
    <TextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      mode="outlined"
      outlineColor="#FFC2D1"
      activeOutlineColor="#FF8FAB"
      style={styles.input}
      placeholderTextColor="#FFC2D1"
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#FFE5EC",
    marginVertical: 6,
    borderRadius: 12,
  },
});
