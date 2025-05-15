import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useUser } from './UserContext';

// Define cart item type
export interface CartItem {
  id: string;
  title: string;
  price: number;
  selectedImage: string;
  quantity: number;
  newPrice: string;
  priceValue: number;
  image?: string;
  size?: string;
}

// Define context type
interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getItemCount: () => number;
}

// Create context with default values
const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => { },
  removeFromCart: () => { },
  updateQuantity: () => { },
  clearCart: () => { },
  getCartTotal: () => 0,
  getItemCount: () => 0,
});

// Custom hook to use cart context
export const useCart = () => useContext(CartContext);

// Provider component
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { userData } = useUser();

  // Setup real-time listener for cart changes
  useEffect(() => {
    if (!userData?.id) {
      // Ensure items is always an array even when there's no user
      setItems([]);
      return;
    }

    const userDoc = firestore().collection('users').doc(userData.id);

    // Create a real-time listener
    const unsubscribe = userDoc.onSnapshot((snapshot) => {
      if (snapshot.exists) {
        // Ensure we're getting an array and not undefined
        const data = snapshot.data();
        const cartItems = Array.isArray(data?.cart) ? data.cart : [];
        setItems(cartItems);
      } else {
        setItems([]);
      }
    }, (error) => {
      console.error("Firestore listener error:", error);
      // Ensure items is still an array on error
      setItems([]);
    });

    // Clean up listener when component unmounts or userData changes
    return () => unsubscribe();
  }, [userData?.id]);

  // Add product to cart
  const addToCart = async (product: any, quantity: number = 1) => {
    if (!userData?.id) return;

    try {
      const userDoc = firestore().collection('users').doc(userData.id);

      // Check if product already exists in cart
      const existingItemIndex = items.findIndex(item => item.id === product.id);

      if (existingItemIndex >= 0) {
        // If product exists, update its quantity
        const existingItem = items[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;
        await updateQuantity(product.id, newQuantity);
      } else {
        // Otherwise add as new item
        const cartItem = {
          id: product.id,
          title: product.title,
          price: product.price,
          newPrice: product.newPrice,
          image: product.selectedImage,
          size: product.selectedSize,
          quantity: quantity,
          priceValue: product.priceValue,
        };

        // Get current cart data first
        const doc = await userDoc.get();
        const currentCart = Array.isArray(doc.data()?.cart) ? doc.data()?.cart : [];

        // Create new cart array with added item
        const newCart = [...currentCart, cartItem];

        // Update the cart
        await userDoc.set({
          cart: newCart
        }, { merge: true });
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  // Remove product from cart
  const removeFromCart = async (productId: string) => {
    if (!userData?.id) return;

    try {
      const userDoc = firestore().collection('users').doc(userData.id);

      // Find the exact item to remove
      const itemToRemove = items.find(item => item.id === productId);
      if (!itemToRemove) return;

      // Get current cart
      const doc = await userDoc.get();
      // Ensure we have a valid array
      const currentCart = Array.isArray(doc.data()?.cart) ? doc.data()?.cart : [];

      // Create new cart without the item
      const newCart = currentCart.filter((item: CartItem) => item.id !== productId);

      // Update Firestore with new cart
      await userDoc.update({
        cart: newCart
      });
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  // Update product quantity
  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (!userData?.id || newQuantity < 1) return;

    try {
      const userDoc = firestore().collection('users').doc(userData.id);

      // Get current cart
      const doc = await userDoc.get();
      // Ensure we have a valid array
      const currentCart = Array.isArray(doc.data()?.cart) ? doc.data()?.cart : [];

      // Create new cart with updated quantity
      const newCart = currentCart.map((item: CartItem) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      );

      // Update Firestore with new cart
      await userDoc.update({
        cart: newCart
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!userData?.id) return;

    try {
      const userDoc = firestore().collection('users').doc(userData.id);
      await userDoc.update({
        cart: []
      });
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  // Calculate total price
  const getCartTotal = () => {
    // Ensure we're working with a valid array
    if (!Array.isArray(items)) return 0;
    return items.reduce((total, item) => total + ((item.priceValue || 0) * (item.quantity || 0)), 0);
  };

  // Calculate total items
  const getItemCount = () => {
    // Ensure we're working with a valid array
    if (!Array.isArray(items)) return 0;
    return items.reduce((count, item) => count + (item.quantity || 0), 0);
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
};