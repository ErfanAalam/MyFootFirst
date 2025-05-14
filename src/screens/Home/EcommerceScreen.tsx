import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import firestore from '@react-native-firebase/firestore';
import { useUser } from '../../contexts/UserContext';

// Define types
interface Product {
  id: string;
  title: string;
  price: number;
  newPrice: string;
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

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;



interface ProductCardProps {
  item: Product;
  onPress: () => void;
}


const getCurrencyCode = async (countryName: string): Promise<string> => {
  try {
    const res = await fetch(`https://restcountries.com/v3.1/name/${countryName}`);
    const data = await res.json();

    if (Array.isArray(data) && data.length > 0 && data[0].currencies) {
      return Object.keys(data[0].currencies)[0];
    }

    throw new Error('Currency data not found');
  } catch (err) {
    console.error('Failed to fetch currency code:', err);
    return 'EUR';
  }
};


const getExchangeRate = async (toCurrency: string): Promise<number> => {
  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=EUR&to=${toCurrency}`);
    const data = await res.json();
    console.log(data);

    if (!data || !data.rates || !data.rates[toCurrency]) {
      throw new Error('Invalid exchange rate response');
    }

    return data.rates[toCurrency];
  } catch (err) {
    console.error('Failed to fetch exchange rate:', err);
    return 1; // fallback to EUR
  }
};


const getCurrencySymbol = (currencyCode: string): string => {
  return (0).toLocaleString(undefined, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).replace(/\d/g, '').trim();
};


const ProductCard = ({ item, onPress }: ProductCardProps) => {
  const allImages = Object.values(item.colorImages || {}).flat();

  // Select a random image from the array
  const randomImage = allImages.length > 0
    ? allImages[0]
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        {randomImage ? (
          <Image
            source={{ uri: randomImage }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <Text>No Image</Text>
        )}
      </View>
      <Text style={styles.productTitle}>{item.title}</Text>
      <Text style={styles.productPrice}>{item.newPrice}</Text>
    </TouchableOpacity>
  );
};

const EcommerceScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const [products, setProducts] = useState<Product[]>([]);
  const { userData } = useUser();


  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { product });
  };

  useEffect(() => {
    const fetchProducts = async () => {
      if (!userData?.country) return;

      const allowedCurrencies = ['USD', 'EUR', 'INR', 'GBP'];
      const countryName = userData.country;

      let currencyCode = 'EUR'; // Default
      try {
        const fetchedCurrencyCode = await getCurrencyCode(countryName);
        if (allowedCurrencies.includes(fetchedCurrencyCode)) {
          currencyCode = fetchedCurrencyCode;
        }
      } catch (err) {
        console.error('Failed to get valid currency code:', err);
      }

      let exchangeRate = 1; // Default is EUR
      if (currencyCode !== 'EUR') {
        try {
          exchangeRate = await getExchangeRate(currencyCode);
        } catch (err) {
          console.error('Failed to get exchange rate:', err);
          exchangeRate = 1;
        }
      }

      const querySnapshot = await firestore().collection('EcommerceProducts').get();

      const updatedProducts = querySnapshot.docs.map((doc: any) => {
        const data = doc.data();
        const priceInEUR = data.price;

        const convertedPrice = (priceInEUR * exchangeRate).toFixed(2);
        const priceWithSymbol = `${getCurrencySymbol(currencyCode)} ${convertedPrice}`;

        return {
          id: doc.id,
          ...data,
          price: priceInEUR,
          newPrice: priceWithSymbol,
          priceValue: +convertedPrice,
          currency: currencyCode,
        };
      });

      setProducts(updatedProducts);
    };

    fetchProducts();
  }, [userData?.country]);

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
        <Text style={styles.headerTitle}>MyShop</Text>
        <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate('Cart')}>
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
  backButton: {
    padding: 6,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  card: {
    flex: 1,
    margin: 8,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  imageContainer: {
    height: 160,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    height: "100%",
    width: '100%',
    backgroundColor: 'transparent',
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
    color: '#00843D',
  },
});

export default EcommerceScreen;
