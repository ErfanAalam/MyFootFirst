import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define types
interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  description: string;
  ingredients: string[];
}

type RootStackParamList = {
  ProductDetail: { product: Product };
  MainTabs: undefined;
};

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

// Dummy product data
const products: Product[] = [
  {
    id: '1',
    title: 'Hair Strength',
    price: 21.40,
    image: 'https://sreeleathersonline.com/cdn/shop/products/1B6A8386-PhotoRoom.png?v=1668503614',
    description: 'A nourishing shampoo formula designed to strengthen your hair from the roots.',
    ingredients: ['Apricot', 'Apple', 'Coconut']
  },
  {
    id: '2',
    title: 'Hair Growth',
    price: 24.99,
    image: 'https://sreeleathersonline.com/cdn/shop/products/1B6A8386-PhotoRoom.png?v=1668503614',
    description: 'Promotes hair growth and prevents hair fall with natural ingredients.',
    ingredients: ['Aloe Vera', 'Ginger', 'Mint']
  },
  {
    id: '3',
    title: 'Moisturizing Conditioner',
    price: 19.95,
    image: 'https://sreeleathersonline.com/cdn/shop/products/1B6A8386-PhotoRoom.png?v=1668503614',
    description: 'Deep moisturizing conditioner for dry and damaged hair.',
    ingredients: ['Argan Oil', 'Shea Butter', 'Almond']
  },
  {
    id: '4',
    title: 'Anti-Dandruff Shampoo',
    price: 18.50,
    image: 'https://sreeleathersonline.com/cdn/shop/products/1B6A8386-PhotoRoom.png?v=1668503614',
    description: 'Effectively controls dandruff and soothes the scalp.',
    ingredients: ['Tea Tree Oil', 'Lemon', 'Rosemary']
  },
  {
    id: '5',
    title: 'Hair Repair Mask',
    price: 26.75,
    image: 'https://sreeleathersonline.com/cdn/shop/products/1B6A8386-PhotoRoom.png?v=1668503614',
    description: 'Intensive repair treatment for severely damaged hair.',
    ingredients: ['Protein Complex', 'Avocado', 'Jojoba Oil']
  },
  {
    id: '6',
    title: 'Color Protection',
    price: 22.95,
    image: 'https://sreeleathersonline.com/cdn/shop/products/1B6A8386-PhotoRoom.png?v=1668503614',
    description: 'Protects color-treated hair and prevents fading.',
    ingredients: ['UV Protection', 'Cranberry', 'Pomegranate']
  },
];

interface ProductCardProps {
  item: Product;
  onPress: () => void;
}

const ProductCard = ({ item, onPress }: ProductCardProps) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image 
        source={{ uri: item.image }} 
        style={styles.productImage}
        resizeMode="contain"
      />
      <Text style={styles.productTitle}>{item.title}</Text>
      <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
    </TouchableOpacity>
  );
};

const EcommerceScreen = () => {
  const navigation = useNavigation<NavigationProps>();

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { product });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MyShop</Text>
        <TouchableOpacity style={styles.cartButton}>
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/263/263142.png' }}
            style={styles.cartIcon}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Explore Products</Text>
      <FlatList
        data={products}
        renderItem={({ item }) => (
          <ProductCard item={item} onPress={() => handleProductPress(item)} />
        )}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.productList}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  cartButton: {
    padding: 6,
  },
  cartIcon: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginVertical: 16,
    paddingHorizontal: 16,
    color: '#333',
  },
  productList: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  card: {
    flex: 1,
    margin: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productImage: {
    height: 140,
    width: '100%',
    borderRadius: 8,
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginVertical: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
});

export default EcommerceScreen;
