import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Modal,
    Platform,
    Keyboard,
} from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import CustomAlertModal from '../../Components/CustomAlertModal';
import { useUser } from '../../contexts/UserContext';

type RootStackParamList = {
    GoogleUserActivity: {
        firstName: string;
        surname: string;
        country: string;
        countryCode: string;
        phone: string;
        callingCode: string;
        dob: string;
    };
    MainTabs: undefined;
};

type GoogleUserActivityRouteProp = RouteProp<RootStackParamList, 'GoogleUserActivity'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GoogleUserActivity'>;

const GoogleUserActivity = ({ route }: { route: GoogleUserActivityRouteProp }) => {
    const navigation = useNavigation<NavigationProp>();
    const { firstName, surname, country, countryCode, phone, callingCode, dob } = route.params;
    const { hasProfile, setHasProfile } = useUser();

    const [selectedLevel, setSelectedLevel] = useState('active');
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


    const handleSubmit = async () => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                showAlert('Error', 'User not logged in', 'error');
                return;
            }

            await firestore()
                .collection('users')
                .doc(user.uid)
                .set({
                    uid: user.uid,
                    email: user.email, // Added email from auth
                    firstName,
                    surname,
                    country,
                    countryCode,
                    phone,
                    callingCode,
                    dob,
                    activityLevel: selectedLevel,
                    createdAt: new Date(),
                });

            // navigation.navigate('MainTabs');
            setHasProfile(true);
        } catch (error) {
            showAlert('Error', 'Failed to save user data', 'error');
        }
    };

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
                    onPress={handleSubmit}
                >
                    <Text style={styles.nextButtonText}>Complete</Text>
                </TouchableOpacity>
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
        width: '80%',
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
    cancelButton: {
        marginTop: 15,
        padding: 10,
        alignSelf: 'center',
    },
    cancelButtonText: {
        color: 'red',
        fontSize: 16,
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
});

export default GoogleUserActivity; 