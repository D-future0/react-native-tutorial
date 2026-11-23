import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AppState,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import {
  getCurrentAddress,
  LocationLookupError,
} from '../src/services/location.service';

export default function CheckoutScreen() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const refreshError = useCartStore((state) => state.refreshError);
  const accessToken = useAuthStore((state) => state.accessToken);
  const { mutateAsync, isPending } = useCreateOrder();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [locationRetry, setLocationRetry] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const locationRequestId = useRef(0);
  const addressRevision = useRef(0);
  const isFocused = useRef(false);
  const hasActiveLookup = useRef(false);
  const wasInterrupted = useRef(false);
  const permissionDeniedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      isFocused.current = true;
      setLocationLoading(false);
      if (wasInterrupted.current) {
        setLocationRetry(true);
        setLocationNotice(
          'Location lookup was interrupted when checkout lost focus. Retry or enter your address manually.',
        );
        wasInterrupted.current = false;
      }

      return () => {
        isFocused.current = false;
        if (hasActiveLookup.current) {
          locationRequestId.current += 1;
          hasActiveLookup.current = false;
          wasInterrupted.current = true;
        }
      };
    }, []),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background' && hasActiveLookup.current) {
        locationRequestId.current += 1;
        hasActiveLookup.current = false;
        wasInterrupted.current = true;
        setLocationLoading(false);
        setLocationRetry(true);
        setLocationNotice(
          'Location lookup was interrupted when the app went into the background. Retry or enter your address manually.',
        );
      } else if (state === 'active' && permissionDeniedRef.current) {
        permissionDeniedRef.current = false;
        setPermissionDenied(false);
      }
    });

    return () => subscription.remove();
  }, []);

  const totalCents = items.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0,
  );
  const hasUnavailableItems = items.some(
    (item) =>
      item.available === false ||
      (item.stockQuantity !== undefined && item.quantity > item.stockQuantity),
  );

  async function handleUseCurrentLocation() {
    const requestId = ++locationRequestId.current;
    const addressRevisionAtStart = addressRevision.current;
    hasActiveLookup.current = true;
    setLocationLoading(true);
    setLocationRetry(false);
    setLocationNotice(null);

    try {
      const address = await getCurrentAddress();
      if (requestId !== locationRequestId.current || !isFocused.current) return;
      if (addressRevisionAtStart !== addressRevision.current) {
        setLocationNotice(
          'Your address was edited while location was loading, so your changes were kept.',
        );
        return;
      }
      setDeliveryAddress(address);
      setAddressError(null);
      setLocationRetry(false);
      setLocationNotice('Address suggested from your current location. Please verify it.');
    } catch (error) {
      if (requestId !== locationRequestId.current || !isFocused.current) return;
      if (error instanceof LocationLookupError) {
        setLocationNotice(error.message);
        setLocationRetry(
          error.code === 'timeout' || error.code === 'services-disabled',
        );
        if (error.code === 'permission-denied') {
          permissionDeniedRef.current = true;
          setPermissionDenied(true);
        }
      } else {
        setLocationRetry(true);
        setLocationNotice(
          error instanceof Error
            ? error.message
            : 'Couldn’t get your location. Enter your address manually or try again.',
        );
      }
    } finally {
      if (requestId === locationRequestId.current) {
        hasActiveLookup.current = false;
        setLocationLoading(false);
      }
    }
  }

  async function openLocationSettings() {
    try {
      await Linking.openSettings();
    } catch {
      setLocationNotice(
        'Couldn’t open device settings. You can still enter your delivery address manually.',
      );
    }
  }

  async function placeOrder() {
    setSubmitError(null);
    const confirmedAddress = deliveryAddress.trim();
    if (!confirmedAddress) {
      setAddressError('Enter a delivery address to continue.');
      return;
    }
    if (confirmedAddress.length > 500) {
      setAddressError('The delivery address must be 500 characters or fewer.');
      return;
    }
    setAddressError(null);
    try {
      const order = await mutateAsync({
        items: items.map(({ productId, quantity }) => ({ productId, quantity })),
        expectedTotalCents: totalCents,
        deliveryAddress: confirmedAddress,
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
              Review your finds and confirm where you’d like them delivered.
            </Text>

            <View style={styles.addressSection}>
              <Text style={styles.addressLabel}>DELIVERY ADDRESS</Text>
              <Text style={styles.addressHint}>
                Your device can suggest an address, or you can enter one manually.
              </Text>
              <TextInput
                accessibilityLabel="Delivery address"
                multiline
                maxLength={500}
                onChangeText={(value) => {
                  addressRevision.current += 1;
                  setDeliveryAddress(value);
                  if (addressError) setAddressError(null);
                }}
                placeholder="Street, city, region, postal code"
                placeholderTextColor={theme.colors.muted}
                returnKeyType="default"
                style={styles.addressInput}
                textAlignVertical="top"
                value={deliveryAddress}
              />
              {addressError ? <Text style={styles.error}>{addressError}</Text> : null}
              {permissionDenied ? (
                <Button
                  title="Open location settings"
                  variant="secondary"
                  onPress={() => void openLocationSettings()}
                  style={styles.locationButton}
                />
              ) : (
                <Button
                  title={
                    locationLoading
                      ? 'Getting your location…'
                      : locationRetry
                        ? 'Retry location'
                        : 'Use my current location'
                  }
                  variant="secondary"
                  loading={locationLoading}
                  disabled={locationLoading}
                  onPress={() => void handleUseCurrentLocation()}
                  style={styles.locationButton}
                />
              )}
              {locationNotice ? (
                <Text accessibilityLiveRegion="polite" style={styles.locationNotice}>
                  {locationNotice}
                </Text>
              ) : null}
              <Text style={styles.addressDisclaimer}>
                Location is only a suggestion. Check the address before placing your order.
              </Text>
            </View>

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
  addressSection: { marginTop: 26 },
  addressLabel: { color: theme.colors.ink, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  addressHint: { marginTop: 6, color: theme.colors.muted, fontSize: 12, lineHeight: 18 },
  addressInput: {
    minHeight: 96,
    marginTop: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.small,
    backgroundColor: theme.colors.surface,
    color: theme.colors.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  locationButton: { marginTop: 10 },
  locationNotice: { marginTop: 9, color: theme.colors.muted, fontSize: 12, lineHeight: 18 },
  addressDisclaimer: { marginTop: 8, color: theme.colors.muted, fontSize: 11, lineHeight: 16 },
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