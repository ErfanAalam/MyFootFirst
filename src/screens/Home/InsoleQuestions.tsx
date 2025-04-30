import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


type AnswerType = {
  ageGroup: string;
  activityLevel: string;
  painLocation: string;
  painFrequency: string;
  footPosture: string;
  archType: string;
  shoeSize: string;
  medicalCondition: string;
};

type ScoreType = {
  Sport: number;
  Comfort: number;
  Stability: number;
};

const options = {
  ageGroup: ['18-40', '41-60', '60+'],
  activityLevel: ['Sedentary', 'Moderate', 'Active'],
  painLocation: ['Heel', 'Arch', 'Forefoot', 'Knee', 'Lower Back'],
  painFrequency: ['Sometimes', 'Regularly', 'Permanently'],
  footPosture: ['Normal', 'Rolling Inwards', 'Rolling Outwards'],
  archType: ['Flat', 'Normal', 'High Arch'],
  shoeSize: ['EU 40', 'EU 41', 'EU 42', 'US 7', 'US 8', 'UK 6', 'UK 7'],
  medicalConditions: ['None', 'Plantar Fasciitis', 'Bunions', 'Others'],
};

const InsoleQuestions = () => {
  const [answers, setAnswers] = useState<AnswerType>({
    ageGroup: '',
    activityLevel: '',
    painLocation: '',
    painFrequency: '',
    footPosture: '',
    archType: '',
    shoeSize: '',
    medicalCondition: '',
  });

  const [modalField, setModalField] = useState<keyof AnswerType | null>(null);

  const updateAnswer = (field: keyof AnswerType, value: string) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
    setModalField(null);
  };

  const calculateRecommendation = () => {
    if(answers.ageGroup === '' || answers.activityLevel === '' || answers.painLocation === '' || answers.painFrequency === '' || answers.footPosture === '' || answers.archType === '' || answers.shoeSize === '' || answers.medicalCondition === '') {
      Alert.alert('Please answer all questions before submitting.');
      return;
    }
    const scores: ScoreType = { Sport: 0, Comfort: 0, Stability: 0 };

    if (answers.ageGroup === '18-40') scores.Sport += 25;
    else if (answers.ageGroup === '41-60') scores.Comfort += 25;
    else if (answers.ageGroup === '60+') scores.Stability += 25;

    if (answers.activityLevel === 'Active') scores.Sport += 25;
    else if (answers.activityLevel === 'Moderate') scores.Comfort += 25;
    else if (answers.activityLevel === 'Sedentary') scores.Stability += 25;

    if (answers.painLocation === 'Forefoot') scores.Sport += 20;
    else if (['Heel', 'Lower Back', 'Knee'].includes(answers.painLocation)) scores.Stability += 20;
    else scores.Comfort += 20;

    if (answers.painFrequency === 'Sometimes') scores.Comfort += 15;
    else if (answers.painFrequency === 'Regularly') scores.Comfort += 15;
    else if (answers.painFrequency === 'Permanently') scores.Stability += 15;
    else scores.Sport += 15;

    if (answers.footPosture === 'Rolling Inwards') scores.Stability += 10;
    else if (answers.footPosture === 'Rolling Outwards') scores.Comfort += 10;
    else if (answers.footPosture === 'Normal') scores.Sport += 10;

    if (answers.archType === 'Flat') scores.Stability += 5;
    else if (answers.archType === 'High Arch') scores.Sport += 5;
    else scores.Comfort += 5;

    const recommended = Object.keys(scores).reduce((a, b) =>
      scores[a as keyof ScoreType] > scores[b as keyof ScoreType] ? a : b
    ) as keyof ScoreType;

    Alert.alert(`Based on your inputs, we recommend: ${recommended} Insole`);
  };

  const renderPicker = (label: string, field: keyof AnswerType, items: string[]) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        onPress={() => setModalField(field)}
        style={styles.selectBox}
      >
        <Text style={styles.selectText}>
          {answers[field] || 'Select an option'}
        </Text>
      </TouchableOpacity>
      {modalField === field && (
        <Modal transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select {label}</Text>
              <FlatList
                data={items}
                keyExtractor={item => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => updateAnswer(field, item)}
                  >
                    <Text>{item}</Text>
                  </TouchableOpacity>
                )}
              />
              <Button onPress={() => setModalField(null)}>Cancel</Button>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
  
  const renderProgressBar = () => {
    const totalQuestions = 8; // Total number of questions
    const answeredQuestions = Object.values(answers).filter(answer => answer !== '').length;
    const progress = (answeredQuestions / totalQuestions) * 100;

    return (
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
        <Text style={styles.progressText}>{Math.round(progress)}% Complete</Text>
      </View>
    );
  };
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Just a few quick questions to understand your feet better.</Text>
      <Text style={styles.headerSubtitle}>Your answers help us personalise your insole recommendation.</Text>
    </View>
  );
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      > */}
        <ScrollView contentContainerStyle={styles.container}>
          {renderHeader()}
          {renderProgressBar()}
          {renderPicker('Age Group', 'ageGroup', options.ageGroup)}
          {renderPicker('Activity Level', 'activityLevel', options.activityLevel)}
          {renderPicker('Where do you feel pain?', 'painLocation', options.painLocation)}
          {renderPicker('How often do you feel pain?', 'painFrequency', options.painFrequency)}
          {renderPicker('How do your feet feel when standing?', 'How do your feet feel when standing?', options.footPosture)}
          {renderPicker('Foot Arch Type', 'archType', options.archType)}
          {renderPicker('Shoe Size', 'shoeSize', options.shoeSize)}
          {renderPicker('Medical Conditions', 'medicalCondition', options.medicalConditions)}

          <View style={styles.button}>
            <Button mode="contained" onPress={calculateRecommendation}>
              Get Recommendation
            </Button>
          </View>
        </ScrollView>
      {/* </KeyboardAvoidingView> */}
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
    paddingBottom: 60,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  selectText: {
    fontSize: 15,
    color: '#333',
  },
  button: {
    marginTop: 30,
    alignSelf: 'center',
    width: '80%',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    marginHorizontal: 30,
    padding: 20,
    borderRadius: 10,
    maxHeight: '70%',
  },
  modalItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
  },
  progressContainer: {
    height: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    textAlign: 'center',
    marginTop: 5,
    color: '#666',
    fontSize: 12,
  },
  headerContainer: {
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
});

export default InsoleQuestions;
