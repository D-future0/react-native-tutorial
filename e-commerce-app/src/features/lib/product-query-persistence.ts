export const PRODUCT_QUERY_CACHE_KEY = 'shoppi-product-query-cache-v1';
export const PRODUCT_QUERY_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export function isPersistableProductQuery(
  queryKey: readonly unknown[],
  hasData: boolean,
): boolean {
  return (
    hasData &&
    (queryKey[0] === 'products' || queryKey[0] === 'cart-products')
  );
}
