/**
 * Content Security Monitor - Mobile App
 * Main Application Entry
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BrowserScreen from './src/screens/BrowserScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Browser"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1976d2',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Browser" 
          component={BrowserScreen}
          options={{ title: '安全浏览器' }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ title: '设置' }}
        />
        <Stack.Screen 
          name="History" 
          component={HistoryScreen}
          options={{ title: '拦截历史' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
