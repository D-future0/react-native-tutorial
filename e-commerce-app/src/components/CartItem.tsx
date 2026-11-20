import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CartLine } from '../features/types';
import { formatPrice, theme } from '../theme';
import ProductImage from './ProductImage';

interface CartItemProps {
  item: CartLine;
  onChangeQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export default function CartItem({
  item,
  onChangeQuantity,
  onRemove,
}: CartItemProps) {
  return (
    <View style={styles.container}>
      <ProductImage
        imageUrl={item.imageUrl}
        name={item.name}
        style={styles.image}
      />
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.price}>{formatPrice(item.priceCents)}</Text>
        {item.available === false ? (
          <Text style={styles.unavailable}>Out of stock</Text>
        ) : item.stockQuantity !== undefined &&
          item.quantity > item.stockQuantity ? (
          <Text style={styles.unavailable}>
            Only {item.stockQuantity} available; reduce quantity
          </Text>
        ) : null}
        <View style={styles.bottomRow}>
          <View style={styles.quantity}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove one ${item.name}`}
              onPress={() => onChangeQuantity(item.quantity - 1)}
              style={styles.quantityButton}
            >
              <Text style={styles.quantityLabel}>−</Text>
            </Pressable>
            <Text style={styles.quantityValue}>{item.quantity}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Add one ${item.name}`}
              onPress={() => onChangeQuantity(item.quantity + 1)}
              disabled={
                item.available === false ||
                (item.stockQuantity !== undefined &&
                  item.quantity >= item.stockQuantity)
              }
              style={styles.quantityButton}
            >
              <Text style={styles.quantityLabel}>+</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${item.name} from cart`}
            onPress={onRemove}
            hitSlop={8}
          >
            <Text style={styles.remove}>Remove</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 14,
    padding: 12,
    borderRadius: theme.radius.medium,
    backgroundColor: theme.colors.surface,
  },
  image: { width: 92, height: 104, borderRadius: theme.radius.small },
  details: { flex: 1, justifyContent: 'space-between', paddingVertical: 2 },
  name: { color: theme.colors.ink, fontSize: 15, fontWeight: '700' },
  price: { color: theme.colors.primary, fontSize: 15, fontWeight: '700' },
  unavailable: { color: theme.colors.danger, fontSize: 12, fontWeight: '600' },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityLabel: { color: theme.colors.ink, fontSize: 18, fontWeight: '600' },
  quantityValue: { minWidth: 14, color: theme.colors.ink, textAlign: 'center' },
  remove: { color: theme.colors.muted, fontSize: 12, fontWeight: '600' },
});
