// ReliefTrackerScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Button,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ReliefTrackerScreen() {
  const [reliefItems, setReliefItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPercent, setNewPercent] = useState("");

  useEffect(() => {
    const loadReliefData = async () => {
      const data = await AsyncStorage.getItem("reliefItems");
      if (data) setReliefItems(JSON.parse(data));
    };
    loadReliefData();
  }, []);

  const saveReliefData = async (items) => {
    setReliefItems(items);
    await AsyncStorage.setItem("reliefItems", JSON.stringify(items));
  };

  const openImage = (image) => {
    setSelectedImage(image);
    setModalVisible(true);
  };

  const addNewRelief = () => {
    if (!newTitle || !newPercent) return;
    const newItem = {
      id: Date.now().toString(),
      title: newTitle,
      desc: `${newDesc} (${newPercent}%)`,
      percent: parseInt(newPercent),
      image: require("../../assets/images/relief-placeholder.png"), // default image
    };
    const updatedItems = [...reliefItems, newItem];
    saveReliefData(updatedItems);
    setNewTitle("");
    setNewDesc("");
    setNewPercent("");
    setAddModalVisible(false);
  };

  const avgRelief = reliefItems.length
    ? Math.round(reliefItems.reduce((acc, i) => acc + (i.percent || 0), 0) / reliefItems.length)
    : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Track what’s helping you feel better</Text>
      <Text style={styles.subHeader}>Overall Relief: {avgRelief}%</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${avgRelief}%` }]} />
      </View>

      <FlatList
        data={reliefItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openImage(item.image)}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.desc}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Full-Screen Image Modal */}
      <Modal visible={modalVisible} transparent={true}>
        <TouchableOpacity
          style={styles.modalContainer}
          onPress={() => setModalVisible(false)}
        >
          <Image source={selectedImage} style={styles.fullImage} resizeMode="contain" />
        </TouchableOpacity>
      </Modal>

      {/* Add New Relief Modal */}
      <Modal visible={addModalVisible} transparent={true} animationType="slide">
        <View style={styles.addModalContainer}>
          <View style={styles.addModalContent}>
            <Text style={styles.addHeader}>Add New Relief</Text>
            <TextInput
              placeholder="Title"
              style={styles.input}
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              placeholder="Description"
              style={styles.input}
              value={newDesc}
              onChangeText={setNewDesc}
            />
            <TextInput
              placeholder="Effectiveness %"
              style={styles.input}
              keyboardType="numeric"
              value={newPercent}
              onChangeText={setNewPercent}
            />
            <Button title="Add" onPress={addNewRelief} />
            <Button title="Cancel" color="red" onPress={() => setAddModalVisible(false)} />
          </View>
        </View>
      </Modal>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setAddModalVisible(true)}
      >
        <Text style={styles.floatingButtonText}>+ Add New Relief</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#fff0f5" },
  header: { fontSize: 20, fontWeight: "bold", color: "#d46b9a", marginBottom: 10 },
  subHeader: { fontSize: 16, color: "#a87fa3", marginBottom: 10 },
  progressBarContainer: {
    height: 10,
    backgroundColor: "#ffe6f0",
    borderRadius: 5,
    marginBottom: 20,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#d46b9a",
    borderRadius: 5,
  },
  card: {
    backgroundColor: "#ffe6f0",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },
  title: { fontSize: 16, fontWeight: "bold", color: "#a87fa3", marginBottom: 5 },
  desc: { fontSize: 14, color: "#8c5c80" },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: { width: "100%", height: "100%" },
  floatingButton: {
    position: "absolute",
    bottom: 25,
    right: 20,
    backgroundColor: "#d46b9a",
    padding: 15,
    borderRadius: 30,
    elevation: 5,
  },
  floatingButtonText: { color: "#fff", fontWeight: "bold" },
  addModalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 20,
  },
  addModalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
  },
  addHeader: { fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#d46b9a" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
});