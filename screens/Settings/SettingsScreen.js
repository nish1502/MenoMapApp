import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Text, Alert } from "react-native";
import { Card, Switch, Button, TextInput, Title, Paragraph } from "react-native-paper";

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [username, setUsername] = useState("Nishita");
  const [email, setEmail] = useState("nishita@example.com");

  const toggleNotifications = () => setNotificationsEnabled(!notificationsEnabled);

  const saveProfile = () => {
    Alert.alert("Profile Saved", "Your profile changes have been saved successfully.");
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.header}>Settings</Title>

      {/* Profile Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={{ color: "#FB6F92" }}>Profile</Title>
          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            outlineColor="#FFC2D1"
            activeOutlineColor="#FF8FAB"
            style={styles.input}
          />
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            outlineColor="#FFC2D1"
            activeOutlineColor="#FF8FAB"
            style={styles.input}
          />
          <Button
            mode="contained"
            buttonColor="#FF8FAB"
            style={styles.button}
            onPress={saveProfile}
          >
            Save Profile
          </Button>
        </Card.Content>
      </Card>

      {/* Notifications Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={{ color: "#FB6F92" }}>Notifications</Title>
          <View style={styles.switchRow}>
            <Paragraph style={styles.text}>Enable Notifications</Paragraph>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              color="#FF8FAB"
            />
          </View>
        </Card.Content>
      </Card>

      {/* App Info Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={{ color: "#FB6F92" }}>App</Title>
          <Paragraph style={styles.text}>Version: 1.0.0</Paragraph>
          <Paragraph style={styles.text}>Support: support@menomapapp.com</Paragraph>
          <Button
            mode="outlined"
            buttonColor="#FF8FAB"
            textColor="#000000"
            style={styles.button}
            onPress={() => Alert.alert("Help", "Contact support@menomapapp.com for assistance.")}
          >
            Help & Support
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFE5EC", padding: 15 },
  header: { fontSize: 24, fontWeight: "bold", color: "#FB6F92", marginBottom: 15 },
  card: { marginBottom: 20, backgroundColor: "#FFB3C6", borderRadius: 15, paddingVertical: 10 },
  input: { marginBottom: 10, backgroundColor: "#FFE5EC" },
  button: { marginTop: 5 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  text: { color: "#000000", fontSize: 16 },
});
