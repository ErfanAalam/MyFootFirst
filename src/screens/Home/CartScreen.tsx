import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  ListRenderItem,
} from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../../contexts/CartContext';
import { useUser } from '../../contexts/UserContext';
import firestore from '@react-native-firebase/firestore';
import { NavigationProp } from '@react-navigation/native';
import CustomAlertModal from '../../Components/CustomAlertModal';
import { CartItem } from '../../contexts/CartContext';

// Add type for navigation
type RootStackParamList = {
  OrderHistory: undefined;
  Ecommerce: undefined;
};

type NavigationProps = NavigationProp<RootStackParamList>;

// Add type for UserData
interface UserData {
  id: string;
  name?: string;
  firstName?: string;
  phone?: string;
  country?: string;
}

const CartScreen = () => {
  const { items, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
  const { userData } = useUser() as { userData: UserData };
  const navigation = useNavigation<NavigationProps>();
  // console.log(items)

  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [isOrderProcessing, setIsOrderProcessing] = useState(false);

  // Create a ref to track if order has been processed already
  const orderProcessedRef = useRef(false);

  // Address state
  const [address, setAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    country: userData?.country || '',
    pinCode: '',
    phoneNumber: userData?.phone || '',
  });

  // State to track if address is selected
  const [addressSelected, setAddressSelected] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<typeof address | null>(null);

  const [alertModal, setAlertModal] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info',
  });

  // Use useCallback to prevent recreation of the function on every render
  const fetchUserAddress = useCallback(async () => {
    if (!userData?.id) return;

    try {
      const addressRef = firestore().collection('users').doc(userData.id);
      const addressDoc = await addressRef.get();

      if (addressDoc.exists && addressDoc.data()?.address) {
        const addressData = addressDoc.data()?.address;
        setSelectedAddress(addressData);
        setAddressSelected(true);
        setAddress(addressData);
      }
    } catch (error) {
      console.error('Error fetching user address:', error);
    }
  }, [userData?.id]);

  // Fetch user's saved address when component mounts
  useEffect(() => {
    if (userData?.id) {
      fetchUserAddress();
    }

    // Reset order processed ref when component mounts
    orderProcessedRef.current = false;
  }, [userData, fetchUserAddress]);

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

  // Update handleSaveAddress
  const handleSaveAddress = async () => {
    // Basic validation
    if (!address.line1 || !address.city || !address.country || !address.pinCode || !address.phoneNumber) {
      showAlert('Error', 'Please fill all required fields', 'error');
      return;
    }

    setAddressLoading(true);
    try {
      if (!userData?.id) {
        throw new Error('User ID not found');
      }

      const addressRef = firestore().collection('users').doc(userData.id);
      await addressRef.set({ address }, { merge: true });

      // Update local state
      setSelectedAddress({ ...address });
      setAddressSelected(true);
      setAddressModalVisible(false);
      showAlert('Success', 'Address saved successfully', 'success');
    } catch (error: any) {
      console.error('Error saving address:', error);
      showAlert('Error', `Failed to save address: ${error.message}`, 'error');
    } finally {
      setAddressLoading(false);
    }
  };

  // Update handlePay
  const handlePay = async () => {
    // Check if address is selected
    if (!addressSelected) {
      showAlert('Address Required', 'Please select a delivery address before checkout', 'error');
      return;
    }

    let totalPrice = 0;
    items.forEach(item => {
      totalPrice += item.price * item.quantity;
    });

    setLoading(true);
    try {
      const response = await axios.post('https://myfootfirstserver.onrender.com/create-checkout-session', {
        name: items[0].title,
        price: totalPrice,
      });

      orderProcessedRef.current = false;

      setCheckoutUrl(response.request.responseURL);
    } catch (error) {
      console.error('Error creating Stripe session:', error);
      showAlert('Error', 'Failed to initiate checkout', 'error');
    } finally {
      setLoading(false);
    }
  };


  // Improved order storage function
  const storeOrderData = useCallback(async () => {
    if (!userData?.id || isOrderProcessing) return false;

    setIsOrderProcessing(true);
    try {
      const uniqueKey = 'QWERTYUIOPASDFGHJKLZXCVBNM1234567890';
      const orderId = uniqueKey.split('').sort(() => Math.random() - 0.5).join('').slice(0, 8);

      // Separate insole products from other products
      const insoleProducts = items.filter(item =>
        ['insole-active', 'insole-comfort', 'insole-sport'].includes(item.id)
      );
      const otherProducts = items;

      // Store insole products in users collection
      if (insoleProducts.length > 0) {
        const insoleOrderData = {
          orderId, // Use userId as orderId for insoles
          customerName: userData.firstName || 'Anonymous',
          dateOfOrder: Date.now(),
          products: insoleProducts.map(item => ({
            id: item.id,
            title: item.title,
            price: item.price,
            priceWithSymbol: item.newPrice,
            quantity: item.quantity,
            image: item.image,
            totalPrice: item.price * item.quantity,
          })),
          totalAmount: insoleProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          orderStatus: 'pending',
          shippingAddress: selectedAddress,
        };

        // Get existing insole orders
        const userDoc = await firestore()
          .collection('users')
          .doc(userData.id)
          .get();

        const existingData = userDoc.data();
        const existingInsoleOrders = existingData?.insoleOrders || [];

        // Add new order to the array
        const updatedInsoleOrders = [...existingInsoleOrders, insoleOrderData];

        // Update the document with the new array
        await firestore()
          .collection('users')
          .doc(userData.id)
          .set({ insoleOrders: updatedInsoleOrders }, { merge: true });
      }

      // Store other products in usersOrders collection
      if (otherProducts.length > 0) {
        const otherOrderData = {
          orderId,
          customerName: userData.firstName || 'Anonymous',
          dateOfOrder: firestore.FieldValue.serverTimestamp(),
          products: otherProducts.map(item => ({
            id: item.id,
            title: item.title,
            color:item.color,
            price: item.price,
            priceWithSymbol: item.newPrice,
            quantity: item.quantity,
            image: item.image,
            totalPrice: item.price * item.quantity,
          })),
          totalAmount: otherProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          orderStatus: 'pending',
          shippingAddress: selectedAddress,
        };

        await firestore()
          .collection('usersOrders')
          .doc(userData.id)
          .collection('orders')
          .doc(orderId)
          .set(otherOrderData);
      }

      // Clear the cart after successful order
      clearCart();

      return true;
    } catch (error) {
      console.error('Error storing order:', error);
      return false;
    } finally {
      setIsOrderProcessing(false);
    }
  }, [userData, items, selectedAddress, clearCart, isOrderProcessing]);

  // Update handleNavigationStateChange
  const handleNavigationStateChange = useCallback(async (navState: { url: string }) => {
    if ((navState.url.includes('/success') || navState.url.includes('?success=true')) && !orderProcessedRef.current) {
      orderProcessedRef.current = true;

      const orderStored = await storeOrderData();

      if (orderStored) {
        setCheckoutUrl('');
        showAlert('Success', 'Payment successful and order placed!', 'success');
        // setTimeout(() => {
        //   navigation.navigate('OrderHistory');
        // }, 300);
      } else {
        showAlert('Error', 'Payment successful but failed to store order. Please contact support.', 'error');
        setCheckoutUrl('');
      }
    } else if (navState.url.includes('/cancel') || navState.url.includes('?canceled=true')) {
      showAlert('Payment Canceled', 'Your payment was canceled.', 'info');
      setCheckoutUrl('');
    }
  }, [navigation, storeOrderData]);

  const handleIncreaseQuantity = (productId: string) => {
    const item = items.find(item => item.id === productId);
    if (item) {
      updateQuantity(productId, item.quantity + 1);
    }
  };

  const handleDecreaseQuantity = (productId: string) => {
    const item = items.find(item => item.id === productId);
    if (item && item.quantity > 1) {
      updateQuantity(productId, item.quantity - 1);
    } else {
      removeFromCart(productId);
    }
  };

  const renderCartItem: ListRenderItem<CartItem> = ({ item }) => {
    const calculateDiscountedTotal = () => {
      if (!item.discountedPriceValue) return 0;
      return (item.discountedPriceValue * item.quantity).toFixed(2);
    };

    return (
      <View style={styles.cartItemContainer}>
        <Image
          source={{ uri: item.image || item.selectedImage }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.productDetails}>
          <Text style={styles.productTitle}>{item.title}</Text>
          <View style={styles.priceContainer}>
            {item.discountedPrice ? (
              <>
                <Text style={styles.originalPrice}>
                  {(item.newPrice).slice(0, 1)} {(item.priceValue * item.quantity).toFixed(2)}
                </Text>
                <Text style={styles.discountedPrice}>
                  {(item.discountedPrice).slice(0, 1)} {calculateDiscountedTotal()}
                </Text>
              </>
            ) : (
              <Text style={styles.regularPrice}>
                {(item.newPrice).slice(0, 1)} {(item.priceValue * item.quantity).toFixed(2)}
              </Text>
            )}
          </View>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleDecreaseQuantity(item.id)}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleIncreaseQuantity(item.id)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFromCart(item.id)}
        >
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Address display section
  const renderAddressSection = () => (
    <View style={styles.addressSection}>
      <Text style={styles.addressSectionTitle}>Delivery Address</Text>

      {addressSelected ? (
        <View style={styles.selectedAddress}>
          <View style={styles.addressInfo}>
            <Text style={styles.addressText}>
              {selectedAddress?.line1}
              {selectedAddress?.line2 ? `, ${selectedAddress?.line2}` : ''}
            </Text>
            <Text style={styles.addressText}>
              {selectedAddress?.city}, {selectedAddress?.country}, {selectedAddress?.pinCode}
            </Text>
            <Text style={styles.addressText}>
              Phone: {selectedAddress?.phoneNumber}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.changeAddressButton}
            onPress={() => setAddressModalVisible(true)}
          >
            <Text style={styles.changeAddressText}>Change</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.selectAddressButton}
          onPress={() => setAddressModalVisible(true)}
        >
          <Text style={styles.selectAddressText}>+ Add Delivery Address</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Move the handleInputChange function to the parent component
  const handleInputChange = (field: keyof typeof address, value: string) => {
    // Update the address state without causing full re-renders
    setAddress(prevAddress => ({
      ...prevAddress,
      [field]: value
    }));
  };

  // Handle WebView rendering
  if (checkoutUrl) {
    return (
      <SafeAreaView style={{ flex: 1, marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight }}>
        <WebView
          source={{ uri: checkoutUrl }}
          onNavigationStateChange={handleNavigationStateChange}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/130/130882.png' }}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <View style={styles.placeholderView} />
      </View>

      {items.length > 0 ? (
        <View style={styles.cartList}>
          <FlatList<CartItem>
            data={items}
            renderItem={renderCartItem}
            keyExtractor={item => item.id}
            style={styles.cartList}
            contentContainerStyle={styles.cartListContent}
            ListFooterComponent={renderAddressSection}
          />

          <View style={styles.cartFooter}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>{(items[0]?.newPrice)?.slice(0, 1) || '$'}{(getCartTotal()).toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.checkoutButton,
                !addressSelected && styles.disabledButton
              ]}
              onPress={handlePay}
              disabled={loading || !addressSelected}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.checkoutButtonText}>
                  {addressSelected ? 'Proceed to Checkout' : 'Select Address to Continue'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.emptyCartContainer}>
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.shopNowButton}
            onPress={() => navigation.navigate('Ecommerce')}
          >
            <Text style={styles.shopNowButtonText}>Shop Now</Text>
          </TouchableOpacity>
          <Text style={{padding:10,fontSize:20}}>OR</Text>
          <Text style={styles.emptyCartText}>Go to Order History</Text>
          <TouchableOpacity
            style={styles.shopNowButton}
            onPress={() => navigation.navigate('OrderHistory')}
          >
            <Text style={styles.shopNowButtonText}>Order History</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal for address input */}
      <Modal
        visible={addressModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delivery Address</Text>

            <ScrollView style={styles.addressForm}>
              <Text style={styles.inputLabel}>Address Line 1 *</Text>
              <TextInput
                style={styles.input}
                value={address.line1}
                onChangeText={(text) => handleInputChange('line1', text)}
                placeholder="Street, House/Apartment Number"
              />

              <Text style={styles.inputLabel}>Address Line 2</Text>
              <TextInput
                style={styles.input}
                value={address.line2}
                onChangeText={(text) => handleInputChange('line2', text)}
                placeholder="Area, Landmark (Optional)"
              />

              <Text style={styles.inputLabel}>City *</Text>
              <TextInput
                style={styles.input}
                value={address.city}
                onChangeText={(text) => handleInputChange('city', text)}
                placeholder="City"
              />

              <Text style={styles.inputLabel}>Country *</Text>
              <TextInput
                style={styles.input}
                value={address.country}
                onChangeText={(text) => handleInputChange('country', text)}
                placeholder="Country"
              />

              <Text style={styles.inputLabel}>Pin Code/Zip Code *</Text>
              <TextInput
                style={styles.input}
                value={address.pinCode}
                onChangeText={(text) => handleInputChange('pinCode', text)}
                placeholder="Pin Code"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={address.phoneNumber}
                onChangeText={(text) => handleInputChange('phoneNumber', text)}
                placeholder="Phone Number"
                keyboardType="phone-pad"
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setAddressModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveAddress}
                disabled={addressLoading}
              >
                {addressLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Address</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add CustomAlertModal at the end of the component */}
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
  placeholderView: {
    width: 32,
  },
  cartList: {
    flex: 1,
  },
  cartListContent: {
    padding: 16,
    paddingBottom: 24,
  },
  cartItemContainer: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  originalPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF0000',
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00843D',
  },
  regularPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 12,
    color: '#333',
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 24,
    fontWeight: '400',
    color: '#999',
  },

  // Address section styles
  addressSection: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fff',
  },
  addressSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  selectAddressButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#00843D',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  selectAddressText: {
    color: '#00843D',
    fontWeight: '500',
  },
  selectedAddress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressInfo: {
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  changeAddressButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  changeAddressText: {
    color: '#00843D',
    fontWeight: '500',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  addressForm: {
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#00843D',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Cart footer styles
  cartFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  checkoutButton: {
    backgroundColor: '#00843D',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyCartText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
    color: '#666',
  },
  shopNowButton: {
    backgroundColor: '#00843D',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  shopNowButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CartScreen;