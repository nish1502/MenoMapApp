// DoctorConsultationRoomScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";

export default function DoctorConsultationRoomScreen({ navigation }) {
  const [messages, setMessages] = useState([
    { from: "doctor", text: "Hello! How are you feeling today?" },
  ]);
  const [input, setInput] = useState("");

  const sendMsg = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { from: "you", text: input.trim() }]);
    setInput("");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Consultation Room</Text>
      </View>

      {/* Chat */}
      <ScrollView style={styles.chatBox}>
        {messages.map((m, i) => (
          <View
            key={i}
            style={[styles.msgBubble, m.from === "you" ? styles.yourMsg : styles.docMsg]}
          >
            <Text style={styles.msgText}>{m.text}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
        />
        <TouchableOpacity onPress={sendMsg} style={styles.sendBtn}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, backgroundColor: "#fff0f6" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, marginBottom: 10 },
  backBtn: { fontSize: 16, color: "#6a0572" },
  headerText: { fontSize: 20, fontWeight: "700", marginLeft: 15, color: "#6a0572" },

  chatBox: { flex: 1, paddingHorizontal: 15 },
  msgBubble: { padding: 10, borderRadius: 12, marginVertical: 5, maxWidth: "80%" },
  yourMsg: { backgroundColor: "#e1bee7", alignSelf: "flex-end" },
  docMsg: { backgroundColor: "#ffe6f0", alignSelf: "flex-start" },
  msgText: { fontSize: 14, color: "#333" },

  inputBar: { flexDirection: "row", padding: 10, borderTopWidth: 1, borderColor: "#ddd" },
  textInput: { flex: 1, backgroundColor: "#f9f9f9", borderRadius: 20, paddingHorizontal: 15 },
  sendBtn: { marginLeft: 8, justifyContent: "center", alignItems: "center" },
  sendText: { color: "#8a4baf", fontWeight: "700" },
});