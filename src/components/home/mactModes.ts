export type MactMode = 'food' | 'prayer' | 'community';

export type ModeConfig = {
  color: string;
  id: MactMode;
  label: string;
  title: string;
};

export const MACT_MODES: ModeConfig[] = [
  {
    id: 'food',
    label: 'Food',
    title: 'Halal food nearby',
    color: '#D14F2A',
  },
  {
    id: 'prayer',
    label: 'Prayer',
    title: 'Prayer spaces nearby',
    color: '#1C7C66',
  },
  {
    id: 'community',
    label: 'Community',
    title: 'Community support nearby',
    color: '#4B64C8',
  },
];

export function getModeConfig(mode: MactMode) {
  return MACT_MODES.find((item) => item.id === mode) ?? MACT_MODES[0];
}
