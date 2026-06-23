import { StyleSheet, TextInput, View } from 'react-native';

type HomeSearchBarProps = {
  accentColor: string;
  value: string;
  onChangeText: (value: string) => void;
};

export function HomeSearchBar({ accentColor, value, onChangeText }: HomeSearchBarProps) {
  return (
    <View style={[styles.container, { borderColor: accentColor }]}>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder="Search MACT"
        placeholderTextColor="#7B7F87"
        returnKeyType="search"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  input: {
    color: '#16181D',
    fontSize: 16,
    fontWeight: '600',
    minHeight: 44,
    padding: 0,
  },
});
