import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { isNetworkOnline } from './network-policy';

export { isNetworkOnline } from './network-policy';

export function installNetworkManager(): void {
  onlineManager.setOnline(false);
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => setOnline(isNetworkOnline(state))),
  );
}

export function useNetworkOnline(): boolean {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
    () => true,
  );
}