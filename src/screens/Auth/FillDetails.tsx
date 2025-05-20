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
  Modal,
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
  const [datePickerStep, setDatePickerStep] = useState('year'); // 'year', 'month', 'day'
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

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

  const showDatePickerModal = () => {
    Keyboard.dismiss();
    if (Platform.OS === 'ios') {
      setDatePickerStep('year');
      setSelectedYear(null);
      setSelectedMonth(null);
    }
    setShowDatePicker(true);
  };

  const handleDateConfirm = (date: Date) => {
    setSelectedDate(date);
    const formattedDate = date.toLocaleDateString('en-GB');
    setDob(formattedDate);
    setShowDatePicker(false);
  };

  // For iOS step by step approach
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 100; i--) {
      years.push(i);
    }
    return years;
  };

  const generateMonthOptions = () => {
    return [
      { value: 0, label: 'January' },
      { value: 1, label: 'February' },
      { value: 2, label: 'March' },
      { value: 3, label: 'April' },
      { value: 4, label: 'May' },
      { value: 5, label: 'June' },
      { value: 6, label: 'July' },
      { value: 7, label: 'August' },
      { value: 8, label: 'September' },
      { value: 9, label: 'October' },
      { value: 10, label: 'November' },
      { value: 11, label: 'December' },
    ];
  };

  const generateDayOptions = () => {
    if (!selectedYear || selectedMonth === null) return [];

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setDatePickerStep('month');
  };

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    setDatePickerStep('day');
  };

  const handleDaySelect = (day: number) => {
    if (selectedYear !== null && selectedMonth !== null) {
      const date = new Date(selectedYear, selectedMonth, day);
      handleDateConfirm(date);
    }
  };

  const renderDatePickerContent = () => {
    if (Platform.OS === 'android') {
      return null; // Android uses the native date picker
    } else if (Platform.OS === 'ios') {
      // Step-by-step approach for iOS
      if (datePickerStep === 'year') {
        return (
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Year</Text>
            <View style={styles.optionsContainer}>
              {generateYearOptions().map((year) => (
                <TouchableOpacity
                  key={year}
                  style={styles.optionButton}
                  onPress={() => handleYearSelect(year)}
                >
                  <Text style={styles.optionText}>{year}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        );
      } else if (datePickerStep === 'month') {
        return (
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Month</Text>
            <View style={styles.optionsContainer}>
              {generateMonthOptions().map((month) => (
                <TouchableOpacity
                  key={month.value}
                  style={styles.optionButton}
                  onPress={() => handleMonthSelect(month.value)}
                >
                  <Text style={styles.optionText}>{month.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setDatePickerStep('year')}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        );
      } else if (datePickerStep === 'day') {
        return (
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Day</Text>
            <View style={styles.optionsContainer}>
              {generateDayOptions().map((day) => (
                <TouchableOpacity
                  key={day}
                  style={styles.optionButton}
                  onPress={() => handleDaySelect(day)}
                >
                  <Text style={styles.optionText}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setDatePickerStep('month')}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        );
      }
    }
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
          onPress={showDatePickerModal}
          style={styles.dateInput}
        >
          <Text style={dob ? styles.dateText : styles.datePlaceholder}>
            {dob || 'Select Date of Birth*'}
          </Text>
        </TouchableOpacity>

        {/* Date Picker Modal */}
        {Platform.OS === 'android' ? (
          showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date && event.type !== 'dismissed') {
                  handleDateConfirm(date);
                }
              }}
              maximumDate={new Date()}
            />
          )
        ) : (
          <Modal
            visible={showDatePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.modalOverlay}>
              {renderDatePickerContent()}
            </View>
          </Modal>
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#007bff',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    margin: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 70,
  },
  optionText: {
    fontSize: 16,
  },
  backButton: {
    marginTop: 15,
    padding: 10,
    alignSelf: 'center',
  },
  backButtonText: {
    color: '#007bff',
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 15,
    padding: 10,
    alignSelf: 'center',
  },
  cancelButtonText: {
    color: 'red',
    fontSize: 16,
  },
});

export default FillDetails; 