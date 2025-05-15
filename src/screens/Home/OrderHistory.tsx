import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../../contexts/UserContext';
import firestore from '@react-native-firebase/firestore';

interface OrderProduct {
    id: string;
    title: string;
    price: number;
    quantity: number;
    image: string;
    totalPrice: number;
    newPrice: number;
    priceWithSymbol:string;
}

interface Order {
    orderId: string;
    customerName: string;
    dateOfOrder: any; // Firestore timestamp
    products: OrderProduct[];
    totalAmount: number;
    orderStatus: string;
    shippingAddress: any;
    priceWithSymbol:string;
}

const OrderHistory = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const { userData } = useUser();
    const navigation = useNavigation();

    const fetchOrders = useCallback(async () => {
        if (!userData?.id) return;

        try {
            const ordersRef = firestore()
                .collection('usersOrders')
                .doc(userData.id)
                .collection('orders')
                .orderBy('dateOfOrder', 'desc');

            const snapshot = await ordersRef.get();
            const ordersList = snapshot.docs.map(doc => ({
                ...doc.data(),
                dateOfOrder: doc.data().dateOfOrder?.toDate(),
            })) as Order[];

            setOrders(ordersList);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    }, [userData?.id]);

    useEffect(() => {
        if (userData?.id) {
            fetchOrders();
        }
    }, [userData?.id, fetchOrders]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderOrderItem = ({ item }: { item: Order }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{item.orderId}</Text>
                <Text style={[
                    styles.orderStatus,
                    { color: item.orderStatus === 'pending' ? '#FFA500' : '#00843D' }
                ]}>
                    {item.orderStatus.toUpperCase()}
                </Text>
            </View>

            <Text style={styles.orderDate}>
                {formatDate(item.dateOfOrder)}
            </Text>

            <View style={styles.productsList}>
                {item.products.map((product, index) => (
                    <View key={index} style={styles.productItem}>
                        <Image
                            source={{ uri: product.image }}
                            style={styles.productImage}
                            resizeMode="cover"
                        />
                        <View style={styles.productDetails}>
                            <Text style={styles.productTitle}>{product.title}</Text>
                            <Text style={styles.productQuantity}>Qty: {product.quantity}</Text>
                            <Text style={styles.productPrice}>
                                {(product.priceWithSymbol)}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>

            <View style={styles.orderFooter}>
                <Text style={styles.totalLabel}>Total Amount:</Text>
                <Text style={styles.totalAmount}>{(item.products[0].priceWithSymbol.slice(0, 1))}{item.totalAmount.toFixed(2)}</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00843D" />
            </View>
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
                <Text style={styles.headerTitle}>Order History</Text>
                <View style={styles.placeholderView} />
            </View>

            {orders.length > 0 ? (
                <FlatList
                    data={orders}
                    renderItem={renderOrderItem}
                    keyExtractor={item => item.orderId}
                    contentContainerStyle={styles.ordersList}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No orders found</Text>
                </View>
            )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ordersList: {
        padding: 16,
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderId: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    orderStatus: {
        fontSize: 14,
        fontWeight: '500',
    },
    orderDate: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    productsList: {
        marginBottom: 12,
    },
    productItem: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
    },
    productDetails: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    productTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    productQuantity: {
        fontSize: 12,
        color: '#666',
    },
    productPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#00843D',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 12,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
});

export default OrderHistory;
