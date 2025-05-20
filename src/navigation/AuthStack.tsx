// src/navigation/AuthStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView, StatusBar, Platform } from 'react-native';
import WelcomeScreen from '../screens/Auth/WelcomeScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import SignupDetails from '../screens/Auth/SignupDetails';
import Goals from '../screens/Auth/Goals';
import { AuthStackParamList } from '../types/navigation';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => (
  <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
    <StatusBar backgroundColor="#ffffff" barStyle="light-content" />
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: true,
        headerTitleStyle: { color: 'black' }, 
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{headerShown:false}} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="SignupDetails" component={SignupDetails} options={{title:"Sign Up Details"}} />
      <Stack.Screen name="Goals" component={Goals} options={{title:"Activity Level"}} />
      <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} options={{title:"Forget Password"}} />
    </Stack.Navigator>
  </SafeAreaView>
);

export default AuthStack;
