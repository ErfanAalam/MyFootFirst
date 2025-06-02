import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar as RNStatusBar,
  Image,
} from 'react-native';
// import { WebView } from 'react-native-webview';
import { Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FootDiagram from '../../Components/FootDiagram';
import { useUser } from '../../contexts/UserContext';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import CustomAlertModal from '../../Components/CustomAlertModal';

// Define the navigation types
type RootStackParamList = {
  Home: undefined;
  FootScanScreen: undefined;
  InsoleQuestions: undefined;
  CategoryProducts: { category: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

// Add Category type
type Category = {
  id: string;
  name: string;
  imageUrl: string;
};

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { userData } = useUser();
  const [selectedFoot, setSelectedFoot] = useState<'left' | 'right'>('left');
  const [painPoints, setPainPoints] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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

  const handlePainPointSelection = (pointId: string) => {
    setPainPoints((prev) =>
      prev.includes(pointId)
        ? prev.filter((id) => id !== pointId)
        : [...prev, pointId]
    );
  };

  const handleScanFoot = async () => {
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
        .update({
          painPoints: painPoints,
        });

      navigation.navigate('FootScanScreen');
      // navigation.navigate('InsoleQuestions');
    } catch (error) {
      showAlert('Error', 'Failed to save pain points', 'error');
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoryImagesRef = firestore().collection('categoryImages');
        const snapshot = await categoryImagesRef.get();

        const fetchedCategories = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.id.charAt(0).toUpperCase() + doc.id.slice(1), // Capitalize first letter
          imageUrl: doc.data().imageUrl
        }));

        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        showAlert('Error', 'Failed to load categories', 'error');
      }
    };

    fetchCategories();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar backgroundColor="#000000" translucent={true} />
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.username}>Hi, {userData ? `${userData.firstName} ${userData.surname}` : "User"}</Text>
        </View>

        <View style={styles.fitCheckContainer}>
          <Text style={styles.fitCheckTitle}>Start Your Personal Fit Check </Text>
          <Text style={styles.fitCheckDescription}>Takes just a few minutes — we guide you step by step. The more info you give, the better we match your insoles. You can skip
            some steps if you prefer.</Text>


          <View style={styles.painSection}>
            <Text style={styles.sectionTitle}>
              Tell us where it hurts — or skip if your feet feel fine
            </Text>

            <View style={styles.footSelector}>
              {["left", "right"].map((foot) => (
                <TouchableOpacity
                  key={foot}
                  style={[
                    styles.footButton,
                    selectedFoot === foot && styles.footButtonSelected,
                  ]}
                  onPress={() => setSelectedFoot(foot as "left" | "right")}
                >
                  <Text
                    style={[
                      styles.radioLabel,
                      selectedFoot === foot && { color: "#fff" },
                    ]}
                  >
                    {foot === "left" ? "Left Foot" : "Right Foot"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.footDiagramContainer}>
              <FootDiagram
                foot={selectedFoot}
                selectedPoints={painPoints}
                onSelectPoint={handlePainPointSelection}
              />
            </View>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleScanFoot}
            >
              <Text style={styles.buttonText}>Scan Your Foot</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.recommendationsContainer}>
          <Text style={styles.recommendationsTitle}>Recommendations for You</Text>

          <View style={styles.gridContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.gridItem}
                onPress={() => navigation.navigate('CategoryProducts', { category: category.id })}
                activeOpacity={0.8}
              >
                <View style={styles.categoryCard}>
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: category.imageUrl }}
                      style={styles.categoryImage}
                      resizeMode="cover"
                    />
                    <View style={styles.overlay} />
                  </View>
                  <View style={styles.categoryContent}>
                    <Text style={styles.categoryTitle} numberOfLines={2}>
                      {category.name}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.stepIndicatorContainer}>
        {[1, 2, 3, 4, 5, 6].map((step) => (
          <View
            key={step}
            style={[
              styles.stepbar,
              step === 1 ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
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
    backgroundColor: "#fff",
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  username: {
    fontFamily: "OpenSans-Light",
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  fitCheckContainer: {
    margin: 15,
    elevation: 3,
  },
  fitCheckTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  fitCheckDescription: {
    fontSize: 16,
    marginBottom: 5,
    color: "#555",
  },
  fitCheckSubDescription: {
    fontSize: 14,
    color: "#777",
    marginBottom: 20,
  },
  painSection: {
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#444",
  },
  footSelector: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 30,
  },
  footButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    marginRight: 16,
  },
  footButtonSelected: {
    backgroundColor: "#00843D", // same as radio button color
    borderColor: "#00843D",
  },
  radioLabel: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  footDiagramContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: "#00843D",
    paddingHorizontal: 10,
    paddingVertical: 18,
    alignItems: "center",
    borderRadius: 8,
  },
  recommendationsContainer: {
    padding: 24,
    marginBottom: 20,
    backgroundColor: '#fafbfc',
  },
  recommendationsTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 24,
    color: "#0a0a0a",
    letterSpacing: -0.5,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  gridItem: {
    width: '47%',
  },
  categoryCard: {
    borderRadius: 24,
    backgroundColor: "#ffffff",
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  imageContainer: {
    height: 150,
    position: 'relative',
    backgroundColor: '#f5f5f5',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
  },
  categoryContent: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    minHeight: 70,
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  stepbar: {
    width: 40,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 6,
  },
  activeDot: {
    backgroundColor: "#00843D",
  },
  inactiveDot: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default HomeScreen;
