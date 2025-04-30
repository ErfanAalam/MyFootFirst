// App.tsx
import React from 'react';
import {useEffect} from 'react'
import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import RootNavigator from './src/navigation/RootNavigator.tsx'

const App = () => {

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '608411623919-0ggji53i05h7fnkbg5cj9qbo1ctf545m.apps.googleusercontent.com', // Required for Firebase Auth
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <RootNavigator />
      </PaperProvider>
    </GestureHandlerRootView>
  );
};

export default App;