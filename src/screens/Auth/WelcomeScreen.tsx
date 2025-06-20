// WelcomeScreen.js
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const bannerWidth = width * 0.8;
const sideSpacing = (width - bannerWidth) / 2;

const banners = [
  {
    id: '1',
    image: require('../../assets/images/banner1.png'),
    title: 'Custom Orthotics, No Clinic Needed',
  },
  {
    id: '2',
    image: require('../../assets/images/banner2.jpg'),
    title: 'Your Feet, Mapped by AI',
  },
  {
    id: '3',
    image: require('../../assets/images/banner2.jpg'),
    title: 'Designed For You, Engineered for Life',
  },
];

export default function WelcomeScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const navigation = useNavigation();

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / (bannerWidth + 20));
    setActiveIndex(currentIndex);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" translucent />

      <View style={styles.headerContainer}>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.companyName}>MyFirstFoot</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={bannerWidth + 20}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: sideSpacing }}
      >
        {banners.map((banner) => (
          <View key={banner.id} style={styles.banner}>
            <Image source={banner.image} style={styles.bannerImage} resizeMode="cover" />
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>{banner.title}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        {banners.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              { backgroundColor: index === activeIndex ? '#00843D' : '#DDDDDD' },
            ]}
          />
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.signupButtonText}>Sign Up For Free</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  headerContainer: { alignItems: 'center', marginTop: 60, marginBottom: 20 },
  welcomeText: { fontSize: 16, color: '#212121' },
  companyName: { fontSize: 24, fontWeight: 'bold', color: '#00843D' },
  banner: { width: bannerWidth, marginRight: 20, alignItems: 'center' },
  bannerImage: { width: '100%', height: 300, borderRadius: 20 },
  bannerTextContainer: {
    // position: 'absolute',
    bottom: -60,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  bannerTitle: { fontSize: 18, fontWeight: '600', color: '#212121', textAlign: 'center' },
  pagination: { flexDirection: 'row', justifyContent: 'center', marginVertical: 20 },
  paginationDot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 5 },
  buttonContainer: { paddingHorizontal: 20, marginBottom: 40, alignItems: 'center' },
  signupButton: {
    backgroundColor: '#00843D',
    borderRadius: 25,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  signupButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  loginButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: { color: '#00843D', fontSize: 16, fontWeight: '500' },

});