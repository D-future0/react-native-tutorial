import { router, useLocalSearchParams } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/Button';
import EmptyState from '../../src/components/EmptyState';
import ErrorState from '../../src/components/ErrorState';
import LoadingState from '../../src/components/LoadingState';
import { useAuthStore } from '../../src/features/auth/store';
import { useOrders } from '../../src/features/orders/hooks';
import { formatPrice, theme } from '../../src/theme';

export default function OrdersScreen() {
  const { placed } = useLocalSearchParams<{ placed?: string }>();
  const accessToken = useAuthStore((state) => state.accessToken);
  const { data: orders, isLoading, isError, error, refetch } = useOrders();

  if (!accessToken) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <EmptyState
          title="Sign in to see your orders"
          description="Your order history is saved to your account."
          action={
            <Button
              title="Go to your account"
              onPress={() => router.push('/(tabs)/profile')}
            />
          }
        />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <LoadingState label="Gathering your orders…" />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ErrorState
          message={error instanceof Error ? error.message : 'Your orders could not be loaded.'}
          onRetry={() => void refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.back}>‹  Back</Text>
        </Pressable>
        <Text style={styles.eyebrow}>YOUR Shoppi HISTORY</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your orders</Text>
        <Text style={styles.subtitle}>Every good find, all in one place.</Text>

        {placed ? (
          <View style={styles.confirmation}>
            <Text style={styles.confirmationMark}>✓</Text>
            <View style={styles.confirmationTextWrap}>
              <Text style={styles.confirmationTitle}>Order placed</Text>
              <Text style={styles.confirmationCopy}>
                Your order {placed.slice(0, 8)} is now in your list.
              </Text>
            </View>
          </View>
        ) : null}

        {!orders?.length ? (
          <EmptyState
            mark="↗"
            title="No orders yet"
            description="Your next favorite thing is waiting in the collection."
            action={
              <Button title="Explore the collection" onPress={() => router.replace('/')} />
            }
          />
        ) : (
          <View style={styles.orderList}>
            {orders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderLabel}>ORDER</Text>
                    <Text style={styles.orderId}>{order.id.slice(0, 12)}</Text>
                  </View>
                  <Text style={styles.orderTotal}>{formatPrice(order.totalCents)}</Text>
                </View>
                <View style={styles.divider} />
                {order.items.map((item, index) => (
                  <View key={`${item.productId}-${index}`} style={styles.itemRow}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemQuantity}>× {item.quantity}</Text>
                  </View>
                ))}
                {order.deliveryAddress ? (
                  <Text style={styles.deliveryAddress}>
                    Deliver to: {order.deliveryAddress}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    minHeight: 52,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: { color: theme.colors.ink, fontSize: 14, fontWeight: '600' },
  eyebrow: { color: theme.colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 32 },
  title: { color: theme.colors.ink, fontSize: 29, fontWeight: '700', letterSpacing: -0.8 },
  subtitle: { marginTop: 6, color: theme.colors.muted, fontSize: 14 },
  confirmation: {
    marginTop: 21,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: theme.radius.medium,
    backgroundColor: '#E8EFE7',
  },
  confirmationMark: { color: theme.colors.success, fontSize: 20, fontWeight: '800' },
  confirmationTextWrap: { flex: 1 },
  confirmationTitle: { color: theme.colors.ink, fontSize: 14, fontWeight: '700' },
  confirmationCopy: { marginTop: 3, color: theme.colors.muted, fontSize: 12 },
  orderList: { gap: 13, marginTop: 23 },
  orderCard: {
    padding: 16,
    borderRadius: theme.radius.medium,
    backgroundColor: theme.colors.surface,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderLabel: { color: theme.colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.3 },
  orderId: { marginTop: 4, color: theme.colors.ink, fontSize: 14, fontWeight: '700' },
  orderTotal: { color: theme.colors.primary, fontSize: 15, fontWeight: '800' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 13, backgroundColor: theme.colors.line },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 4 },
  itemName: { flex: 1, color: theme.colors.ink, fontSize: 13 },
  itemQuantity: { color: theme.colors.muted, fontSize: 12 },
  deliveryAddress: {
    marginTop: 11,
    color: theme.colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
});