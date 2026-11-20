import { router } from 'expo-router';
import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/Button';
import CartItem from '../../src/components/CartItem';
import EmptyState from '../../src/components/EmptyState';
import LoadingState from '../../src/components/LoadingState';
import { cartProductsQueryKey } from '../../src/features/cart/background-refresh';
import { useCartStore } from '../../src/features/cart/store';
import { formatPrice, theme } from '../../src/theme';

export default function CartScreen() {
  const items = useCartStore((state) => state.items);
  const isHydrated = useCartStore((state) => state.isHydrated);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const refreshError = useCartStore((state) => state.refreshError);
  const hasUnavailableItems = items.some((item) => item.available === false);
  const queryClient = useQueryClient();
  const subtotal = useMemo(
    () =>
      items.reduce(
        (totalCents, item) =>
          totalCents + Math.round(item.price * 100) * item.quantity,
        0,
      ) / 100,
    [items],
  );
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  if (!isHydrated) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <LoadingState label="Opening your bag…" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>YOUR GOOD FINDS</Text>
          <Text style={styles.title}>Your bag</Text>
        </View>
        {items.length > 0 ? (
          <Text style={styles.count}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</Text>
        ) : null}
      </View>

      {items.length === 0 ? (
        <EmptyState
          mark="▢"
          title="Your bag is taking a breather"
          description="When something catches your eye, add it here and it’ll be waiting for you."
          action={
            <Button title="Explore the collection" onPress={() => router.replace('/')} />
          }
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.items}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item) => (
              <CartItem
                key={item.productId}
                item={item}
                onChangeQuantity={(quantity) =>
                  updateQuantity(item.productId, quantity)
                }
                onRemove={() => removeItem(item.productId)}
              />
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/')}
              style={styles.continue}
            >
              <Text style={styles.continueText}>＋  Keep browsing</Text>
            </Pressable>
          </ScrollView>

          <View style={styles.summary}>
            {refreshError ? (
              <View style={styles.refreshWarning}>
                <Text style={styles.refreshText}>
                  Couldn’t refresh product prices: {refreshError}. Your saved
                  prices are shown; the server will check them again at checkout.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    void queryClient.refetchQueries({
                      queryKey: cartProductsQueryKey,
                      type: 'active',
                    })
                  }
                >
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {hasUnavailableItems ? (
              <Text style={styles.unavailableText}>
                Remove unavailable items to continue to checkout.
              </Text>
            ) : null}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
            </View>
            <Text style={styles.shipping}>Shipping and taxes calculated at checkout.</Text>
            <Button
              title={`Continue to checkout · ${formatPrice(subtotal)}`}
              onPress={() => router.push('/checkout')}
              disabled={hasUnavailableItems}
              style={styles.checkoutButton}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    minHeight: 88,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: { color: theme.colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  title: { marginTop: 4, color: theme.colors.ink, fontSize: 28, fontWeight: '700', letterSpacing: -0.8 },
  count: { color: theme.colors.muted, fontSize: 13 },
  items: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16, gap: 12 },
  continue: { alignSelf: 'flex-start', paddingVertical: 9 },
  continueText: { color: theme.colors.primary, fontSize: 13, fontWeight: '700' },
  summary: {
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
  },
  refreshWarning: {
    marginBottom: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: theme.radius.small,
    backgroundColor: '#EFEEE7',
  },
  refreshText: { flex: 1, color: theme.colors.muted, fontSize: 12, lineHeight: 18 },
  retryText: { color: theme.colors.primary, fontSize: 12, fontWeight: '700' },
  unavailableText: {
    marginBottom: 12,
    color: theme.colors.danger,
    fontSize: 12,
    lineHeight: 18,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: theme.colors.ink, fontSize: 15, fontWeight: '600' },
  summaryValue: { color: theme.colors.ink, fontSize: 18, fontWeight: '800' },
  shipping: { marginTop: 5, marginBottom: 17, color: theme.colors.muted, fontSize: 12 },
  checkoutButton: { width: '100%' },
});