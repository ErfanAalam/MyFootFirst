// App.tsx
import React from 'react';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import RootNavigator from './src/navigation/RootNavigator.tsx'
import { UserProvider } from './src/contexts/UserContext';
import { CartProvider } from './src/contexts/CartContext';
// import { StripeProvider } from '@stripe/stripe-react-native';

const App = () => {

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: Platform.select({
        ios: 'YOUR_IOS_WEB_CLIENT_ID', // Replace with your iOS web client ID
        android: '503667392757-496lchn6jf0v7a53hqe0jkkq044b7m16.apps.googleusercontent.com',
        default: '503667392757-496lchn6jf0v7a53hqe0jkkq044b7m16.apps.googleusercontent.com',
      }),
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }, []);

  return (
    // <StripeProvider
    //   publishableKey="pk_test_51RGKYsKy9tcCJAd4Bkmc3KV0l8WimiSruQUzL6blqouAm1SaULVIE4eCXgGCJtqTi1DvUI1ZELhsxuIKjYA9lLWl00N4hku58B" // Replace with your actual publishable key
    // >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider>
          <UserProvider>
            <CartProvider>
              <RootNavigator />
            </CartProvider>
          </UserProvider>
        </PaperProvider>
      </GestureHandlerRootView>
    // </StripeProvider>
  );
};

export default App;
