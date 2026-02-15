import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens
import DashboardScreen from './src/screens/DashboardScreen';
import PointsScreen from './src/screens/PointsScreen';
import HMIViewScreen from './src/screens/HMIViewScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;

                        if (route.name === 'Dashboard') {
                            iconName = focused ? 'speedometer' : 'speedometer-outline';
                        } else if (route.name === 'Points') {
                            iconName = focused ? 'list' : 'list-outline';
                        } else if (route.name === 'Graphics') {
                            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
                        } else if (route.name === 'Settings') {
                            iconName = focused ? 'settings' : 'settings-outline';
                        }

                        return <Ionicons name={iconName} size={size} color={color} />;
                    },
                    tabBarActiveTintColor: '#FF6B00',
                    tabBarInactiveTintColor: 'gray',
                    headerStyle: { backgroundColor: '#fff' },
                    headerTitleStyle: { fontWeight: 'bold' },
                })}
            >
                <Tab.Screen name="Dashboard" component={DashboardScreen} />
                <Tab.Screen name="Points" component={PointsScreen} />
                <Tab.Screen name="Graphics" component={HMIViewScreen} />
                <Tab.Screen name="Settings" component={SettingsScreen} />
            </Tab.Navigator>
        </NavigationContainer>
    );
}
