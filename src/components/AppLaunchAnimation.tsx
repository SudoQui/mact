import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, StatusBar, StyleSheet, Text, View } from 'react-native';

const CREAM = '#FBF4E6';
const EMERALD = '#07543F';
const GOLD = '#B99136';
const TEXT_SHADOW = 'rgba(65, 45, 18, 0.14)';
const USLIMS = 'uslims';
const USLIMS_WIDTH = 154;
const USLIMS_LETTER_WIDTH = USLIMS_WIDTH / USLIMS.length;
const JOIN_GAP_WIDTH = 18;
const ACT_JOIN_DISTANCE = USLIMS_WIDTH + JOIN_GAP_WIDTH;
const FINAL_CENTER_SHIFT = ACT_JOIN_DISTANCE / 2;
const DELETE_STEP_MS = 96;

export function AppLaunchAnimation() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [deletedCount, setDeletedCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [revealProgress] = useState(() => new Animated.Value(0));
  const [actJoinProgress] = useState(() => new Animated.Value(0));
  const [zoomProgress] = useState(() => new Animated.Value(0));
  const [overlayOpacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    // TODO: Respect reduced motion preferences before the native splash is refined.
    // TODO: Consider coordinating this with expo-splash-screen if the native splash phase changes.
    const timers: ReturnType<typeof setTimeout>[] = [];
    const startDeleteAt = 820;
    const startJoinAt = startDeleteAt + USLIMS.length * DELETE_STEP_MS + 80;
    const startZoomAt = startJoinAt + 460 + 320;

    const introAnimation = Animated.timing(revealProgress, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    const joinAnimation = Animated.timing(actJoinProgress, {
      toValue: 1,
      duration: 440,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    const exitAnimation = Animated.parallel([
      Animated.timing(zoomProgress, {
        toValue: 1,
        duration: 640,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(revealProgress, {
        toValue: 0,
        duration: 640,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 640,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    introAnimation.start();

    timers.push(setTimeout(() => setIsDeleting(true), startDeleteAt));

    for (let step = 1; step <= USLIMS.length; step += 1) {
      timers.push(
        setTimeout(() => {
          setDeletedCount(step);
        }, startDeleteAt + step * DELETE_STEP_MS)
      );
    }

    timers.push(
      setTimeout(() => {
        setIsDeleting(false);
        joinAnimation.start();
      }, startJoinAt)
    );

    timers.push(
      setTimeout(() => {
        exitAnimation.start(({ finished }) => {
          if (finished) setIsSplashVisible(false);
        });
      }, startZoomAt)
    );

    return () => {
      timers.forEach(clearTimeout);
      introAnimation.stop();
      joinAnimation.stop();
      exitAnimation.stop();
    };
  }, [actJoinProgress, overlayOpacity, revealProgress, zoomProgress]);

  const remainingTail = USLIMS.slice(0, USLIMS.length - deletedCount);
  const cursorLeft = Math.max(0, remainingTail.length * USLIMS_LETTER_WIDTH + 2);
  const lineTranslateX = actJoinProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FINAL_CENTER_SHIFT],
  });
  const actTranslateX = actJoinProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -ACT_JOIN_DISTANCE],
  });
  const logoScale = zoomProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 10],
  });
  const logoOpacity = zoomProgress.interpolate({
    inputRange: [0, 0.58, 1],
    outputRange: [1, 0.82, 0],
  });
  const backgroundOpacity = zoomProgress.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [1, 0.92, 0],
  });

  return (
    <Modal
      animationType="none"
      hardwareAccelerated
      onRequestClose={() => undefined}
      transparent={false}
      visible={isSplashVisible}
    >
      <StatusBar backgroundColor={CREAM} barStyle="dark-content" />
      <Animated.View style={[styles.screen, { opacity: overlayOpacity }]}>
        <Animated.View style={[styles.background, { opacity: backgroundOpacity }]} />
        <Animated.View
          accessible
          accessibilityLabel={deletedCount === USLIMS.length ? 'MACT' : 'Muslims ACT'}
          accessibilityRole="text"
          style={[
            styles.logoFrame,
            {
              opacity: revealProgress,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.wordLine,
              { opacity: logoOpacity, transform: [{ translateX: lineTranslateX }] },
            ]}
          >
            <Text style={[styles.logoText, styles.emeraldText]}>M</Text>
            <View style={styles.uslimsSlot}>
              <Text style={[styles.logoText, styles.emeraldText]}>{remainingTail}</Text>
              {isDeleting ? <View style={[styles.cursor, { left: cursorLeft }]} /> : null}
            </View>
            <Animated.View style={[styles.actCluster, { transform: [{ translateX: actTranslateX }] }]}>
              <Text style={[styles.logoText, styles.goldText]}>ACT</Text>
              <Animated.View style={[styles.goldRule, { opacity: actJoinProgress }]} />
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: CREAM,
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: CREAM,
  },
  logoFrame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordLine: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  logoText: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 54,
    textShadowColor: TEXT_SHADOW,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 14,
  },
  emeraldText: {
    color: EMERALD,
  },
  goldText: {
    color: GOLD,
  },
  uslimsSlot: {
    height: 58,
    justifyContent: 'center',
    position: 'relative',
    width: USLIMS_WIDTH,
  },
  cursor: {
    backgroundColor: EMERALD,
    borderRadius: 1,
    height: 42,
    position: 'absolute',
    top: 8,
    width: 2,
  },
  actCluster: {
    alignItems: 'center',
    marginLeft: JOIN_GAP_WIDTH,
  },
  goldRule: {
    backgroundColor: GOLD,
    borderRadius: 2,
    height: 4,
    marginTop: -2,
    width: 48,
  },
});
