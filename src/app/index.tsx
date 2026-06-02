// app/index.tsx

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getPlacesByMode, type Place } from '../services/placesService';

export default function SupabaseConnectionTestScreen() {
  const [foodPlaces, setFoodPlaces] = useState<Place[]>([]);
  const [prayerPlaces, setPrayerPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setErrorMessage(null);

      const [foodData, prayerData] = await Promise.all([
        getPlacesByMode('food'),
        getPlacesByMode('prayer'),
      ]);

      setFoodPlaces(foodData);
      setPrayerPlaces(prayerData);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong loading Supabase data.';

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading MACT data from Supabase...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>MACT Supabase Test</Text>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Connection failed</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Food places loaded</Text>
              <Text style={styles.count}>{foodPlaces.length}</Text>

              {foodPlaces.map((place) => (
                <Text key={place.id} style={styles.item}>
                  {place.name} | {place.suburb ?? 'No suburb'}
                </Text>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Prayer places loaded</Text>
              <Text style={styles.count}>{prayerPlaces.length}</Text>

              {prayerPlaces.map((place) => (
                <Text key={place.id} style={styles.item}>
                  {place.name} | {place.suburb ?? 'No suburb'}
                </Text>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  count: {
    fontSize: 36,
    fontWeight: '800',
  },
  item: {
    fontSize: 15,
    paddingVertical: 4,
  },
  errorBox: {
    backgroundColor: '#fff0f0',
    borderRadius: 16,
    padding: 18,
    gap: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 15,
  },
});