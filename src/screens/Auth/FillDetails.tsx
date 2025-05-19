import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  Keyboard,
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CustomAlertModal from '../../Components/CustomAlertModal';
import { getAuth } from '@react-native-firebase/auth';

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
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FillDetails'>;

const FillDetails = () => {
  const navigation = useNavigation<NavigationProp>();
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [countryCode, setCountryCode] = useState();
  const [callingCode, setCallingCode] = useState();
  const [country, setCountry] = useState(null);

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

  const onSelectCountry = (country: any) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
    setCountry(country.name);
  };

  const validateAndProceed = () => {
    if (!firstName || !surname || !country || !dob) {
      showAlert('Validation Error', 'All required fields must be filled.', 'error');
      return;
    }

    navigation.navigate('GoogleUserActivity', {
      firstName,
      surname,
      country,
      countryCode,
      phone,
      callingCode,
      dob
    });
  };

  const handleDateConfirm = (date: Date) => {
    setSelectedDate(date);
    const formattedDate = date.toLocaleDateString('en-GB');
    setDob(formattedDate);
    setShowDatePicker(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Please provide some additional information to help us serve you better</Text>

        <TextInput
          placeholder="First Name*"
          placeholderTextColor="#999"
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
        />

        <TextInput
          placeholder="Surname*"
          placeholderTextColor="#999"
          style={styles.input}
          value={surname}
          onChangeText={setSurname}
        />

        <View style={styles.countryRow}>
          <CountryPicker
            withFilter
            withFlag
            withCountryNameButton
            withAlphaFilter
            withCallingCode
            onSelect={onSelectCountry}
            countryCode={countryCode}
          />
        </View>

        <View style={styles.phoneRow}>
          <Text style={styles.codeText}>+{callingCode}</Text>
          <TextInput
            placeholder="Phone Number (optional)"
            placeholderTextColor="#999"
            style={styles.phoneInput}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={styles.dateInput}
        >
          <Text style={dob ? styles.dateText : styles.datePlaceholder}>
            {dob || 'Select Date of Birth*'}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date && event.type !== 'dismissed') {
                handleDateConfirm(date);
              }
            }}
            maximumDate={new Date()}
          />
        )}

        <TouchableOpacity style={styles.submitButton} onPress={validateAndProceed}>
          <Text style={styles.submitButtonText}>Continue</Text>
        </TouchableOpacity>
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
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 15,
    color: '#000',
  },
  countryRow: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 10,
    marginBottom: 15,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
  },
  codeText: {
    marginRight: 10,
    fontSize: 16,
    paddingHorizontal: 10,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#000',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  dateText: {
    color: '#333',
  },
  datePlaceholder: {
    color: '#999',
  },
  submitButton: {
    backgroundColor: '#00843D',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FillDetails; 