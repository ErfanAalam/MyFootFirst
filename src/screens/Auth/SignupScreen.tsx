import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getAuth, GoogleAuthProvider } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import CustomAlertModal from '../../Components/CustomAlertModal';

const { width } = Dimensions.get('window');

// Define navigation types
type RootStackParamList = {
  Welcome: undefined;
  Signup: undefined;
  SignupDetails: undefined;
  MainTabs: undefined;
  Home: undefined;
};

const SignupScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info',
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertModal({
      visible: true,
      title,
      message,
      type,
    });
  };

  const hideAlert = () => {
    setAlertModal(prev => ({ ...prev, visible: false }));
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      // Ensure Google Play services are available
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Get the user's tokens
      await GoogleSignin.signIn();
      const { accessToken } = await GoogleSignin.getTokens();

      // Create a Google credential with the access token
      const googleCredential = GoogleAuthProvider.credential(undefined, accessToken);

      // Sign-in the user with the credential
      const userCredential = await getAuth().signInWithCredential(googleCredential);

      // Check if user exists in Firestore
      const userDoc = await firestore()
        .collection('users')
        .doc(userCredential.user.uid)
        .get();

        console.log(userDoc);

      if (!userDoc.exists) {
        // If user doesn't exist in Firestore, they are new
        navigation.navigate('SignupDetails');
        console.log('in if statement');
      } else {
        // If user exists in Firestore, they are existing
        console.log('in else statement');
        navigation.navigate('MainTabs');
      }
    } catch (error: any) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        showAlert('Account Exists', 'An account already exists with this email using a different sign-in method.', 'error');
      } else {
        showAlert('Sign-In Error', 'Failed to sign in with Google. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (Platform.OS === 'ios') {
      showAlert('Coming Soon', 'Apple Sign-In will be available soon!', 'info');
    } else {
      showAlert('Not Available', 'Apple Sign-In is only available on iOS devices.', 'info');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>
          Welcome! Let's customize{'\n'}MyFirstFoot for your goals.
        </Text>

        <TouchableOpacity
          style={[styles.continueButton, loading && styles.disabledButton]}
          onPress={() => navigation.navigate('SignupDetails')}
          disabled={loading}
        >
          <Text style={styles.continueText}>
            {loading ? 'Please wait...' : 'Continue'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.orText}>OR</Text>

        <TouchableOpacity 
          style={[styles.socialButton, loading && styles.disabledButton]} 
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
            style={styles.socialIcon}
          />
          <Text style={styles.socialButtonText}>
            {loading ? 'Signing in...' : 'Continue with Google'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.socialButton, loading && styles.disabledButton]}
          onPress={handleAppleSignIn}
          disabled={loading}
        >
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/0/747.png' }}
            style={styles.socialIcon}
          />
          <Text style={styles.socialButtonText}>
            {loading ? 'Signing in...' : 'Continue with Apple'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.privacyText}>
          We will collect personal information from and about you and use it for
          various purposes, including to customize your MyFitnessPal experience.
          Read more about the purposes, our practices, your choices, and your
          rights in our <Text style={styles.link}>Privacy Policy</Text>.
        </Text>
      </ScrollView>
      <CustomAlertModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
    justifyContent: 'center',
    marginTop: 200,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '600',
    marginVertical: 20,
  },
  continueButton: {
    backgroundColor: '#00843D',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  continueText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  orText: {
    marginVertical: 20,
    fontSize: 14,
    color: '#999',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    width: '100%',
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 14,
    color: '#212121',
  },
  privacyText: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    marginTop: 30,
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default SignupScreen;