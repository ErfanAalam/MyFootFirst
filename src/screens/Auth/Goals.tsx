import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Alert } from 'react-native';

type RootStackParamList = {
  Goals: {
    firstName: string;
    surname: string;
    email: string;
    password: string;
    confirmPassword: string;
    country: string;
    countryCode: string;
    phone: string;
    callingCode: string;
    dob: string;
    gender: string;
  };
  Home: undefined;
};

type GoalsRouteProp = RouteProp<RootStackParamList, 'Goals'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Goals'>;

const Goals = ({ route }: { route: GoalsRouteProp }) => {
    const navigation = useNavigation<NavigationProp>();
    const { firstName, surname, email, password, confirmPassword, country,
        countryCode, phone, callingCode, dob, gender } = route.params;

  const [selectedLevel, setSelectedLevel] = useState('active');

  const activityLevels = [
    {
      id: 'Sedentary',
      title: 'Sedentary',
    },
    {
      id: 'Moderate',
      title: 'Moderate',
    },
    {
      id: 'Active',
      title: 'Active',
    },
  ];

    const handleSignUp = async () => {
          try {
           const userCredential = await getAuth().createUserWithEmailAndPassword(email, password);
            // Optionally, save user data to Firestore
           await firestore()
             .collection('users')
             .doc(userCredential.user.uid)  // use UID as document ID
             .set({
               uid: userCredential.user.uid,
               firstName,
               surname,
               email,
               country,
               countryCode,
               phone,
               callingCode,
               dob,
               activityLevel: selectedLevel,
               gender,
               createdAt: new Date(),
             });
        // navigation.navigate('Home');
          } catch (error: any) {
            console.error('Error signing up:', error);
             Alert.alert("Signup Error", error.message);
          }
        };

//   const handleNext = () => {
//     // Navigate to the next screen with the selected activity level
//     navigation.navigate('NextScreen', { activityLevel: selectedLevel });
//   };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>What is your baseline activity level?</Text>
        <Text style={styles.subtitle}>Not including workouts - we count that separately</Text>

        {activityLevels.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.optionContainer,
              selectedLevel === level.id && styles.optionContainerSelected
            ]}
            onPress={() => setSelectedLevel(level.id)}
          >
            <View style={styles.radioWrapper}>
              <View style={styles.textContainer}>
                <Text style={styles.optionTitle}>{level.title}</Text>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  selectedLevel === level.id && styles.radioOuterSelected,
                ]}
              >
                {selectedLevel === level.id && <View style={styles.radioInner} />}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleSignUp}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 32,
  },
  optionContainer: {
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
  },
  optionContainerSelected: {
    borderColor: '#00843D',
  },
  radioWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radioOuter: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#00843D',
  },
  radioInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: '#00843D',
  },  
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  optionTitle: {  
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666666',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  backButton: {
    width: 80,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: '#555555',
    fontSize: 16,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#00843D',
    borderRadius: 24,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Goals;