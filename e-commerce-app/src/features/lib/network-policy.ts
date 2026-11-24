export interface ConnectivityState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}

export function isNetworkOnline(state: ConnectivityState): boolean {
  return state.isConnected === true && state.isInternetReachable !== false;
}
