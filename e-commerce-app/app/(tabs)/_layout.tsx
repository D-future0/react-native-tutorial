import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useCartStore } from '../../src/features/cart/store';
import { theme } from '../../src/theme';

const tabSymbols: Record<string, string> = {
  index: '⌂',
  cart: '▢',
  profile: '○',
};

export default function TabLayout() {
  const cartCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 3 },
        tabBarStyle: {
          height: 66,
          paddingTop: 7,
          borderTopColor: theme.colors.line,
          backgroundColor: theme.colors.surface,
        },
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: 22, lineHeight: 25 }}>
            {tabSymbols[route.name]}
          </Text>
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Discover' }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Bag',
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: { backgroundColor: theme.colors.accent, color: theme.colors.ink },
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Account' }} />
    </Tabs>
  );
}
