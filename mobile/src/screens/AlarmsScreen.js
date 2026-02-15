import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const AlarmsScreen = () => {
    // Placeholder for alarm data
    const alarms = [
        { id: 1, title: 'UPS Low Battery', time: '10:45 AM', severity: 'High' },
        { id: 2, title: 'Network Outage - Node 4', time: '09:20 AM', severity: 'Medium' },
        { id: 3, title: 'High Temp - Rack A', time: '08:15 AM', severity: 'Critical' },
    ];

    const getSeverityColor = (sev) => {
        if (sev === 'Critical') return '#d9534f';
        if (sev === 'High') return '#f0ad4e';
        return '#5bc0de';
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={alarms}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.card}>
                        <View style={[styles.severityBar, { backgroundColor: getSeverityColor(item.severity) }]} />
                        <View style={styles.info}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.subtitle}>{item.time} • {item.severity}</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 10 },
    card: { backgroundColor: '#fff', borderRadius: 8, marginBottom: 10, flexDirection: 'row', overflow: 'hidden', elevation: 2 },
    severityBar: { width: 6 },
    info: { padding: 15 },
    title: { fontSize: 16, fontWeight: 'bold' },
    subtitle: { fontSize: 12, color: '#666', marginTop: 4 }
});

export default AlarmsScreen;
