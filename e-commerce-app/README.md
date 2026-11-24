# Shoppi Store

Expo frontend for the e-commerce backend. Browse the catalog, search products,
manage a locally saved bag, place demo orders, and create or sign in to an
account.

## Run locally

Install dependencies and configure the backend URL:

```bash
npm install
cp .env.example .env
npm run start
```

Set `EXPO_PUBLIC_API_URL` in `.env` to the backend's system LAN address and
port. The current development address is `http://172.20.10.13:3000`; replace
the IP if the computer's network address changes. Keep the computer and phone
on the same network so the app can reach the backend. Restart Expo after
changing `.env` so the URL is included in the app bundle.

Start the backend and apply its Prisma migrations before using the app. The
backend must be listening on the network interface and reachable from the
device running Expo. For Expo Web opened from a different host address, add
that app origin (for example, `http://172.20.10.13:8081`) to the backend's
`CORS_ORIGINS` setting.

## App features

- Discover, search, and filter products, with individual product details.
- Persist a shopping bag on the device and refresh prices and stock in the
  background.
- Submit orders with server-validated prices and inventory; checkout does not
  process payments.
- Enter a delivery address manually or explicitly request a device location
  suggestion. The app does not store or send coordinates, and location
  suggestions should be checked before submitting the server-validated address.
- View only orders associated with the signed-in account.
- Register and sign in with the backend. The access/refresh token pair is stored
  as one SecureStore record on Android/iOS and restored and refreshed on startup.
  Browsers use a single AsyncStorage record because Expo SecureStore is not
  available on web; browser storage is not equivalent to native secure storage.

Available commands:

```bash
npm run start
npm run android
npm run ios
npm run web
npm test
npx tsc --noEmit
```
