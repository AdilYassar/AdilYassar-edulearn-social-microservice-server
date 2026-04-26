/**
 * Firebase Device Token Registration for React Native
 * 
 * This code handles FCM token registration from your React Native app
 * Flow: Frontend → Microservice → Stored & Synced to Quiz Server
 */

// ============================================
// Step 1: Setup Firebase Messaging (app.js or main entry file)
// ============================================

import { initializeApp } from 'firebase/app';
import { getMessaging, onMessage, getToken } from 'firebase/messaging';
import * as Notifications from 'expo-notifications';

// Your Firebase config (get from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "edulearn-ce604.firebaseapp.com",
  projectId: "edulearn-ce604",
  storageBucket: "edulearn-ce604.appspot.com",
  messagingSenderId: "879016351282",
  appId: "1:879016351282:web:...",
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const messaging = getMessaging(firebaseApp);

// ============================================
// Step 2: Request Notification Permissions (App.js)
// ============================================

export async function requestNotificationPermission() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }
    console.log('Notification permission granted');
    return true;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

// ============================================
// Step 3: Get Device Token and Register
// ============================================

import { getDeviceNameAsync } from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function registerDeviceToken(authToken, quizServerUUID, userEmail) {
  try {
    // 1. Get FCM token from Expo
    const expoPushTokenString = (
      await Notifications.getExpoPushTokenAsync()
    ).data;

    console.log('Expo Push Token:', expoPushTokenString);

    // 2. Get device info
    const deviceName = await getDeviceNameAsync();
    const osVersion = Platform.OS === 'ios' ? 
      Platform.Version : 
      `Android ${Platform.Version}`;

    const appVersion = Constants.expoConfig?.version || '1.0.0';

    // 3. Determine device type
    const { width } = Dimensions.get('window');
    const isTablet = width >= 600;
    const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';

    // 4. Call Microservice API to register token
    const response = await fetch(
      'http://your-microservice-url:4001/api/v1/notifications/device-token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          token: expoPushTokenString,
          deviceType: deviceType,
          deviceName: deviceName || `${Platform.OS} Device`,
          osVersion: osVersion,
          appVersion: appVersion,
          email: userEmail,
          quizServerUUID: quizServerUUID // Your actual user ID from Quiz Server
        })
      }
    );

    const data = await response.json();

    if (data.status === 'success') {
      console.log('✅ Device token registered successfully');
      console.log('Device:', data.data);

      // Store token locally for later reference
      await AsyncStorage.setItem(
        'firebaseDeviceToken',
        expoPushTokenString
      );

      return { success: true, token: expoPushTokenString };
    } else {
      console.error('❌ Failed to register device token:', data.message);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.error('Error registering device token:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// Step 4: Listen for Notifications (Foreground)
// ============================================

export function setupNotificationListeners() {
  // Handle notifications when app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      console.log('📲 Notification received (foreground):', notification);
      // Return how to handle the notification
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true
      };
    }
  });

  // Listen for incoming notifications
  const notificationListener =
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('🔔 Notification:', notification);
    });

  // Listen for notification responses (user tapped notification)
  const responseListener =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 User tapped notification:', response);
      
      const { notification } = response;
      const data = notification.request.content.data;

      // Navigate based on notification type
      handleNotificationTap(data);
    });

  // Return cleanup function
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

// ============================================
// Step 5: Handle Notification Taps
// ============================================

function handleNotificationTap(data) {
  switch (data.type) {
    case 'quiz_assigned':
      // Navigate to quiz
      console.log('Navigate to quiz:', data.quizId);
      break;
    case 'quiz_completed':
      // Navigate to results
      console.log('Navigate to results:', data.quizId);
      break;
    case 'achievement_unlocked':
      // Show achievement
      console.log('Achievement unlocked:', data.name);
      break;
    case 'friend_request':
      // Navigate to friends
      console.log('Navigate to friend requests');
      break;
    case 'message_received':
      // Navigate to chat
      console.log('Navigate to chat:', data.conversationId);
      break;
    default:
      console.log('Unknown notification type:', data.type);
  }
}

// ============================================
// Step 6: Unregister Token on Logout
// ============================================

export async function unregisterDeviceToken(authToken) {
  try {
    const token = await AsyncStorage.getItem('firebaseDeviceToken');

    if (!token) {
      console.log('No device token to unregister');
      return { success: true };
    }

    const response = await fetch(
      `http://your-microservice-url:4001/api/v1/notifications/device-token/${token}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    const data = await response.json();

    if (data.status === 'success') {
      console.log('✅ Device token unregistered');
      await AsyncStorage.removeItem('firebaseDeviceToken');
      return { success: true };
    } else {
      console.error('Failed to unregister token:', data.message);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.error('Error unregistering device token:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// Step 7: Use in Your App
// ============================================

/**
 * Example: In your Login/Auth screen after successful login
 */

import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useAuth } from './context/AuthContext'; // Your auth context

export function HomeScreen() {
  const { authToken, user } = useAuth(); // Get auth token and user data

  useEffect(() => {
    setupNotifications();
  }, [authToken, user]);

  async function setupNotifications() {
    if (!authToken || !user?.quizServerUUID) {
      console.log('Not authenticated, skipping notification setup');
      return;
    }

    // 1. Request permissions
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    // 2. Setup listeners for incoming notifications
    const cleanup = setupNotificationListeners();

    // 3. Register device token
    const result = await registerDeviceToken(
      authToken,
      user.quizServerUUID  // <-- Your actual Quiz Server UUID
    );

    if (result.success) {
      console.log('✅ Notifications setup complete');
    } else {
      console.error('❌ Failed to setup notifications:', result.error);
    }

    return cleanup;
  }

  return (
    <View>
      <Text>Welcome {user?.name}!</Text>
    </View>
  );
}

/**
 * Example: In your Logout handler
 */

export function LogoutButton() {
  const { authToken, logout } = useAuth();

  async function handleLogout() {
    // 1. Unregister device token
    await unregisterDeviceToken(authToken);

    // 2. Call logout
    logout();
  }

  return (
    <TouchableOpacity onPress={handleLogout}>
      <Text>Logout</Text>
    </TouchableOpacity>
  );
}
