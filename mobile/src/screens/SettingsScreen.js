import React from 'react';
import { View, Text, StyleSheet, TextInput, Switch, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = () => {
    const [config, setConfig] = React.useState({
        systemId: '',
        localIp: '',
        isRemote: false
    });

    React.useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        const saved = await AsyncStorage.getItem('smarty_config');
        if (saved) setConfig(JSON.parse(saved));
    };

    const saveConfig = async () => {
        await AsyncStorage.getItem('smarty_config', JSON.stringify(config));
        alert('Settings Saved!');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>System ID (for smartymobile.rovidgh.com)</Text>
            <TextInput
                style={styles.input}
                value={config.systemId}
                onChangeText={(val) => setConfig({ ...config, systemId: val })}
                placeholder="e.g. microsoft"
            />

            <Text style={styles.label}>Local Server IP</Text>
            <TextInput
                style={styles.input}
                value={config.localIp}
                onChangeText={(val) => setConfig({ ...config, localIp: val })}
                placeholder="e.g. 192.168.1.100"
            />

            <View style={styles.row}>
                <Text style={styles.label}>Use Remote Connection (VPN/Proxy)</Text>
                <Switch
                    value={config.isRemote}
                    onValueChange={(val) => setConfig({ ...config, isRemote: val })}
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={saveConfig}>
                <Text style={styles.buttonText}>Save Settings</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    label: { fontSize: 14, color: '#333', marginBottom: 5, marginTop: 15 },
    input: { borderBottomWidth: 1, borderBottomColor: '#ccc', paddingVertical: 8, fontSize: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25 },
    button: { backgroundColor: '#FF6B00', padding: 15, borderRadius: 8, marginTop: 40, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default SettingsScreen;
