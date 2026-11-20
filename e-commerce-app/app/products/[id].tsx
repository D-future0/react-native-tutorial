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
import ErrorState from '../../src/components/ErrorState';
import LoadingState from '../../src/components/LoadingState';
import ProductImage from '../../src/components/ProductImage';
import { useCartStore } from '../../src/features/cart/store';
import { useAddedFeedback } from '../../src/features/cart/use-added-feedback';
import { useProduct } from '../../src/features/products/hooks';
import type { Product } from '../../src/features/types';
import { formatPrice, theme } from '../../src/theme';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Array.isArray(id) ? id[0] : id;
  const { data: product, isLoading, isError, error, refetch } = useProduct(productId ?? '');
  const addItem = useCartStore((state) => state.addItem);
  const { isAdded, showAdded } = useAddedFeedback();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState label="Opening this find…" />
      </SafeAreaView>
    );
  }

  if (isError || !product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.backRow}>
          <Pressable onPress={() => router.back()} accessibilityRole="button">
            <Text style={styles.backText}>‹  Back</Text>
          </Pressable>
        </View>
        <ErrorState
          message={error instanceof Error ? error.message : 'This product could not be found.'}
          onRetry={() => void refetch()}
        />
      </SafeAreaView>
    );
  }

  function handleAdd(productToAdd: Product) {
    addItem(productToAdd);
    showAdded();
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.backRow}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.backText}>‹  Back to shop</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/cart')}
          style={styles.bagButton}
        >
          <Text style={styles.bagText}>▢</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <ProductImage
          imageUrl={product.imageUrl}
          name={product.name}
          style={styles.image}
        />
        <Text style={styles.eyebrow}>THE GOOD STUFF</Text>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
        </View>
        <Text style={styles.description}>
          {product.description ?? 'Thoughtfully chosen for everyday use and made to be kept.'}
        </Text>
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>Good things, considered</Text>
          <Text style={styles.detailCopy}>
            A practical, considered pick from our everyday collection. Add it to
            your bag whenever you’re ready.
          </Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title={isAdded ? 'Added to bag ✓' : 'Add to bag'}
          accessibilityLabel={
            isAdded ? `${product.name} added to bag` : `Add ${product.name} to bag`
          }
          accessibilityLiveRegion="polite"
          onPress={() => handleAdd(product)}
          style={styles.addButton}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/cart')}
          style={styles.viewBag}
        >
          <Text style={styles.viewBagText}>View bag</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  backRow: {
    minHeight: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backText: { color: theme.colors.ink, fontSize: 14, fontWeight: '600' },
  bagButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bagText: { color: theme.colors.ink, fontSize: 20 },
  content: { paddingHorizontal: 20, paddingBottom: 22 },
  image: {
    width: '100%',
    height: 350,
    borderRadius: theme.radius.large,
    marginBottom: 24,
  },
  eyebrow: { color: theme.colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  titleRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: { flex: 1, color: theme.colors.ink, fontSize: 27, fontWeight: '700', letterSpacing: -0.8 },
  price: { paddingTop: 5, color: theme.colors.primary, fontSize: 18, fontWeight: '800' },
  description: { marginTop: 14, color: theme.colors.muted, fontSize: 15, lineHeight: 23 },
  detailCard: {
    marginTop: 22,
    padding: 18,
    borderRadius: theme.radius.medium,
    backgroundColor: theme.colors.surfaceMuted,
  },
  detailTitle: { color: theme.colors.ink, fontSize: 14, fontWeight: '700' },
  detailCopy: { marginTop: 7, color: theme.colors.muted, fontSize: 13, lineHeight: 20 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.line,
    backgroundColor: theme.colors.background,
  },
  addButton: { flex: 1 },
  viewBag: { paddingHorizontal: 7, paddingVertical: 12 },
  viewBagText: { color: theme.colors.primary, fontSize: 13, fontWeight: '700' },
});