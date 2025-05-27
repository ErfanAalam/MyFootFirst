import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    FlatList,
    TouchableOpacity,
    Text,
    ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, LatLng } from 'react-native-maps';
import firestore from '@react-native-firebase/firestore';
import CountryPicker from 'react-native-country-picker-modal';
import { Country, CountryCode } from 'react-native-country-picker-modal';
import { useUser } from '../../contexts/UserContext';

interface LocationData {
    latitude: number;
    longitude: number;
    name: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    country: string;
    shopName: string;
}

const MapScreen: React.FC = () => {
    const { userData } = useUser();
    const mapRef = useRef<MapView | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [locations, setLocations] = useState<LocationData[]>([]);
    const [filteredLocations, setFilteredLocations] = useState<LocationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const [countryCode, setCountryCode] = useState<CountryCode>('IN');

    // Set initial country from user context
    useEffect(() => {
        if (userData?.country) {
            setSelectedCountry(userData.country);
            // The country code will be set when user selects a country
            // or we can use the default 'IN' for India
            // setCountryCode('IN');
        }
    }, [userData]);

    // Fetch locations from Firestore
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                setLoading(true);
                const retailersSnapshot = await firestore()
                    .collection('Retailers')
                    .get();

                const allLocations: LocationData[] = [];
                retailersSnapshot.forEach((retailerDoc) => {
                    const retailerData = retailerDoc.data();
                    if (retailerData.locations && Array.isArray(retailerData.locations)) {
                        retailerData.locations.forEach((location: LocationData) => {
                            allLocations.push({
                                ...location,
                                name: location.shopName || 'Unknown Shop',
                            });
                        });
                    }
                });

                setLocations(allLocations);
                setError(null);
            } catch (err) {
                console.error('Error fetching locations:', err);
                setError('Failed to load locations. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchLocations();
    }, []);

    // Filter locations when country changes
    useEffect(() => {
        if (selectedCountry) {
            const filtered = locations.filter(location => 
                location.country && 
                location.country.toLowerCase() === selectedCountry.toLowerCase()
            );
            setFilteredLocations(filtered);
        } else {
            setFilteredLocations(locations);
        }
    }, [selectedCountry, locations]);

    // Update the map view when filtered locations change
    useEffect(() => {
        if (mapRef.current && filteredLocations.length > 0 && isInitialLoad) {
            const coords: LatLng[] = filteredLocations.map(({ latitude, longitude }) => ({
                latitude,
                longitude,
            }));

            setTimeout(() => {
                if (mapRef.current) {
                    mapRef.current.fitToCoordinates(coords, {
                        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                        animated: true,
                    });
                    setIsInitialLoad(false);
                }
            }, 1500);
        }
    }, [filteredLocations, isInitialLoad]);

    const handleLocationPress = (location: LocationData) => {
        setSelectedLocation(location);

        if (mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 1000);
        }
    };

    const showAllLocations = () => {
        if (mapRef.current && locations.length > 0) {
            const coords: LatLng[] = locations.map(({ latitude, longitude }) => ({
                latitude,
                longitude,
            }));

            mapRef.current.fitToCoordinates(coords, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
            });
            setSelectedLocation(null);
        }
    };

    const getFullAddress = (location: LocationData): string => {
        const addressParts = [
            location.addressLine1,
            location.addressLine2,
            location.city,
            location.state
        ].filter(Boolean);
        return addressParts.join(', ');
    };

    const renderLocationItem = ({ item }: { item: LocationData }) => (
        <TouchableOpacity
            style={[
                styles.locationItem,
                selectedLocation?.name === item.name && styles.selectedLocationItem,
            ]}
            onPress={() => handleLocationPress(item)}
        >
            <View style={styles.locationItemContent}>
                <Text style={[
                    styles.locationName,
                    selectedLocation?.name === item.name && styles.selectedLocationName,
                ]}>
                    {item.name}
                </Text>
                <Text style={styles.locationAddress}>
                    {getFullAddress(item)}
                </Text>
            </View>
            <View style={[
                styles.locationIndicator,
                selectedLocation?.name === item.name && styles.selectedLocationIndicator,
            ]} />
        </TouchableOpacity>
    );

    const onSelectCountry = (country: Country) => {
        setCountryCode(country.cca2);
        setSelectedCountry(country.name as string);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00843D" />
                <Text style={styles.loadingText}>Loading locations...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => setLoading(true)}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Map View - Top Half */}
            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={PROVIDER_GOOGLE}
                    showsUserLocation={false}
                    zoomControlEnabled={true}
                    zoomEnabled={true}
                    scrollEnabled={true}
                    pitchEnabled={true}
                    rotateEnabled={true}
                    initialRegion={{
                        latitude: filteredLocations[0]?.latitude ?? 0,
                        longitude: filteredLocations[0]?.longitude ?? 0,
                        latitudeDelta: 30,
                        longitudeDelta: 30,
                    }}
                >
                    {filteredLocations.map((marker, index) => (
                        <Marker
                            key={index}
                            coordinate={{
                                latitude: marker.latitude,
                                longitude: marker.longitude,
                            }}
                            title={marker.name}
                            description={getFullAddress(marker)}
                            pinColor={selectedLocation?.name === marker.name ? '#FF6B6B' : '#FF0000'}
                            onPress={() => handleLocationPress(marker)}
                        />
                    ))}
                </MapView>
                <View style={styles.countryPickerContainer}>
                    <Text style={styles.countryPickerLabel}>Select country to see other locations</Text>
                    <CountryPicker
                        withFilter
                        withFlag
                        withCountryNameButton
                        withAlphaFilter
                        onSelect={onSelectCountry}
                        countryCode={countryCode}
                        containerButtonStyle={styles.countryPickerButton}
                        theme={{
                            primaryColor: '#00843D',
                            primaryColorVariant: '#006B30',
                            backgroundColor: '#FFFFFF',
                            onBackgroundTextColor: '#333333',
                            fontSize: 16,
                        }}
                    />
                </View>
            </View>

            {/* Location List - Bottom Half */}
            <View style={styles.listContainer}>
                <View style={styles.listHeader}>
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={styles.listHeaderText}>
                                Locations ({filteredLocations.length})
                                {selectedCountry && ` in ${selectedCountry}`}
                            </Text>
                            <Text style={styles.listSubHeaderText}>Tap a location to focus on map</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.showAllButton}
                            onPress={showAllLocations}
                        >
                            <Text style={styles.showAllButtonText}>Show All</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <FlatList
                    data={filteredLocations}
                    renderItem={renderLocationItem}
                    keyExtractor={(item, index) => `${item.name}-${index}`}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                />
            </View>
        </View>
    );
};

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    mapContainer: {
        height: height * 0.65, // Increased from 0.5 to 0.65 for larger map
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    listContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginTop: -20,
        paddingTop: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
    },
    listHeader: {
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    listHeaderText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    listSubHeaderText: {
        fontSize: 14,
        color: '#666',
    },
    showAllButton: {
        backgroundColor: '#00843D',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    showAllButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: 15,
        paddingTop: 10,
    },
    locationItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        borderLeftWidth: 4,
        borderLeftColor: '#e9ecef',
    },
    selectedLocationItem: {
        backgroundColor: '#06d666',
        borderLeftColor: '#00843D',
        elevation: 3,
    },
    locationItemContent: {
        flex: 1,
    },
    locationName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    selectedLocationName: {
        color: '#ffffff',
    },
    locationAddress: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    locationIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#dee2e6',
    },
    selectedLocationIndicator: {
        backgroundColor: '#00843D',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#FF0000',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#00843D',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    countryPickerContainer: {
        position: 'absolute',
        top: 50,
        left: 10,
        right: 10,
        zIndex: 1,
        backgroundColor: 'white',
        borderRadius: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        padding: 12,
    },
    countryPickerLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        textAlign: 'center',
        fontWeight: '500',
    },
    countryPickerButton: {
        width: '100%',
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 6,
    },
    countryPickerText: {
        fontSize: 16,
        color: '#333',
    },
});

export default MapScreen;
