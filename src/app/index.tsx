import { useMemo, useState } from 'react';
import { Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FloatingActionButtons } from '@/components/home/FloatingActionButtons';
import { HomeSearchBar } from '@/components/home/HomeSearchBar';
import { ModeBar } from '@/components/home/ModeBar';
import { PlaceholderMap } from '@/components/home/PlaceholderMap';
import { getModeConfig, type MactMode } from '@/components/home/mactModes';
import { BottomTabInset } from '@/constants/theme';

export default function HomeScreen() {
  const [selectedMode, setSelectedMode] = useState<MactMode>('food');
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();
  const mode = useMemo(() => getModeConfig(selectedMode), [selectedMode]);

  const bottomPadding =
    Platform.OS === 'web' ? insets.bottom + 24 : insets.bottom + BottomTabInset + 16;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: `${mode.color}12` }]}>
      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: bottomPadding,
            paddingLeft: Math.max(insets.left, 18),
            paddingRight: Math.max(insets.right, 18),
          },
        ]}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: mode.color }]}>MACT</Text>
          <Text style={styles.title}>{mode.title}</Text>
          <HomeSearchBar
            accentColor={mode.color}
            onChangeText={setSearchQuery}
            value={searchQuery}
          />
        </View>

        <View style={styles.mapShell}>
          <PlaceholderMap accentColor={mode.color} />
          <FloatingActionButtons accentColor={mode.color} />
        </View>

        <ModeBar onSelectMode={setSelectedMode} selectedMode={selectedMode} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    gap: 16,
  },
  header: {
    gap: 10,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
  },
  title: {
    color: '#151922',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
  },
  mapShell: {
    flex: 1,
    position: 'relative',
  },
});
