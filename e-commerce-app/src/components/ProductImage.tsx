import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { theme } from '../theme';

interface ProductImageProps {
  imageUrl: string;
  name: string;
  style?: StyleProp<ViewStyle>;
}

export default function ProductImage({
  imageUrl,
  name,
  style,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  return (
    <View style={[styles.frame, style]}>
      {imageUrl && !failed ? (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setFailed(true)}
          accessibilityLabel={name}
        />
      ) : (
        <View
          style={styles.fallback}
          accessibilityLabel={`${name} default image`}
          accessible
        >
          <View style={styles.artwork}>
            <View style={styles.artworkSun} />
            <View style={styles.artworkShapeBack} />
            <View style={styles.artworkShapeFront} />
            <Text style={styles.artworkMark}>M.</Text>
          </View>
          <Text style={styles.fallbackLabel}>MORROW · GOOD FINDS</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8E9DF',
  },
  artwork: {
    width: '66%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkSun: {
    position: 'absolute',
    top: '8%',
    right: '10%',
    width: '36%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: '#D9A46C',
  },
  artworkShapeBack: {
    position: 'absolute',
    bottom: '13%',
    left: '12%',
    width: '62%',
    height: '48%',
    borderTopLeftRadius: 70,
    borderTopRightRadius: 70,
    backgroundColor: '#B8C6AE',
    transform: [{ rotate: '-12deg' }],
  },
  artworkShapeFront: {
    position: 'absolute',
    right: '9%',
    bottom: '8%',
    width: '54%',
    height: '34%',
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    backgroundColor: theme.colors.primary,
    transform: [{ rotate: '10deg' }],
  },
  artworkMark: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '700',
    letterSpacing: -1,
  },
  fallbackLabel: {
    position: 'absolute',
    bottom: 10,
    color: theme.colors.primary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
});
