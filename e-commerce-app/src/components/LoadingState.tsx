import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export default function LoadingState({ label = 'Loading your store…' }: { label?: string }) {
  return (
    <View style={styles.container} accessibilityRole="progressbar">
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  label: { color: theme.colors.muted, fontSize: 14 },
});
