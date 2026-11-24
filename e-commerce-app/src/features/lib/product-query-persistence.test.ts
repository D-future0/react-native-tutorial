import { QueryClient } from '@tanstack/react-query';
import {
  persistQueryClientRestore,
  persistQueryClientSave,
} from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { describe, expect, it } from 'vitest';
import {
  isPersistableProductQuery,
  PRODUCT_QUERY_CACHE_KEY,
  PRODUCT_QUERY_CACHE_MAX_AGE,
} from './product-query-persistence';

describe('persisted product queries', () => {
  it('only persists successful product data and restores it into a new client', async () => {
    const records = new Map<string, string>();
    const persister = createAsyncStoragePersister({
      storage: {
        getItem: async (key) => records.get(key) ?? null,
        setItem: async (key, value) => {
          records.set(key, value);
        },
        removeItem: async (key) => {
          records.delete(key);
        },
      },
      key: PRODUCT_QUERY_CACHE_KEY,
      throttleTime: 0,
    });
    const firstClient = new QueryClient();
    firstClient.setQueryData(['products'], [{ id: 'product-1' }]);
    firstClient.setQueryData(['products', 'product-1'], { id: 'product-1' });
    firstClient.setQueryData(['cart-products'], [{ id: 'product-1' }]);
    firstClient.setQueryData(['orders'], [{ id: 'private-order' }]);

    await persistQueryClientSave({
      queryClient: firstClient,
      persister,
      buster: PRODUCT_QUERY_CACHE_KEY,
      dehydrateOptions: {
        shouldDehydrateQuery: (query) =>
          isPersistableProductQuery(
            query.queryKey,
            query.state.data !== undefined,
          ),
      },
    });

    const restoredClient = new QueryClient();
    await persistQueryClientRestore({
      queryClient: restoredClient,
      persister,
      buster: PRODUCT_QUERY_CACHE_KEY,
      maxAge: PRODUCT_QUERY_CACHE_MAX_AGE,
    });

    expect(restoredClient.getQueryData(['products'])).toEqual([
      { id: 'product-1' },
    ]);
    expect(
      restoredClient.getQueryData(['products', 'product-1']),
    ).toEqual({ id: 'product-1' });
    expect(restoredClient.getQueryData(['cart-products'])).toEqual([
      { id: 'product-1' },
    ]);
    expect(restoredClient.getQueryData(['orders'])).toBeUndefined();
  });

  it('excludes non-product and data-less queries from persistence', () => {
    expect(isPersistableProductQuery(['products'], true)).toBe(true);
    expect(isPersistableProductQuery(['cart-products'], true)).toBe(true);
    expect(isPersistableProductQuery(['orders'], true)).toBe(false);
    expect(isPersistableProductQuery(['products'], false)).toBe(false);
  });
});
