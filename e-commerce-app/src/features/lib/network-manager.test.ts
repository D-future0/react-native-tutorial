import { onlineManager } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConnectivityState } from './network-policy';
import { isNetworkOnline } from './network-policy';

const netInfoMocks = vi.hoisted(() => ({
  addEventListener: vi.fn(),
}));

vi.mock('@react-native-community/netinfo', () => ({
  default: {
    addEventListener: netInfoMocks.addEventListener,
  },
}));

const { installNetworkManager } = await import('./network-manager');

describe('isNetworkOnline', () => {
  it.each([
    [{ isConnected: true, isInternetReachable: true }, true],
    [{ isConnected: true, isInternetReachable: null }, true],
    [{ isConnected: true, isInternetReachable: false }, false],
    [{ isConnected: false, isInternetReachable: true }, false],
    [{ isConnected: null, isInternetReachable: null }, false],
  ] as const)(
    'returns %s for the given connectivity state',
    (state, expected) => {
      expect(isNetworkOnline(state)).toBe(expected);
    },
  );
});

describe('installNetworkManager', () => {
  let connectivityListener:
    | ((state: ConnectivityState) => void)
    | undefined;

  beforeEach(() => {
    connectivityListener = undefined;
    onlineManager.setOnline(true);
    netInfoMocks.addEventListener.mockImplementation(
      (listener: (state: ConnectivityState) => void) => {
        connectivityListener = listener;
        return vi.fn();
      },
    );
  });

  afterEach(() => {
    onlineManager.setEventListener(() => () => undefined);
  });

  it('updates TanStack Query when NetInfo reports connectivity changes', () => {
    installNetworkManager();

    expect(onlineManager.isOnline()).toBe(false);
    expect(netInfoMocks.addEventListener).toHaveBeenCalledOnce();

    connectivityListener?.({
      isConnected: true,
      isInternetReachable: true,
    });
    expect(onlineManager.isOnline()).toBe(true);

    connectivityListener?.({
      isConnected: true,
      isInternetReachable: false,
    });
    expect(onlineManager.isOnline()).toBe(false);
  });
});
