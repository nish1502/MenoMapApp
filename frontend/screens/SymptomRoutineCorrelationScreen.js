import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFBFB' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0E4E4',
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 15, color: '#4A4A4A' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#4A4A4A', marginTop: 20, textAlign: 'center' },
    subtitle: { fontSize: 16, color: '#8D8D8D', textAlign: 'center', marginTop: 10, lineHeight: 24 },
});

const SymptomRoutineCorrelationScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#4A4A4A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Symptom Pattern Insights</Text>
            </View>
            <View style={styles.content}>
                <Icon name="stats-chart-outline" size={80} color="#FFB6C1" />
                <Text style={styles.title}>Feature Coming Soon</Text>
                <Text style={styles.subtitle}>
                    We're working on advanced analytics to find patterns in your symptoms and routines.
                </Text>
            </View>
        </SafeAreaView>
    );

};

export default SymptomRoutineCorrelationScreen;
