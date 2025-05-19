import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Platform,
} from 'react-native';
import { getAuth, GoogleAuthProvider, OAuthProvider } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import CustomAlertModal from '../../Components/CustomAlertModal';
import firestore from '@react-native-firebase/firestore';
import { appleAuth } from '@invertase/react-native-apple-authentication';

// Define navigation types
type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  MainTabs: undefined;
  Home: undefined;
  ForgotPasswordScreen: undefined;
  SignupDetails: undefined;
};

// Export the logout function so it can be used by other screens
export const handleLogout = async () => {
  try {
    await getAuth().signOut();
    await GoogleSignin.signOut();
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleLogin = async () => {
    try {
      setLoading(true);
      await getAuth().signInWithEmailAndPassword(email, password);
    } catch (error: any) {
      // Check for specific Firebase auth error codes
      switch (error.code) {
        case 'auth/invalid-email':
          showAlert('Invalid Email', 'Please enter a valid email address.', 'error');
          break;
        case 'auth/user-disabled':
          showAlert('Account Disabled', 'This account has been disabled. Please contact support.', 'error');
          break;
        case 'auth/user-not-found':
          showAlert('Account Not Found', 'No account found with this email address.', 'error');
          break;
        case 'auth/wrong-password':
          showAlert('Invalid Password', 'The password you entered is incorrect.', 'error');
          break;
        case 'auth/too-many-requests':
          showAlert('Too Many Attempts', 'Too many failed login attempts. Please try again later.', 'error');
          break;
        default:
          // Handle empty inputs
          if (!email.trim()) {
            showAlert('Email Required', 'Please enter your email address.', 'error');
          } else if (!password.trim()) {
            showAlert('Password Required', 'Please enter your password.', 'error');
          } else {
            showAlert('Login Error', 'An unexpected error occurred. Please try again.', 'error');
          }
      }
    } finally {
      setLoading(false);
    }
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

      if (!userDoc.exists) {
        // If user doesn't exist in Firestore, they are new
        // navigation.navigate('SignupDetails');
        
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
    if (Platform.OS !== 'ios') {
      showAlert('Not Available', 'Apple Sign-In is only available on iOS devices.', 'info');
      return;
    }

    try {
      setLoading(true);
      
      // Start the sign-in request
      const appleAuthResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      // Ensure Apple returned a user identityToken
      if (!appleAuthResponse.identityToken) {
        throw new Error('Apple Sign-In failed - no identify token returned');
      }

      // Create a Firebase credential from the response
      const { identityToken, nonce } = appleAuthResponse;
      const appleCredential = OAuthProvider.credential('apple.com', identityToken, nonce);

      // Sign in with credential
      const userCredential = await getAuth().signInWithCredential(appleCredential);

      // If the user's name is available, update their profile
      if (appleAuthResponse.fullName) {
        const { givenName, familyName } = appleAuthResponse.fullName;
        const displayName = `${givenName || ''} ${familyName || ''}`.trim();
        
        if (displayName) {
          await userCredential.user.updateProfile({
            displayName,
          });
        }
      }

      // Check if user exists in Firestore
      const userDoc = await firestore()
        .collection('users')
        .doc(userCredential.user.uid)
        .get();

      if (!userDoc.exists) {
        // If user doesn't exist in Firestore, they are new
        // navigation.navigate('SignupDetails');
      }

    } catch (error: any) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        showAlert('Account Exists', 'An account already exists with this email using a different sign-in method.', 'error');
      } else {
        showAlert('Sign-In Error', 'Failed to sign in with Apple. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.inputLabel}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder=""
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />

        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder=""
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Signing in...' : 'Log In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotPasswordContainer}
          onPress={() => navigation.navigate('ForgotPasswordScreen')}
          disabled={loading}
        >
          <Text style={styles.forgotPasswordText}>Forgot password?</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity
          style={[styles.socialButton, loading && styles.disabledButton]}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
            style={styles.socialIcon}
          />
          <Text style={styles.socialButtonText}>Continue with Google</Text>
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
          <Text style={styles.socialButtonText}>Continue with Apple</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          We will never post anything without your permission.
        </Text>
      </View>
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
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 18,
    color: '#000000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholderView: {
    width: 30,
  },
  formContainer: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: 'black',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#00843D',
    borderRadius: 4,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: '#757575',
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#757575',
    fontSize: 14,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
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
  footer: {
    position: 'relative',
    bottom: -200,
    left: 0,
    right: 0,
    alignItems: 'center',
    padding: 16,
    zIndex: 0,
  },
  footerText: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
  },
});

export default LoginScreen;