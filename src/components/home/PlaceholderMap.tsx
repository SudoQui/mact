import { StyleSheet, Text, View } from 'react-native';

type PlaceholderMapProps = {
  accentColor: string;
};

export function PlaceholderMap({ accentColor }: PlaceholderMapProps) {
  return (
    <View style={[styles.container, { borderColor: accentColor }]}>
      <View style={[styles.marker, { backgroundColor: accentColor }]} />
      <Text style={styles.text}>Map will appear here</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    overflow: 'hidden',
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
});
