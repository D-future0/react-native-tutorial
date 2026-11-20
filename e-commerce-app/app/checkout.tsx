import { router } from 'expo-router';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../src/components/Button';
import EmptyState from '../src/components/EmptyState';
import { ApiError } from '../src/features/lib/api-client';
import { cartProductsQueryKey } from '../src/features/cart/background-refresh';
import { useCartStore } from '../src/features/cart/store';
import { useCreateOrder } from '../src/features/orders/hooks';
import { useAuthStore } from '../src/features/auth/store';
import { formatPrice, theme } from '../src/theme';

export default function CheckoutScreen() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const refreshError = useCartStore((state) => state.refreshError);
  const accessToken = useAuthStore((state) => state.accessToken);
  const { mutateAsync, isPending } = useCreateOrder();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const totalCents = items.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0,
  );
  const hasUnavailableItems = items.some(
    (item) =>
      item.available === false ||
      (item.stockQuantity !== undefined && item.quantity > item.stockQuantity),
  );

  async function placeOrder() {
    setSubmitError(null);
    try {
      const order = await mutateAsync({
        items: items.map(({ productId, quantity }) => ({ productId, quantity })),
        expectedTotalCents: totalCents,
      });
      clearCart();
      router.replace({ pathname: '/orders', params: { placed: order.id } });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        await queryClient.refetchQueries({
          queryKey: cartProductsQueryKey,
          type: 'active',
        });
      }
      setSubmitError(
        error instanceof Error ? error.message : 'Your order could not be submitted.',
      );
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.back}>‹  Your bag</Text>
        </Pressable>
        <Text style={styles.step}>CHECKOUT</Text>
      </View>

      {items.length === 0 ? (
        <EmptyState
          title="Nothing to check out"
          description="Your bag is empty. Find something you love and come back here."
          action={
            <Button title="Back to the collection" onPress={() => router.replace('/')} />
          }
        />
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.eyebrow}>ALMOST YOURS</Text>
            <Text style={styles.title}>A good choice.</Text>
            <Text style={styles.copy}>
              Review your finds, then place your order. You can browse your orders
              from the Account tab.
            </Text>

            <View style={styles.itemList}>
              {items.map((item) => (
                <View key={item.productId} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemQuantity}>
                      Qty {item.quantity}
                      {item.available === false
                        ? ' · Out of stock'
                        : item.stockQuantity !== undefined &&
                            item.quantity > item.stockQuantity
                          ? ` · Only ${item.stockQuantity} available`
                          : ''}
                    </Text>
                  </View>
                  <Text style={styles.itemPrice}>
                    {formatPrice(item.priceCents * item.quantity)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Order total</Text>
              <Text style={styles.totalValue}>{formatPrice(totalCents)}</Text>
            </View>

            <View style={styles.notice}>
              <Text style={styles.noticeMark}>i</Text>
              <Text style={styles.noticeText}>
                This demo records your order but does not process a payment.
              </Text>
            </View>

            {refreshError ? (
              <View style={styles.refreshWarning}>
                <Text style={styles.refreshText}>
                  Couldn’t refresh product data: {refreshError}. Your saved
                  products and prices remain visible; the server will verify
                  stock before accepting the order.
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
                Update quantities or remove out-of-stock items before placing the order.
              </Text>
            ) : null}
            {!accessToken ? (
              <View style={styles.signInPrompt}>
                <Text style={styles.unavailableText}>
                  Sign in to place an order and save it to your account.
                </Text>
                <Button
                  title="Go to your account"
                  onPress={() => router.push('/(tabs)/profile')}
                />
              </View>
            ) : null}
            {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title={`Place order · ${formatPrice(totalCents)}`}
              onPress={() => void placeOrder()}
              loading={isPending}
              disabled={isPending || hasUnavailableItems || !accessToken}
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
    minHeight: 54,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: { color: theme.colors.ink, fontSize: 14, fontWeight: '600' },
  step: { color: theme.colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  content: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 28 },
  eyebrow: { color: theme.colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  title: { marginTop: 7, color: theme.colors.ink, fontSize: 31, fontWeight: '700', letterSpacing: -1 },
  copy: { marginTop: 8, color: theme.colors.muted, fontSize: 14, lineHeight: 21 },
  itemList: {
    marginTop: 26,
    paddingVertical: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.line,
  },
  itemRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.line,
  },
  itemInfo: { flex: 1 },
  itemName: { color: theme.colors.ink, fontSize: 14, fontWeight: '600' },
  itemQuantity: { marginTop: 4, color: theme.colors.muted, fontSize: 12 },
  itemPrice: { color: theme.colors.ink, fontSize: 14, fontWeight: '600' },
  totalRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { color: theme.colors.ink, fontSize: 15, fontWeight: '700' },
  totalValue: { color: theme.colors.primary, fontSize: 22, fontWeight: '800' },
  notice: {
    marginTop: 22,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: theme.radius.small,
    backgroundColor: '#EFEEE7',
  },
  noticeMark: {
    width: 21,
    height: 21,
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
    color: theme.colors.primary,
    backgroundColor: '#DCE4D8',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  noticeText: { flex: 1, color: theme.colors.muted, fontSize: 12, lineHeight: 18 },
  refreshWarning: {
    marginTop: 16,
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
    marginTop: 14,
    color: theme.colors.danger,
    fontSize: 12,
    lineHeight: 18,
  },
  signInPrompt: { marginTop: 16 },
  error: { marginTop: 15, color: theme.colors.danger, fontSize: 13, lineHeight: 19 },
  footer: {
    padding: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
  },
});