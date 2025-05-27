import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import firestore from '@react-native-firebase/firestore';
import { useCart } from '../../contexts/CartContext';

// Define types
type Category = {
  id: string;
  name: string;
  imageUrl: string;
};

type RootStackParamList = {
  CategoryProducts: { category: string };
  MainTabs: undefined;
  Cart: undefined;
};

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

const EcommerceScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const [categories, setCategories] = useState<Category[]>([]);
  const { items } = useCart();

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
      }
    };

    fetchCategories();
  }, []);

  const renderCategoryCard = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CategoryProducts', { category: item.id })}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.categoryImage}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.categoryTitle}>{item.name}</Text>
        <View style={styles.shopNowContainer}>
          <Text style={styles.shopNowText}>Shop Now</Text>
          <Text style={styles.arrow}>→</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <View style={styles.iconButton}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/130/130882.png' }}
              style={styles.backIcon}
            />
          </View>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>MyShop</Text>
          <Text style={styles.headerSubtitle}>Discover amazing products</Text>
        </View>

        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.7}
        >
          <View style={styles.iconButton}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/263/263142.png' }}
              style={styles.cartIcon}
            />
            {items.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartCounter}>{items.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>Shop by Category</Text>
        <Text style={styles.subtitle}>Find exactly what you're looking for</Text>
      </View>

      <FlatList
        data={categories}
        renderItem={renderCategoryCard}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.categoryList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '400',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  backButton: {
    marginRight: 4,
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: '#475569',
  },
  cartButton: {
    marginLeft: 4,
    position: 'relative',
  },
  cartIcon: {
    width: 22,
    height: 22,
    tintColor: '#475569',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cartCounter: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '400',
  },
  categoryList: {
    paddingHorizontal: 12,
    paddingBottom: 32,
  },
  card: {
    flex: 1,
    margin: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  imageContainer: {
    height: 160,
    width: '100%',
    position: 'relative',
    backgroundColor: '#f8fafc',
  },
  categoryImage: {
    height: '100%',
    width: '100%',
    backgroundColor: 'transparent',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  cardContent: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1e293b',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  shopNowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  shopNowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00843D',
    marginRight: 4,
  },
  arrow: {
    fontSize: 14,
    color: '#00843D',
    fontWeight: '600',
  },
});

export default EcommerceScreen;
