import { StyleSheet, Text, View } from 'react-native';

type UnderConstructionCardProps = {
  accentColor: string;
  body: string;
  footer: string;
  icon: string;
  title: string;
};

export function UnderConstructionCard({
  accentColor,
  body,
  footer,
  icon,
  title,
}: UnderConstructionCardProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconBubble, { backgroundColor: `${accentColor}18` }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        <Text style={[styles.footer, { color: accentColor }]}>{footer}</Text>
      </View>

      <View style={styles.dotsRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={[styles.dot, { backgroundColor: accentColor }]} />
        <View style={[styles.dot, styles.dotMuted]} />
        <View style={[styles.dot, { backgroundColor: accentColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F0C88A',
    backgroundColor: '#FFF8EC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 22,
    paddingVertical: 28,
    shadowColor: '#7A4E12',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  iconBubble: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 38,
  },
  copy: {
    gap: 10,
    alignItems: 'center',
  },
  title: {
    color: '#25180A',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    textAlign: 'center',
  },
  body: {
    color: '#5A4530',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'center',
  },
  footer: {
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 21,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotMuted: {
    backgroundColor: '#F3D8AD',
  },
});
