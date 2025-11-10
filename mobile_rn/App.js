/**
 * Content Security Monitor - React Native
 * Main Application Entry Point
 */

import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SettingsProvider} from './src/context/SettingsContext';
import {HistoryProvider} from './src/context/HistoryContext';
import BrowserScreen from './src/screens/BrowserScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SettingsProvider>
      <HistoryProvider>
        <NavigationContainer>
          <StatusBar barStyle="light-content" backgroundColor="#1976d2" />
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
            }}>
            <Stack.Screen
              name="Browser"
              component={BrowserScreen}
              options={{title: '安全浏览器'}}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{title: '设置'}}
            />
            <Stack.Screen
              name="History"
              component={HistoryScreen}
              options={{title: '拦截历史'}}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </HistoryProvider>
    </SettingsProvider>
  );
}
