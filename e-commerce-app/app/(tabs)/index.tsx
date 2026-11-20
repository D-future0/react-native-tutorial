import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ErrorState from '../../src/components/ErrorState';
import LoadingState from '../../src/components/LoadingState';
import ProductCard from '../../src/components/ProductCard';
import { useCartStore } from '../../src/features/cart/store';
import { useProducts } from '../../src/features/products/hooks';
import type { Product } from '../../src/features/types';
import { theme } from '../../src/theme';

const categories = ['All finds', 'Tech', 'Home', 'Style'] as const;
type Category = (typeof categories)[number];

function getCategory(product: Product): Exclude<Category, 'All finds'> {
  const name = product.name.toLowerCase();
  if (/shoe|sunglass|suitcase|backpack|yoga|fitness/.test(name)) {
    return 'Style';
  }
  if (/coffee|lamp|kettle|chair/.test(name)) {
    return 'Home';
  }
  return 'Tech';
}

export default function DiscoverScreen() {
  const {
    data: products,
    isLoading,
    isError,
    isRefetchError,
    error,
    refetch,
  } = useProducts();
  const addItem = useCartStore((state) => state.addItem);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('All finds');

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return (products ?? []).filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        `${product.name} ${product.description ?? ''}`
          .toLowerCase()
          .includes(normalizedSearch);
      return (
        matchesSearch &&
        (category === 'All finds' || getCategory(product) === category)
      );
    });
  }, [category, products, search]);

  if (isLoading && !products) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <LoadingState label="Finding the good stuff…" />
      </SafeAreaView>
    );
  }

  if (isError && !products) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ErrorState
          message={error instanceof Error ? error.message : 'Products could not be loaded.'}
          onRetry={() => void refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() =>
              router.push({ pathname: '/products/[id]', params: { id: item.id } })
            }
            onAdd={() => addItem(item)}
          />
        )}
        ListHeaderComponent={
          <View>
            {isRefetchError ? (
              <View style={styles.refreshWarning}>
                <Text style={styles.refreshText}>
                  Couldn’t refresh the collection. Showing the last loaded products.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void refetch()}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            <View style={styles.topBar}>
              <View>
                <Text style={styles.eyebrow}>THE GOOD STUFF</Text>
                <Text style={styles.brand}>Shoppi<Text style={styles.brandDot}>.</Text></Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(tabs)/cart')}
                style={styles.bagButton}
              >
                <Text style={styles.bagGlyph}>▢</Text>
              </Pressable>
            </View>

            <View style={styles.hero}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>CURATED FOR EVERYDAY</Text>
              </View>
              <Text style={styles.heroTitle}>A little more{'\n'}thoughtful.</Text>
              <Text style={styles.heroCopy}>
                Useful things, good-looking things, things you’ll keep.
              </Text>
              <View style={styles.heroFoot}>
                <Text style={styles.heroFootText}>Shop quality, not quantity</Text>
                <Text style={styles.heroArrow}>↘</Text>
              </View>
            </View>

            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                accessibilityLabel="Search products"
                value={search}
                onChangeText={setSearch}
                placeholder="Search something lovely"
                placeholderTextColor={theme.colors.muted}
                style={styles.searchInput}
                returnKeyType="search"
                autoCorrect={false}
              />
              {search.length > 0 ? (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <Text style={styles.clearSearch}>×</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.eyebrow}>THE COLLECTION</Text>
                <Text style={styles.sectionTitle}>Shop the edit</Text>
              </View>
              <Text style={styles.resultCount}>{filteredProducts.length} finds</Text>
            </View>

            <View style={styles.categories}>
              {categories.map((item) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: category === item }}
                  key={item}
                  onPress={() => setCategory(item)}
                  style={[
                    styles.categoryChip,
                    category === item && styles.categoryChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === item && styles.categoryTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyMark}>⌕</Text>
            <Text style={styles.emptyTitle}>No finds just yet</Text>
            <Text style={styles.emptyCopy}>Try another search or choose a different edit.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  listContent: { paddingHorizontal: 18, paddingBottom: 28 },
  topBar: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: theme.colors.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  brand: { marginTop: 1, color: theme.colors.ink, fontSize: 29, fontWeight: '800', letterSpacing: -1.5 },
  brandDot: { color: theme.colors.accent },
  bagButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bagGlyph: { color: theme.colors.ink, fontSize: 21 },
  hero: {
    overflow: 'hidden',
    minHeight: 222,
    padding: 22,
    borderRadius: theme.radius.large,
    backgroundColor: theme.colors.primary,
    justifyContent: 'space-between',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroBadgeText: { color: '#E8ECDD', fontSize: 9, fontWeight: '700', letterSpacing: 1.1 },
  heroTitle: { marginTop: 15, color: '#FFFFFF', fontSize: 34, fontWeight: '700', lineHeight: 37, letterSpacing: -1 },
  heroCopy: { maxWidth: 250, marginTop: 7, color: '#E0E9DF', fontSize: 13, lineHeight: 19 },
  heroFoot: { marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroFootText: { color: '#E0E9DF', fontSize: 11, fontWeight: '600' },
  heroArrow: { color: '#FFFFFF', fontSize: 22 },
  searchBox: {
    minHeight: 52,
    marginTop: 18,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
  },
  searchIcon: { marginRight: 9, color: theme.colors.primary, fontSize: 24 },
  searchInput: { flex: 1, paddingVertical: 12, color: theme.colors.ink, fontSize: 14 },
  clearSearch: { paddingHorizontal: 6, color: theme.colors.muted, fontSize: 22 },
  sectionHeading: {
    marginTop: 26,
    marginBottom: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionTitle: { marginTop: 4, color: theme.colors.ink, fontSize: 23, fontWeight: '700', letterSpacing: -0.5 },
  resultCount: { paddingBottom: 3, color: theme.colors.muted, fontSize: 12 },
  categories: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceMuted,
  },
  categoryChipSelected: { backgroundColor: theme.colors.ink },
  categoryText: { color: theme.colors.muted, fontSize: 12, fontWeight: '600' },
  categoryTextSelected: { color: '#FFFFFF' },
  gridRow: { gap: 12, marginBottom: 12 },
  empty: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 48 },
  emptyMark: { color: theme.colors.primary, fontSize: 30 },
  emptyTitle: { marginTop: 8, color: theme.colors.ink, fontSize: 17, fontWeight: '700' },
  emptyCopy: { marginTop: 5, color: theme.colors.muted, fontSize: 13, textAlign: 'center' },
  refreshWarning: {
    marginBottom: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: theme.radius.small,
    backgroundColor: '#EFEEE7',
  },
  refreshText: { flex: 1, color: theme.colors.muted, fontSize: 12, lineHeight: 18 },
  retryText: { color: theme.colors.primary, fontSize: 12, fontWeight: '700' },
});