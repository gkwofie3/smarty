import React from 'react';
import { View, Text, StyleSheet, FlatList, Switch, ActivityIndicator } from 'react-native';
import api from '../services/api';

const PointsScreen = () => {
    const [points, setPoints] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    const fetchPoints = async () => {
        try {
            const res = await api.get('points/');
            setPoints(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchPoints();
        const interval = setInterval(fetchPoints, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const togglePoint = async (point, value) => {
        try {
            // Optimistic update
            setPoints(points.map(p => p.id === point.id ? { ...p, current_value: value ? "1" : "0" } : p));
            await api.post(`points/${point.id}/control/`, { value: value ? 1 : 0 });
        } catch (err) {
            alert("Failed to control device");
            fetchPoints();
        }
    };

    if (loading) return <ActivityIndicator size="large" color="#FF6B00" style={{ flex: 1 }} />;

    return (
        <FlatList
            data={points}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{ padding: 15 }}
            renderItem={({ item }) => (
                <View style={styles.card}>
                    <View>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.type}>{item.point_type}</Text>
                    </View>
                    <View style={styles.controls}>
                        <Text style={styles.value}>{item.current_value}</Text>
                        {item.point_type === 'Binary' && (
                            <Switch
                                value={item.current_value === '1'}
                                onValueChange={(val) => togglePoint(item, val)}
                            />
                        )}
                    </View>
                </View>
            )}
        />
    );
};

const styles = StyleSheet.create({
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name: { fontSize: 16, fontWeight: 'bold' },
    type: { fontSize: 12, color: '#999' },
    controls: { alignItems: 'flex-end' },
    value: { fontSize: 18, fontWeight: 'bold', marginRight: 10 }
});

export default PointsScreen;
