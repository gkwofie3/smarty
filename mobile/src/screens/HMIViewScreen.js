import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HMIViewScreen = () => {
    const [url, setUrl] = React.useState(null);

    React.useEffect(() => {
        const getUrl = async () => {
            const saved = await AsyncStorage.getItem('smarty_config');
            const { systemId, isRemote, localIp } = saved ? JSON.parse(saved) : {};

            if (isRemote && systemId) {
                setUrl(`https://smartymobile.rovidgh.com/${systemId}/client/`);
            } else {
                setUrl(`http://${localIp || 'localhost'}:5004/`);
            }
        };
        getUrl();
    }, []);

    if (!url) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

    return (
        <View style={styles.container}>
            <WebView
                source={{ uri: url }}
                style={styles.webview}
                startInLoadingState={true}
                renderLoading={() => <ActivityIndicator size="large" color="#FF6B00" />}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    webview: { flex: 1 }
});

export default HMIViewScreen;
