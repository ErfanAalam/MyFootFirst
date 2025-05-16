// App.tsx
import React from 'react';
import { useEffect } from 'react'
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import RootNavigator from './src/navigation/RootNavigator.tsx'
import { UserProvider } from './src/contexts/UserContext';
import { CartProvider } from './src/contexts/CartContext';

const App = () => {

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '503667392757-496lchn6jf0v7a53hqe0jkkq044b7m16.apps.googleusercontent.com', // Updated to match google-services.json
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <UserProvider>
          <CartProvider>
            <RootNavigator />
          </CartProvider>
        </UserProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
};

export default App;
