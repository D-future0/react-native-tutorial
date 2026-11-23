import * as Location from 'expo-location';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getCurrentAddress,
  LocationLookupError,
} from './location.service';

vi.mock('expo-location', () => ({
  Accuracy: { High: 4 },
  PermissionStatus: {
    DENIED: 'denied',
    GRANTED: 'granted',
    UNDETERMINED: 'undetermined',
  },
  getForegroundPermissionsAsync: vi.fn(),
  getCurrentPositionAsync: vi.fn(),
  hasServicesEnabledAsync: vi.fn(),
  requestForegroundPermissionsAsync: vi.fn(),
  reverseGeocodeAsync: vi.fn(),
}));

const coordinates = { latitude: 37.789, longitude: -122.401 };
const location = {
  coords: {
    ...coordinates,
    altitude: null,
    accuracy: 10,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  timestamp: 1,
} satisfies Location.LocationObject;

const geocodedAddress = {
  city: 'San Francisco',
  country: 'United States',
  district: null,
  formattedAddress: null,
  isoCountryCode: 'US',
  name: null,
  postalCode: '94105',
  region: 'California',
  street: 'Market Street',
  streetNumber: '12',
  subregion: null,
  timezone: null,
} satisfies Location.LocationGeocodedAddress;

function permission(
  status: Location.PermissionStatus,
  canAskAgain: boolean,
): Location.LocationPermissionResponse {
  return {
    status,
    canAskAgain,
    expires: 'never',
    granted: status === Location.PermissionStatus.GRANTED,
  };
}

const servicesEnabled = vi.mocked(Location.hasServicesEnabledAsync);
const getPermission = vi.mocked(Location.getForegroundPermissionsAsync);
const requestPermission = vi.mocked(Location.requestForegroundPermissionsAsync);
const getPosition = vi.mocked(Location.getCurrentPositionAsync);
const reverseGeocode = vi.mocked(Location.reverseGeocodeAsync);

describe('getCurrentAddress', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    servicesEnabled.mockResolvedValue(true);
    getPermission.mockResolvedValue(
      permission(Location.PermissionStatus.GRANTED, true),
    );
    requestPermission.mockResolvedValue(
      permission(Location.PermissionStatus.GRANTED, true),
    );
    getPosition.mockResolvedValue(location);
    reverseGeocode.mockResolvedValue([geocodedAddress]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not request permission again after it has been denied', async () => {
    getPermission.mockResolvedValue(
      permission(Location.PermissionStatus.DENIED, false),
    );

    await expect(getCurrentAddress()).rejects.toMatchObject({
      code: 'permission-denied',
    } satisfies Partial<LocationLookupError>);
    expect(requestPermission).not.toHaveBeenCalled();
    expect(getPosition).not.toHaveBeenCalled();
  });

  it('stops when the user denies the first permission request', async () => {
    getPermission.mockResolvedValue(
      permission(Location.PermissionStatus.UNDETERMINED, true),
    );
    requestPermission.mockResolvedValue(
      permission(Location.PermissionStatus.DENIED, false),
    );

    await expect(getCurrentAddress()).rejects.toBeInstanceOf(
      LocationLookupError,
    );
    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(getPosition).not.toHaveBeenCalled();
  });

  it('reports disabled location services without requesting permission', async () => {
    servicesEnabled.mockResolvedValue(false);

    await expect(getCurrentAddress()).rejects.toMatchObject({
      code: 'services-disabled',
    } satisfies Partial<LocationLookupError>);
    expect(getPermission).not.toHaveBeenCalled();
  });

  it('propagates a GPS failure', async () => {
    getPosition.mockRejectedValue(new Error('GPS unavailable'));

    await expect(getCurrentAddress()).rejects.toThrow('GPS unavailable');
    expect(reverseGeocode).not.toHaveBeenCalled();
  });

  it('times out when the GPS request never resolves', async () => {
    vi.useFakeTimers();
    let positionRequestStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      positionRequestStarted = resolve;
    });
    getPosition.mockImplementation(() => {
      positionRequestStarted();
      return new Promise<Location.LocationObject>(() => {});
    });

    const result = expect(getCurrentAddress()).rejects.toMatchObject({
      code: 'timeout',
    } satisfies Partial<LocationLookupError>);
    await started;
    await vi.advanceTimersByTimeAsync(15_000);
    await result;
  });

  it('retains coordinates when reverse geocoding fails', async () => {
    reverseGeocode.mockRejectedValue(new Error('Geocoder unavailable'));

    await expect(getCurrentAddress()).resolves.toEqual({
      coordinates,
      formattedAddress: null,
      geocodingError: 'reverse-geocoding-failed',
    });
  });

  it('retains coordinates when no address is returned', async () => {
    reverseGeocode.mockResolvedValue([]);

    await expect(getCurrentAddress()).resolves.toEqual({
      coordinates,
      formattedAddress: null,
      geocodingError: 'no-address',
    });
  });

  it('formats the street number and street with the returned coordinates', async () => {
    await expect(getCurrentAddress()).resolves.toEqual({
      coordinates,
      formattedAddress:
        '12 Market Street, San Francisco, California, 94105, United States',
      geocodingError: null,
    });
  });
});
