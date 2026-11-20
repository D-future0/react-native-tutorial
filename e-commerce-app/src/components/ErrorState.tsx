import { StyleSheet, Text, View } from 'react-native';
import Button from './Button';
import { theme } from '../theme';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.mark}>!</Text>
      <Text style={styles.title}>We hit a small snag</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Button title="Try again" onPress={onRetry} style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 260,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
    gap: 10,
  },
  mark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F6E6E2',
    color: theme.colors.danger,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  title: { color: theme.colors.ink, fontSize: 19, fontWeight: '800' },
  message: {
    color: theme.colors.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  button: { minWidth: 150, marginTop: 10 },
});
