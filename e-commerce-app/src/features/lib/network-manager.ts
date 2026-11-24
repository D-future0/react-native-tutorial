import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

interface ConnectivityState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}

export function isNetworkOnline(state: ConnectivityState): boolean {
  return (
    state.isConnected === true &&
    state.isInternetReachable !== false
  );
}

export function installNetworkManager(): void {
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => setOnline(isNetworkOnline(state))),
  );
}