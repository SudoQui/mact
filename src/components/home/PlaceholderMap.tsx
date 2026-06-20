import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type PlaceholderMapProps = {
  accentColor: string;
  children: ReactNode;
};

export function PlaceholderMap({ accentColor, children }: PlaceholderMapProps) {
  return (
    <View style={[styles.container, { borderColor: accentColor }]}>
      <View style={styles.placeholderHeader}>
        <View style={[styles.marker, { backgroundColor: accentColor }]} />
        <Text style={styles.text}>Map will appear here</Text>
      </View>
      <View style={styles.results}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 320,
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: '#ECEFF3',
    padding: 14,
    gap: 12,
    overflow: 'hidden',
  },
  placeholderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  marker: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  text: {
    color: '#3F4652',
    fontSize: 17,
    fontWeight: '700',
  },
  results: {
    flex: 1,
  },
});
