# Morrow Store

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
port. The current development address is `http://192.168.100.67:3000`; replace
the IP if the computer's network address changes. Keep the computer and phone
on the same network so the app can reach the backend. Restart Expo after
changing `.env` so the URL is included in the app bundle.

Start the backend and apply its Prisma migrations before using the app. The
backend must be listening on the network interface and reachable from the
device running Expo. For Expo Web opened from a different host address, add
that app origin (for example, `http://192.168.100.67:8081`) to the backend's
`CORS_ORIGINS` setting.

## App features

- Discover, search, and filter products, with individual product details.
- Persist a shopping bag on the device.
- Submit and review demo orders; checkout does not process payments.
- Register and sign in with the backend. Access tokens use SecureStore on
  Android/iOS and browser storage on web.

Available commands:

```bash
npm run start
npm run android
npm run ios
npm run web
npx tsc --noEmit
```
