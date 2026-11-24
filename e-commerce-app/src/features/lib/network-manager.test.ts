import { describe, expect, it } from 'vitest';
import { isNetworkOnline } from './network-manager';

describe('isNetworkOnline', () => {
  it.each([
    [{ isConnected: true, isInternetReachable: true }, true],
    [{ isConnected: true, isInternetReachable: null }, true],
    [{ isConnected: true, isInternetReachable: false }, false],
    [{ isConnected: false, isInternetReachable: true }, false],
    [{ isConnected: null, isInternetReachable: null }, false],
  ] as const)('returns %s for the given connectivity state', (state, expected) => {
    expect(isNetworkOnline(state)).toBe(expected);
  });
});
