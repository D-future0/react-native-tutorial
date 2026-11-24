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
- Restore public product and cart-product query data from AsyncStorage for up to
  seven days. Cached details remain visible offline with a stale/offline notice;
  authentication and order queries are not persisted.
- The bag remains local and persistent, but checkout is online-only. Orders are
  not queued or automatically retried; reconnect and explicitly submit after
  reviewing current prices and stock. Stock conflicts refresh the saved bag
  data before another attempt.
- Before production deployment, implement server-side order idempotency keys
  and an order-status recovery flow so interrupted submissions can be
  reconciled safely before retrying.
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

## Offline release checks

- Load the catalog while online, terminate and relaunch the app in airplane
  mode, and verify saved products, product details, and the bag are visible with
  offline/stale notices.
- Reconnect and verify the catalog and bag refresh. Test a removed product and
  a stock reduction; removed or unavailable items must not be orderable.
- Attempt checkout offline and verify it is disabled and no order is submitted
  or queued. Reconnect, review refreshed prices and quantities, then submit.
- Double-tap checkout and verify only one request is sent. If a network failure
  occurs after submission, verify the server order before manually retrying:
  the online-only flow does not persist offline orders or provide server-side
  idempotency for ambiguous responses.
- Treat server-side idempotency keys and order-status recovery as production
  requirements before enabling customer checkout.
