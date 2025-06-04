import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, SafeAreaView, Platform, StatusBar, Dimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import firestore from '@react-native-firebase/firestore';
import { useUser } from '../../contexts/UserContext';
import { useCart } from '../../contexts/CartContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32; // Full width minus padding

// Define types
interface Product {
    id: string;
    title: string;
    price: number;
    newPrice: string;
    priceValue: number;
    discountedPrice?: string;
    discountedPriceValue?: number;
    image: string;
    description: string;
    colors: string[];
    sizes?: string[];
    colorImages: {
        [key: string]: string[];
    };
}

type RootStackParamList = {
    ProductDetail: { product: Product };
    MainTabs: undefined;
    Cart: undefined;
};

type CategoryProductsRouteProp = RouteProp<{ CategoryProducts: { category: string } }, 'CategoryProducts'>;
type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

const CategoryProductsScreen = () => {
    const navigation = useNavigation<NavigationProps>();
    const route = useRoute<CategoryProductsRouteProp>();
    const { category } = route.params;
    const [products, setProducts] = useState<Product[]>([]);
    const { userData } = useUser();
    const { items } = useCart();

    useEffect(() => {
        const fetchProducts = async () => {
            if (!userData?.country) return;

            const allowedCurrencies = ['USD', 'EUR', 'INR', 'GBP'];
            const countryName = userData.country;

            let currencyCode = 'EUR'; // Default
            try {
                const res = await fetch(`https://restcountries.com/v3.1/name/${countryName}`);
                const data = await res.json();

                if (Array.isArray(data) && data.length > 0 && data[0].currencies) {
                    const fetchedCurrencyCode = Object.keys(data[0].currencies)[0];
                    if (allowedCurrencies.includes(fetchedCurrencyCode)) {
                        currencyCode = fetchedCurrencyCode;
                    }
                }
            } catch (err) {
                console.error('Failed to get valid currency code:', err);
            }

            let exchangeRate = 1; // Default is EUR
            if (currencyCode !== 'EUR') {
                try {
                    const res = await fetch(`https://api.frankfurter.app/latest?from=EUR&to=${currencyCode}`);
                    const data = await res.json();
                    if (data && data.rates && data.rates[currencyCode]) {
                        exchangeRate = data.rates[currencyCode];
                    }
                } catch (err) {
                    console.error('Failed to get exchange rate:', err);
                }
            }

            const querySnapshot = await firestore()
                .collection('EcommerceProducts')
                .doc(category)
                .collection('products')
                .get();

            const updatedProducts = querySnapshot.docs.map((doc: any) => {
                const data = doc.data();
                const priceInEUR = data.price;
                const discountedPriceInEUR = data.discountedPrice;

                const convertedPrice = (priceInEUR * exchangeRate).toFixed(2);
                const priceWithSymbol = `${getCurrencySymbol(currencyCode)} ${convertedPrice}`;

                let discountedPriceWithSymbol = undefined;
                let discountedPriceValue = undefined;

                if (discountedPriceInEUR) {
                    const convertedDiscountedPrice = (discountedPriceInEUR * exchangeRate).toFixed(2);
                    discountedPriceWithSymbol = `${getCurrencySymbol(currencyCode)} ${convertedDiscountedPrice}`;
                    discountedPriceValue = +convertedDiscountedPrice;
                }

                return {
                    id: doc.id,
                    ...data,
                    price: priceInEUR,
                    newPrice: priceWithSymbol,
                    priceValue: +convertedPrice,
                    discountedPrice: discountedPriceWithSymbol,
                    discountedPriceValue: discountedPriceValue,
                    discountedPriceInEUR,
                    currency: currencyCode,
                };
            });

            setProducts(updatedProducts);
        };

        fetchProducts();
    }, [userData?.country, category]);

    const handleProductPress = (product: Product) => {
        navigation.navigate('ProductDetail', { product });
    };

    const getCurrencySymbol = (currencyCode: string): string => {
        return (0).toLocaleString(undefined, {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).replace(/\d/g, '').trim();
    };

    const calculateDiscountPercentage = (originalPrice: number, discountedPrice: number) => {
        return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
    };

    const renderProductCard = ({ item }: { item: Product }) => {
        const allImages = Object.values(item.colorImages || {}).flat();
        const randomImage = allImages.length > 0 ? allImages[0] : null;

        const discountPercentage = item.discountedPriceValue && item.priceValue
            ? calculateDiscountPercentage(item.priceValue, item.discountedPriceValue)
            : 0;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => handleProductPress(item)}
                activeOpacity={0.8}
            >
                <View style={styles.imageContainer}>
                    {randomImage ? (
                        <Image
                            source={{ uri: randomImage }}
                            style={styles.productImage}
                            resizeMode="contain"
                        />
                    ) : (
                        <View style={styles.noImageContainer}>
                            <Text style={styles.noImageText}>No Image</Text>
                        </View>
                    )}

                    {/* Discount Badge */}
                    {discountPercentage > 0 && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>-{discountPercentage}%</Text>
                        </View>
                    )}

                </View>

                <View style={styles.cardContent}>
                    <Text style={styles.productTitle} numberOfLines={2}>
                        {item.title}
                    </Text>

                    <View style={styles.priceContainer}>
                        {item.discountedPrice ? (
                            <>
                                <Text style={styles.discountedPrice}>{item.discountedPrice}</Text>
                                <Text style={styles.originalPrice}>{item.newPrice}</Text>
                            </>
                        ) : (
                            <Text style={styles.regularPrice}>{item.newPrice}</Text>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Enhanced Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <View style={styles.iconContainer}>
                        <Text style={styles.backArrow}>←</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                    <Text style={styles.productCount}>
                        {products.length} item{products.length !== 1 ? 's' : ''}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.cartButton}
                    onPress={() => navigation.navigate('Cart')}
                    activeOpacity={0.7}
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

            {/* Products Grid */}
            <FlatList
                data={products}
                renderItem={renderProductCard}
                keyExtractor={item => item.id}
                numColumns={1}
                contentContainerStyle={styles.productList}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
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
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1a1a1a',
        letterSpacing: -0.5,
    },
    productCount: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 2,
    },
    backButton: {
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
    cartButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
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
    productList: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 40,
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        overflow: 'hidden',
    },
    imageContainer: {
        height: 280, // Increased height for better image display
        position: 'relative',
        backgroundColor: '#f8f9fa',
    },
    productImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain', // Changed to contain to ensure full image visibility
    },
    noImageContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
    },
    noImageText: {
        color: '#9ca3af',
        fontSize: 14,
        fontWeight: '500',
    },
    discountBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: '#ef4444',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    discountText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
    },
    wishlistButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    heartIcon: {
        fontSize: 16,
        color: '#6b7280',
    },
    cardContent: {
        padding: 16,
    },
    productTitle: {
        fontSize: 18, // Increased font size
        fontWeight: '600',
        color: '#1f2937',
        lineHeight: 24, // Increased line height
        marginBottom: 12,
    },
    colorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 6,
    },
    colorDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    moreColors: {
        fontSize: 12,
        color: '#6b7280',
        marginLeft: 4,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12, // Increased gap between prices
        marginTop: 8,
    },
    discountedPrice: {
        fontSize: 20, // Increased font size
        fontWeight: '700',
        color: '#059669',
    },
    originalPrice: {
        fontSize: 16, // Increased font size
        fontWeight: '500',
        color: '#9ca3af',
        textDecorationLine: 'line-through',
    },
    regularPrice: {
        fontSize: 20, // Increased font size
        fontWeight: '700',
        color: '#1f2937',
    },
});

export default CategoryProductsScreen;