import * as Location from 'expo-location';

export type LocationLookupErrorCode =
  | 'permission-denied'
  | 'services-disabled'
  | 'timeout'
  | 'no-address';

export class LocationLookupError extends Error {
  constructor(
    readonly code: LocationLookupErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'LocationLookupError';
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(
          new LocationLookupError(
            'timeout',
            "We couldn’t get your location in time. Check your signal and try again.",
          ),
        ),
      timeoutMs,
    );

    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

export async function getCurrentAddress(): Promise<string> {
  if (!(await Location.hasServicesEnabledAsync())) {
    throw new LocationLookupError(
      'services-disabled',
      "Location services are off. Enable them in your device settings, or enter your address manually.",
    );
  }

  const permission =
    await Location.getForegroundPermissionsAsync();

  let permissionStatus = permission.status;
  if (permissionStatus === 'undetermined' && permission.canAskAgain) {
    const requestedPermission =
      await Location.requestForegroundPermissionsAsync();
    permissionStatus = requestedPermission.status;
  }

  if (permissionStatus !== 'granted') {
    throw new LocationLookupError(
      'permission-denied',
      "Location permission wasn’t granted. Enter your delivery address manually, or enable location access in device settings.",
    );
  }

  const location = await withTimeout(
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    }),
    15_000,
  );

  const addresses = await Location.reverseGeocodeAsync({
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  });

  if (!addresses.length) {
    throw new LocationLookupError(
      'no-address',
      "We couldn’t find a street address for this location. Enter it manually.",
    );
  }

  const address = addresses[0];
  const streetLine =
    [address.streetNumber, address.street]
      .filter((part): part is string => Boolean(part?.trim()))
      .join(' ') || address.name?.trim();

  if (!streetLine) {
    throw new LocationLookupError(
      'no-address',
      "We couldn’t find a street address for this location. Enter it manually.",
    );
  }

  return [
    streetLine,
    address.district,
    address.subregion,
    address.city,
    address.region,
    address.postalCode,
    address.country,
  ]
    .filter((part): part is string => Boolean(part?.trim()))
    .filter(
      (part, index, parts) =>
        parts.findIndex(
          (other) => other.toLocaleLowerCase() === part.toLocaleLowerCase(),
        ) === index,
    )
    .join(', ');
}