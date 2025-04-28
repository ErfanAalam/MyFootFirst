// src/navigation/RootNavigator.tsx
import React from 'react';
import {useEffect,useState} from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaView, StatusBar, Platform } from 'react-native';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';
import FootScanScreen from '../screens/Home/FootScanScreen';
import auth from '@react-native-firebase/auth';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
     const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    useEffect(() => {
      const unsubscribe = auth().onAuthStateChanged(user => {
        if (user) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      });

      return unsubscribe; // unsubscribe on unmount
    }, []);

  return (
    <SafeAreaView style={{ flex: 1}}>
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
