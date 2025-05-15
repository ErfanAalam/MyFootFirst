import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Platform, StatusBar, FlatList } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCart } from '../../contexts/CartContext';

// Define types
interface Product {
  id: string;
  title: string;
  price: number;
  newPrice: string;
  description: string;
  sizes: string[];
  colorImages: {
    [key: string]: string[];
  };
  priceValue: number;
}

type RootStackParamList = {
  ProductDetail: { product: Product };
  MainTabs: undefined;
  Cart: undefined;
};

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;
type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

const ProductDetailScreen = () => {
  const route = useRoute<ProductDetailRouteProp>();
  const navigation = useNavigation<NavigationProps>();
  const { product } = route.params;
  const { addToCart, items, updateQuantity, removeFromCart } = useCart();

  // Extract available colors from colorImages
  const availableColors = useMemo(() => {
    return Object.keys(product.colorImages || {});
  }, [product.colorImages]);

  // State for selected color and image
  const [selectedColor, setSelectedColor] = useState(availableColors[0] || '');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);

  // Get images for selected color
  const selectedColorImages = useMemo(() => {
    return product.colorImages?.[selectedColor] || [];
  }, [product.colorImages, selectedColor]);

  // Get currently selected image URL
  const mainImageUrl = useMemo(() => {
    return selectedColorImages[selectedImageIndex] || '';
  }, [selectedColorImages, selectedImageIndex]);

  const selectedSize = useMemo(() => {
    return product.sizes?.[selectedSizeIndex] || '';
  }, [product.sizes, selectedSizeIndex]);

  // Check if product is already in cart
  const cartItem = useMemo(() => {
    return items.find(item => item.id === product.id);
  }, [items, product.id]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setSelectedImageIndex(0); // Reset to first image when color changes
  };

  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index);
  };

  const renderColorVariation = (color: string, index: number) => {
    const isSelected = color === selectedColor;
    const firstImageOfColor = product.colorImages?.[color]?.[0] || '';

    return (
      <TouchableOpacity
        key={index}
        style={styles.variationItem}
        onPress={() => handleColorSelect(color)}
      >
        <View
          style={[
            styles.colorSwatch,
            { borderColor: isSelected ? '#00843D' : '#ddd', borderWidth: isSelected ? 2 : 1 }
          ]}
        >
          {firstImageOfColor ? (
            <Image
              source={{ uri: firstImageOfColor }}
              style={styles.colorThumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.colorFill, { backgroundColor: color }]} />
          )}
        </View>
        <Text style={[
          styles.variationText,
          { fontWeight: isSelected ? '700' : '400' }
        ]}>
          {color}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSizeIndex(product.sizes.indexOf(size));
  };

  const renderSizeVariation = (size: string, index: number) => {
    const isSelected = size === selectedSize;
    return (
      <TouchableOpacity
        key={index}
        style={styles.variationItem}
        onPress={() => handleSizeSelect(size)}
      >
        <View style={[
          styles.sizeBox,
          { backgroundColor: isSelected ? '#00843D' : '#f2f2f2', paddingHorizontal: 10, paddingVertical: 10,alignItems:'center',justifyContent:'center' }
        ]}>
          <Text style={[
            styles.sizeText,
            { color: isSelected ? '#fff' : '#333' }
          ]}>
            {size}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderImageThumbnail = ({ item, index }: { item: string, index: number }) => {
    const isSelected = index === selectedImageIndex;

    return (
      <TouchableOpacity
        onPress={() => handleImageSelect(index)}
        style={[
          styles.thumbnailContainer,
          isSelected && styles.selectedThumbnailContainer
        ]}
      >
        <Image
          source={{ uri: item }}
          style={styles.thumbnailImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  };

  const handleAddToCart = () => {
    // Create a modified product with the selected color and image
    // console.log(product);
    const productToAdd = {
      ...product,
      selectedColor,
      selectedImage: mainImageUrl,
      selectedSize,
      price: product.price,
      newPrice: product.newPrice,
      priceValue: product.priceValue,
    };
    console.log(productToAdd);
    addToCart(productToAdd);
  };

  const handleIncreaseQuantity = () => {
    if (cartItem) {
      updateQuantity(product.id, cartItem.quantity + 1);
    }
  };

  const handleDecreaseQuantity = () => {
    if (cartItem && cartItem.quantity > 1) {
      updateQuantity(product.id, cartItem.quantity - 1);
    } else if (cartItem) {
      removeFromCart(product.id);
    }
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
        <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate('Cart')}>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/263/263142.png' }}
            style={styles.cartIcon}
          />
        </TouchableOpacity>
        {items.length > 0 && (
          <Text style={styles.cartCounter}>{items.length}</Text>
        )}
      </View>

      <ScrollView>
        <View style={styles.imageHeader}>
          {mainImageUrl ? (
            <Image
              source={{ uri: mainImageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}
        </View>

        {/* Thumbnails for the selected color */}
        {selectedColorImages.length > 0 && (
          <View style={styles.thumbnailsContainer}>
            <FlatList
              data={selectedColorImages}
              renderItem={renderImageThumbnail}
              keyExtractor={(item, index) => `${selectedColor}-image-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailsContent}
            />
          </View>
        )}

        <View style={styles.contentContainer}>
          <View style={styles.productInfo}>
            <Text style={styles.productTitle}>{product.title}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Colors</Text>
            <View style={styles.variationsContainer}>
              {availableColors.map((color, index) =>
                renderColorVariation(color, index)
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sizes</Text>
            <View style={styles.variationsContainer} >
              {product.sizes && product.sizes.map((size, index) =>
                renderSizeVariation(size, index)
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>

          <View style={styles.priceContainer}>
            {/* <Text style={styles.priceLabel}>$</Text> */}
            <Text style={styles.priceValue}>{product.newPrice}</Text>
          </View>

          {cartItem ? (
            <>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={handleDecreaseQuantity}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{cartItem.quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={handleIncreaseQuantity}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.viewCartButton}
                onPress={() => navigation.navigate('Cart')}
              >
                <Text style={styles.viewCartButtonText}>View Cart</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
              <Text style={styles.addButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          )}
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
  cartCounter: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    position: 'absolute',
    backgroundColor: '#00843D',
    right: 10,
    top: 10,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 100,
    height: 20,
    width: 20,
    textAlign: 'center',
    padding: 2,
  },
  imageHeader: {
    height: 400,
    backgroundColor: '#f5f5f5',
    width: '100%',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
  },
  thumbnailsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
  },
  thumbnailsContent: {
    paddingHorizontal: 16,
  },
  thumbnailContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  selectedThumbnailContainer: {
    borderColor: '#00843D',
    borderWidth: 2,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    padding: 16,
  },
  productInfo: {
    marginBottom: 20,
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
  variationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  variationItem: {
    alignItems: 'center',
    // width: 60,
    marginRight: 12,
    marginBottom: 12,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 25,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  colorThumbnail: {
    width: '100%',
    height: '100%',
  },
  colorFill: {
    width: '100%',
    height: '100%',
  },
  variationText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
  sizeBox: {
    height: 50,
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  sizeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
    backgroundColor: '#00843D',
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
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#00843D',
    borderRadius: 10,
  },
  quantityButton: {
    width: 50,
    height: 50,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 15,
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    minWidth: 30,
    textAlign: 'center',
  },
  viewCartButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  viewCartButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductDetailScreen;