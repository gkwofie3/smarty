import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const DashboardScreen = () => {
    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>System Overview</Text>
                <Text style={styles.status}>Status: <Text style={{ color: 'green' }}>Online</Text></Text>
            </View>

            <View style={styles.cardContainer}>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Active Alarms</Text>
                    <Text style={styles.cardValue}>3</Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Online Nodes</Text>
                    <Text style={styles.cardValue}>12</Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    title: { fontSize: 24, fontWeight: 'bold' },
    status: { fontSize: 14, marginTop: 5, color: '#666' },
    cardContainer: { padding: 15, flexDirection: 'row', justifyContent: 'space-between' },
    card: { backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '48%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    cardLabel: { fontSize: 12, color: '#666', textTransform: 'uppercase' },
    cardValue: { fontSize: 24, fontWeight: 'bold', marginTop: 10 }
});

export default DashboardScreen;
