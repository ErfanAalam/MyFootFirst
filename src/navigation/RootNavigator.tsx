// src/navigation/RootNavigator.tsx
import React from 'react';
import { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaView, StatusBar, Platform } from 'react-native';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';
import FootScanScreen from '../screens/Home/FootScanScreen';
import SplashScreen from '../screens/SplashScreen';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InsoleQuestions from '../screens/Home/InsoleQuestions';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    });

    // Show splash screen for 2 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar backgroundColor="#ffffff" barStyle="light-content" />
      <NavigationContainer>
        {isLoggedIn ? (
          <Stack.Navigator screenOptions={{
            headerShown: false,
            headerStyle: {
              backgroundColor: '#ffffff',
            },
            headerShadowVisible: false,
          }}>
            <Stack.Screen name="MainTabs" component={AppTabs} />
            <Stack.Screen name="FootScanScreen" component={FootScanScreen} />
            <Stack.Screen name="InsoleQuestions" component={InsoleQuestions}/>
          </Stack.Navigator>
        ) : (
          <AuthStack />
        )}
      </NavigationContainer>
    </SafeAreaView>
  );
};

export default RootNavigator;

// 608411623919-0ggji53i05h7fnkbg5cj9qbo1ctf545m.apps.googleusercontent.com
