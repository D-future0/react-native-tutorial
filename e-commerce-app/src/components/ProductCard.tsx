import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Product } from '../features/types';
import { useAddedFeedback } from '../features/cart/use-added-feedback';
import { formatPrice, theme } from '../theme';
import Button from './Button';
import ProductImage from './ProductImage';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAdd: () => void;
}

export default function ProductCard({
  product,
  onPress,
  onAdd,
}: ProductCardProps) {
  const { isAdded, showAdded } = useAddedFeedback();

  function handleAdd() {
    onAdd();
    showAdded();
  }

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${product.name}`}
        onPress={onPress}
      >
        <ProductImage
          imageUrl={product.imageUrl}
          name={product.name}
          style={styles.image}
        />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {product.description ?? 'A thoughtful find for everyday living.'}
          </Text>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
        </View>
      </Pressable>
      <Button
        title={isAdded ? 'Added to bag ✓' : 'Add to bag'}
        variant={isAdded ? 'primary' : 'secondary'}
        accessibilityLabel={
          isAdded ? `${product.name} added to bag` : `Add ${product.name} to bag`
        }
        accessibilityLiveRegion="polite"
        onPress={handleAdd}
        style={styles.addButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 9,
    borderRadius: theme.radius.medium,
    backgroundColor: theme.colors.surface,
  },
  image: {
    width: '100%',
    height: 158,
    borderRadius: theme.radius.small,
  },
  info: { paddingHorizontal: 3, paddingTop: 12, gap: 5 },
  name: { color: theme.colors.ink, fontSize: 14, fontWeight: '700' },
  description: {
    minHeight: 34,
    color: theme.colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  price: { color: theme.colors.primary, fontSize: 15, fontWeight: '800' },
  addButton: { minHeight: 40, marginTop: 10 },
});