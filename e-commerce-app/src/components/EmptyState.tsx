import { StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { theme } from '../theme';

interface EmptyStateProps {
  mark?: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({
  mark = '✳',
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.markWrap}>
        <Text style={styles.mark}>{mark}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 340,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  markWrap: {
    width: 62,
    height: 62,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: { color: theme.colors.primary, fontSize: 28 },
  title: { marginTop: 18, color: theme.colors.ink, fontSize: 21, fontWeight: '700' },
  description: { marginTop: 7, color: theme.colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  action: { width: '100%', marginTop: 20 },
});
