import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, SafeAreaView, Platform, StatusBar, Modal } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCart } from '../../contexts/CartContext';
import CustomAlertModal from '../../Components/CustomAlertModal';

// Define types
interface Product {
  id: string;
  title: string;
  price: number;
  newPrice: string;
  discountedPrice?: string;
  discountedPriceValue?: number;
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
  Cart: { fromProductDetail: boolean };
};

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;
type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

const ProductDetailScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute<ProductDetailRouteProp>();
  const { product } = route.params;

  const { addToCart, items } = useCart();
  const [quantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>(Object.keys(product.colorImages)[0]);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [alertModal, setAlertModal] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info',
  });
  const [sizeModalVisible, setSizeModalVisible] = useState(false);

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

  // Extract available colors from colorImages
  const availableColors = useMemo(() => {
    return Object.keys(product.colorImages);
  }, [product.colorImages]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setSelectedImageIndex(0);
  };

  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index);
  };

  const renderColorVariation = (color: string, _index: number) => (
    <TouchableOpacity
      key={color}
      style={[
        styles.colorOption,
        selectedColor === color && styles.selectedColorOption,
      ]}
      onPress={() => handleColorSelect(color)}
    >
      <View style={[styles.colorCircle, { backgroundColor: color.toLowerCase() }]} />
      <Text style={[
        styles.colorText,
        selectedColor === color && styles.selectedColorText
      ]}>
        {color}
      </Text>
    </TouchableOpacity>
  );

  const renderSizeDropdown = () => (
    <TouchableOpacity
      style={styles.sizeDropdown}
      onPress={() => setSizeModalVisible(true)}
    >
      <Text style={[styles.sizeDropdownText, !selectedSize && styles.placeholderText]}>
        {selectedSize || 'Select Size'}
      </Text>
      <Text style={styles.dropdownArrow}>▼</Text>
    </TouchableOpacity>
  );

  const renderSizeModal = () => (
    <Modal
      visible={sizeModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setSizeModalVisible(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setSizeModalVisible(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Size</Text>
            <TouchableOpacity onPress={() => setSizeModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.sizeList}>
            {product.sizes.map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.sizeOption,
                  selectedSize === size && styles.selectedSizeOption
                ]}
                onPress={() => {
                  setSelectedSize(size);
                  setSizeModalVisible(false);
                }}
              >
                <Text style={[
                  styles.sizeText,
                  selectedSize === size && styles.selectedSizeText
                ]}>
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderImageThumbnail = ({ item, index }: { item: string, index: number }) => (
    <TouchableOpacity
      style={[
        styles.thumbnailContainer,
        selectedImageIndex === index && styles.selectedThumbnail,
      ]}
      onPress={() => handleImageSelect(index)}
    >
      <Image
        source={{ uri: item }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const handleAddToCart = () => {
    if (!selectedSize) {
      showAlert('Error', 'Please select a size', 'error');
      return;
    }

    const cartProduct = {
      ...product,
      selectedColor,
      selectedSize,
      quantity,
      selectedImage: product.colorImages[selectedColor][selectedImageIndex],
    };

    // console.log(cartProduct);

    addToCart(cartProduct);
    navigation.navigate('Cart', { fromProductDetail: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.backArrow}>←</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart', { fromProductDetail: true })}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.cartIcon}>🛒</Text>
            {items.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartCounter}>{items.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Main product image */}
        <Image
          source={{ uri: product.colorImages[selectedColor][selectedImageIndex] }}
          style={styles.mainImage}
          resizeMode="cover"
        />

        {/* Thumbnail gallery */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.thumbnailGallery}
        >
          {product.colorImages[selectedColor].map((image, index) => (
            <View key={index}>
              {renderImageThumbnail({ item: image, index })}
            </View>
          ))}
        </ScrollView>

        {/* Product details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.productTitle}>{product.title}</Text>

          <View style={styles.priceContainer}>
            {product.discountedPrice ? (
              <>
                <Text style={styles.originalPrice}>{product.newPrice}</Text>
                <Text style={styles.discountedPrice}>{product.discountedPrice}</Text>
              </>
            ) : (
              <Text style={styles.price}>{product.newPrice}</Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>Color</Text>
          <View style={styles.colorOptions}>
            {availableColors.map(renderColorVariation)}
          </View>

          <Text style={styles.sectionTitle}>Size</Text>
          {renderSizeDropdown()}
          {renderSizeModal()}

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
        >
          <Text style={styles.addToCartText}>Add to Cart</Text>
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backArrow: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
  cartIcon: {
    fontSize: 20,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  cartCounter: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  sizeDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sizeDropdownText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    fontSize: 20,
    color: '#6b7280',
    padding: 4,
  },
  sizeList: {
    padding: 16,
  },
  sizeOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
  },
  selectedSizeOption: {
    backgroundColor: '#00843D',
  },
  sizeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  selectedSizeText: {
    color: '#ffffff',
  },
  content: {
    padding: 16,
  },
  mainImage: {
    width: '100%',
    height: 400,
    backgroundColor: '#f5f5f5',
  },
  thumbnailGallery: {
    paddingVertical: 10,
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
  selectedThumbnail: {
    borderColor: '#00843D',
    borderWidth: 2,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    marginBottom: 20,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  priceContainer: {
    marginBottom: 20,
  },
  originalPrice: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FF0000',
    textDecorationLine: 'line-through',
    marginRight: 12,
  },
  discountedPrice: {
    fontSize: 26,
    fontWeight: '700',
    color: '#00843D',
  },
  price: {
    fontSize: 26,
    fontWeight: '700',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorOption: {
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 12,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 25,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  colorText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
  selectedColorOption: {
    borderColor: '#00843D',
    borderWidth: 2,
    padding: 10,
    borderRadius: 20,
  },
  selectedColorText: {
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
  },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  addToCartButton: {
    backgroundColor: '#00843D',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addToCartText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductDetailScreen;