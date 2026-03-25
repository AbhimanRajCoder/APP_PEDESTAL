import '@expo/metro-runtime';
import { ExpoRoot } from 'expo-router';
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';

// Register background handler BEFORE React mounts
messaging().setBackgroundMessageHandler(async remoteMessage => {
});

// Polyfill the React Native Entry Point with Expo Router
export function App() {
    const ctx = require.context('./app');
    return <ExpoRoot context={ctx} />;
}

AppRegistry.registerComponent('main', () => App);
