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
  Pressable,
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import CustomAlertModal from '../../Components/CustomAlertModal';

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

  const [alertModal, setAlertModal] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info',
  });

  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const onSelectCountry = (country: any) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
    setCountry(country.name);
  };

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

  const validateAndProceed = () => {
    // Check if all required fields are filled
    if (!firstName || !surname || !email || !password || !confirmPassword || !gender || !dob) {
      showAlert('Validation Error', 'All required fields must be filled.', 'error');
      return;
    }

    // Check if privacy policy is accepted
    if (!privacyPolicyAccepted) {
      showAlert('Privacy Policy', 'Please accept the privacy policy to continue.', 'error');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('Invalid Email', 'Please enter a valid email address.', 'error');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      showAlert('Weak Password', 'Password must be at least 6 characters.', 'error');
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      showAlert('Password Mismatch', 'Password and Confirm Password must match.', 'error');
      return;
    }

    // If all validations pass, proceed with signup
    handleSignup();
  };

  const handleSubmit = () => {
    validateAndProceed();
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

  const handleSignup = () => {
    // Navigate to next screen or submit data
    navigation.navigate("Goals", {
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
      dob
    })
  };

  const PrivacyPolicyModal = () => (
    <Modal
      visible={showPrivacyModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowPrivacyModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.privacyModalContent}>
          <ScrollView style={styles.privacyScrollView}>
            <Text style={styles.privacyTitle}>Privacy Policy</Text>
            <Text style={styles.privacySubtitle}>MyFootFirst</Text>
            <Text style={styles.privacyEffectiveDate}>Effective Date: 10 May 2025</Text>
            
            <Text style={styles.privacyIntro}>
              This Privacy Policy explains how MyFootFirst collects, uses, stores, and shares personal data when you use our mobile applications and services, whether as a business partner (B2B) or an individual customer (B2C), in accordance with the General Data Protection Regulation (GDPR) and other applicable laws.
            </Text>

            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>1. Data Controller</Text>
              <Text style={styles.privacyText}>
                MyFootFirst is the controller of your personal data. For any questions or requests, you may contact us at{' '}
                <Text style={styles.privacyEmail}>info@myfootfirst.com</Text>
              </Text>
            </View>

            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>2. What We Collect</Text>
              <Text style={styles.privacyText}>
                We may collect and process the following categories of personal data:
              </Text>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBulletTitle}>Identity and Contact Data:</Text>
                <Text style={styles.privacyText}>Name, email, business details, and phone number.</Text>
              </View>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBulletTitle}>Health-Related Information:</Text>
                <Text style={styles.privacyText}>Self-declared conditions such as diabetes or hypertension (used to personalize product recommendations).</Text>
              </View>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBulletTitle}>Biometric Data:</Text>
                <Text style={styles.privacyText}>Foot images and measurements for orthotic creation, potentially used for generating anonymized, proprietary 3D models.</Text>
              </View>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBulletTitle}>Transaction Data:</Text>
                <Text style={styles.privacyText}>Purchase and payment information via providers like Stripe.</Text>
              </View>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBulletTitle}>Technical Data:</Text>
                <Text style={styles.privacyText}>Device ID, app usage, crash logs, and location (if permission granted).</Text>
              </View>
            </View>

            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>3. How We Use Your Data</Text>
              <Text style={styles.privacyText}>We use your data to:</Text>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBullet}>•</Text>
                <Text style={styles.privacyText}>Provide and improve our services</Text>
              </View>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBullet}>•</Text>
                <Text style={styles.privacyText}>Customize your experience</Text>
              </View>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBullet}>•</Text>
                <Text style={styles.privacyText}>Create and deliver orthotic products</Text>
              </View>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBullet}>•</Text>
                <Text style={styles.privacyText}>Fulfill legal and contractual obligations</Text>
              </View>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBullet}>•</Text>
                <Text style={styles.privacyText}>Conduct anonymized product development and analytics</Text>
              </View>
              <Text style={[styles.privacyText, styles.privacyNote]}>
                All processing is based on one or more lawful bases under GDPR: consent, performance of a contract, legal obligation, or legitimate interest.
              </Text>
            </View>

            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>4. Data Retention</Text>
              <Text style={styles.privacyText}>
                We retain personal data for as long as necessary to fulfill the purposes outlined above, including up to 1 year for biometric data. Anonymized data may be retained longer for R&D purposes.
              </Text>
            </View>

            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>5. Sharing and Third Parties</Text>
              <Text style={styles.privacyText}>
                We use third-party services (e.g., Stripe, AWS, Firebase) for storage, payment processing, and analytics. These services are independently responsible for GDPR compliance. We do not sell your personal data.
              </Text>
            </View>

            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>6. Your Rights (Under GDPR)</Text>
              <Text style={styles.privacyText}>You have the right to:</Text>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBullet}>•</Text>
                <Text style={styles.privacyText}>Access your data</Text>
              </View>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBullet}>•</Text>
                <Text style={styles.privacyText}>Correct or delete your data</Text>
              </View>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBullet}>•</Text>
                <Text style={styles.privacyText}>Restrict or object to processing</Text>
              </View>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBullet}>•</Text>
                <Text style={styles.privacyText}>Data portability</Text>
              </View>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBullet}>•</Text>
                <Text style={styles.privacyText}>Withdraw consent at any time</Text>
              </View>
              <Text style={[styles.privacyText, styles.privacyNote]}>
                Requests can be sent to{' '}
                <Text style={styles.privacyEmail}>info@myfootfirst.com</Text>
                . We will respond within 30 days.
              </Text>
            </View>

            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>7. Security</Text>
              <Text style={styles.privacyText}>
                We take reasonable technical and organizational measures to protect your data, but we cannot guarantee security of third-party platforms or user-managed access.
              </Text>
            </View>

            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>8. Responsibilities of Business Users</Text>
              <Text style={styles.privacyText}>
                Retailers and other business users are responsible for ensuring their use of the platform and any employee or customer data they input complies with applicable data protection laws.
              </Text>
            </View>
          </ScrollView>
          <TouchableOpacity
            style={styles.closePrivacyButton}
            onPress={() => setShowPrivacyModal(false)}
          >
            <Text style={styles.closePrivacyButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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

        <View style={styles.privacyContainer}>
          <Pressable
            style={styles.checkboxContainer}
            onPress={() => setPrivacyPolicyAccepted(!privacyPolicyAccepted)}
          >
            <View style={[styles.checkbox, privacyPolicyAccepted && styles.checkboxChecked]}>
              {privacyPolicyAccepted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.privacyTextContainer}>
              <Text style={styles.privacyLabel}>
                I accept the{' '}
                <Text
                  style={styles.privacyLink}
                  onPress={() => setShowPrivacyModal(true)}
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </Pressable>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Continue</Text>
        </TouchableOpacity>

        <PrivacyPolicyModal />
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
  privacyContainer: {
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#00843D',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#00843D',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  privacyTextContainer: {
    flex: 1,
  },
  privacyLabel: {
    fontSize: 14,
    color: '#333',
  },
  privacyLink: {
    color: '#00843D',
    textDecorationLine: 'underline',
  },
  privacyModalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 24,
    width: '90%',
    maxHeight: '85%',
    margin: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  privacyScrollView: {
    maxHeight: '90%',
  },
  privacyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00843D',
    marginBottom: 8,
    textAlign: 'center',
  },
  privacySubtitle: {
    fontSize: 20,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  privacyEffectiveDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  privacyIntro: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 24,
    textAlign: 'justify',
  },
  privacySection: {
    marginBottom: 24,
  },
  privacySectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00843D',
    marginBottom: 12,
  },
  privacyText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 8,
  },
  privacyBulletPoint: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  privacyBulletTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  privacyBullet: {
    fontSize: 15,
    color: '#00843D',
    marginRight: 8,
    width: 20,
  },
  privacyNote: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 12,
  },
  privacyEmail: {
    color: '#00843D',
    textDecorationLine: 'underline',
  },
  closePrivacyButton: {
    backgroundColor: '#00843D',
    padding: 16,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  closePrivacyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignupDetails;