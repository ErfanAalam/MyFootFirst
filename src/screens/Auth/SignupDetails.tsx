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
  Alert,
  Modal,
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';

const SignupDetails = () => {
  const navigation = useNavigation();

  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [countryCode, setCountryCode] = useState();
  const [callingCode, setCallingCode] = useState();
  const [country, setCountry] = useState(null);

  // For iOS, we'll use a step-by-step approach for year, month, day selection
  const [datePickerStep, setDatePickerStep] = useState('year'); // 'year', 'month', 'day'
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const onSelectCountry = (country: any) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
    setCountry(country.name);
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!firstName || !surname || !email || !password || !dob || !gender) {
      Alert.alert("Validation Error", "All required fields must be filled.");
      return false;
    }
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Password and Confirm Password must match.");
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    // Navigate to next screen or submit data
    navigation.navigate("Goals",{
        firstName,
        surname,
        email,
        password,
        confirmPassword,
        country,
        countryCode,
        phone,
        callingCode,
        gender,
        dob})
  };

  // Modern approach for date picking
  const showDatePickerModal = () => {
    Keyboard.dismiss();
    if (Platform.OS === 'ios') {
      // For iOS, we'll handle a step-by-step approach
      setDatePickerStep('year');
      setSelectedYear(null);
      setSelectedMonth(null);
    }
    setShowDatePicker(true);
  };

  const handleDateConfirm = (date) => {
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
    const date = new Date(selectedYear, selectedMonth, day);
    handleDateConfirm(date);
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

  // Handle gender selection
  const handleGenderSelect = (selectedGender: string) => {
    setGender(selectedGender);
    setShowGenderDropdown(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Sign Up Details</Text>

        <TextInput
          placeholder="First Name"
          placeholderTextColor="#999"
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
        />

        <TextInput
          placeholder="Surname"
          placeholderTextColor="#999"
          style={styles.input}
          value={surname}
          onChangeText={setSurname}
        />

        <TextInput
          placeholder="Email Address"
          placeholderTextColor="#999"
          style={styles.input}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#999"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="#999"
          style={styles.input}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        {/* Gender Dropdown */}
        <TouchableOpacity 
          style={styles.input} 
          onPress={() => setShowGenderDropdown(true)}
        >
          <Text style={gender ? styles.inputText : styles.placeholderText}>
            {gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : 'Select Gender*'}
          </Text>
        </TouchableOpacity>

        {/* Gender Dropdown Modal */}
        <Modal
          visible={showGenderDropdown}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowGenderDropdown(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowGenderDropdown(false)}
          >
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownTitle}>Select Gender</Text>
              <TouchableOpacity 
                style={styles.dropdownOption} 
                onPress={() => handleGenderSelect('male')}
              >
                <Text style={styles.dropdownOptionText}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.dropdownOption} 
                onPress={() => handleGenderSelect('female')}
              >
                <Text style={styles.dropdownOptionText}>Female</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.dropdownOption} 
                onPress={() => handleGenderSelect('other')}
              >
                <Text style={styles.dropdownOptionText}>Other</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.dropdownCancelButton}
                onPress={() => setShowGenderDropdown(false)}
              >
                <Text style={styles.dropdownCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

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
          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            display="inline"
            onConfirm={handleDateConfirm}
            onCancel={() => setShowDatePicker(false)}
            maximumDate={new Date()}
            customPickerIOS={renderDatePickerContent()}
          />
        )}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
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
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
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
  // New styles for custom date picker
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
  suggestionsContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    position: "absolute",
    top: 55,
    left: 0,
    right: 0,
    zIndex: 2,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  lastSuggestionItem: {
    borderBottomWidth: 0,
  },
  suggestionText: {
    fontSize: 14,
  },
  autocompleteContainer: {
    zIndex: 1,
    width: "100%",
    marginBottom: 15,
  },
  inputText: {
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dropdownContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color: '#00843D',
  },
  dropdownOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownCancelButton: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dropdownCancelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'red',
  },
});

export default SignupDetails;