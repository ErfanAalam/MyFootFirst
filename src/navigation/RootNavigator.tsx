// src/navigation/RootNavigator.tsx
import React from 'react';
import { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaView, StatusBar } from 'react-native';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';
import FootScanScreen from '../screens/Home/FootScanScreen';
import SplashScreen from '../screens/SplashScreen';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InsoleQuestions from '../screens/Home/InsoleQuestions';
import InsoleRecommendation from '../screens/Home/InsoleRecommendation';
import ProductDetailScreen from '../screens/Home/ProductDetailScreen';
import CartScreen from '../screens/Home/CartScreen';
import ShoesSize from '../screens/Home/ShoesSize';
import EcommerceScreen from '../screens/Home/EcommerceScreen';
import Messaging from '../screens/Home/Messaging';
import OrderHistory from '../screens/Home/OrderHistory';
import FillDetails from '../screens/Auth/FillDetails';
import GoogleUserActivity from '../screens/Auth/GoogleUserActivity';
import firestore from '@react-native-firebase/firestore';
import { useUser } from '../contexts/UserContext';

type RootStackParamList = {
  FillDetails: undefined;
  GoogleUserActivity: {
    firstName: string;
    surname: string;
    country: string;
    countryCode: string;
    phone: string;
    callingCode: string;
    dob: string;
  };
  MainTabs: undefined;
  FootScanScreen: undefined;
  InsoleQuestions: undefined;
  InsoleRecommendation: undefined;
  ProductDetail: undefined;
  Cart: undefined;
  ShoesSize: undefined;
  Ecommerce: undefined;
  Messaging: undefined;
  OrderHistory: undefined;
};

interface UserContextType {
  hasProfile: boolean | null;
  setHasProfile: (value: boolean | null) => void;
}

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { hasProfile, setHasProfile } = useUser();

  // Handle initial auth state
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        setHasProfile(true); // Initially set to true when logged in
      } else {
        setIsLoggedIn(false);
        setHasProfile(null);
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
  }, [setHasProfile]);

  // Separate effect to check profile after reaching home screen
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isLoggedIn && hasProfile === true) {
      // Wait 10 seconds after login before checking profile
      timeoutId = setTimeout(async () => {
        try {
          const auth = getAuth();
          const user = auth.currentUser;

          if (user) {
            const userDoc = await firestore()
              .collection('users')
              .doc(user.uid)
              .get();

            setHasProfile(userDoc.exists);
          }
        } catch (error) {
          console.error('Error checking user profile:', error);
          setHasProfile(false);
        }
      }, 5000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoggedIn, hasProfile, setHasProfile]);

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
            {!hasProfile ? (
              // Show profile completion screens for Google login users
              <>
                <Stack.Screen name="FillDetails" component={FillDetails} options={{ headerShown: true,headerTitleAlign: 'center', title:"Submit Your Details" }} />
                <Stack.Screen name="GoogleUserActivity" component={GoogleUserActivity} />
              </>
            ) : (
              // Show main app screens for users with completed profiles
              <>
                <Stack.Screen name="MainTabs" component={AppTabs} />
                <Stack.Screen name="FootScanScreen" component={FootScanScreen} />
                <Stack.Screen name="InsoleQuestions" component={InsoleQuestions} />
                <Stack.Screen name="InsoleRecommendation" component={InsoleRecommendation} />
                <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
                <Stack.Screen name="Cart" component={CartScreen} />
                <Stack.Screen name="ShoesSize" component={ShoesSize} />
                <Stack.Screen name="Ecommerce" component={EcommerceScreen} />
                <Stack.Screen name="Messaging" component={Messaging} />
                <Stack.Screen name="OrderHistory" component={OrderHistory} />
              </>
            )}
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
