import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
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

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;
type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

const ProductDetailScreen = () => {
  const route = useRoute<ProductDetailRouteProp>();
  const navigation = useNavigation<NavigationProps>();
  const { product } = route.params;

  const renderIngredientIcon = (ingredient: string, index: number) => {
    // In a real app, you would have different icons for each ingredient
    return (
      <View key={index} style={styles.ingredientItem}>
        <View style={styles.ingredientIconContainer}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/50' }} 
            style={styles.ingredientIcon} 
          />
        </View>
        <Text style={styles.ingredientText}>{ingredient}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/130/130882.png' }}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity style={styles.cartButton}>
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/263/263142.png' }}
            style={styles.cartIcon}
          />
        </TouchableOpacity>
      </View>
      
      <ScrollView>
        <View style={styles.imageHeader}>
          <Image 
            source={{ uri: product.image }} 
            style={styles.productImage}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.productInfo}>
            <Text style={styles.productCategory}>SHAMPOO</Text>
            <Text style={styles.productTitle}>{product.title}</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.ingredientsContainer}>
              {product.ingredients.map((ingredient, index) => 
                renderIngredientIcon(ingredient, index)
              )}
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>
          
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>$</Text>
            <Text style={styles.priceValue}>{product.price.toFixed(2)}</Text>
          </View>
          
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  backButton: {
    padding: 6,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  cartButton: {
    padding: 6,
  },
  cartIcon: {
    width: 24,
    height: 24,
  },
  imageHeader: {
    height: 300,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: 200,
    height: 250,
  },
  contentContainer: {
    padding: 16,
  },
  productInfo: {
    marginBottom: 20,
  },
  productCategory: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  ingredientsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ingredientItem: {
    alignItems: 'center',
    width: 80,
    marginRight: 12,
    marginBottom: 12,
  },
  ingredientIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  ingredientIcon: {
    width: 40,
    height: 40,
  },
  ingredientText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  priceLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  priceValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#333',
    marginLeft: 4,
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductDetailScreen; 