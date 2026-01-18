<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# RoomieWallet (Offline-first)

This contains everything you need to run your app locally.

This is an offline-first roommate expense & settlement tracker.

## ✅ Offline / Local Storage

- All app data is stored locally in your browser/device using `localStorage`.
- The app works offline via a Service Worker (PWA). Once you open the app once, it can load without internet.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Build & Preview (production-like testing)

1. `npm run build`
2. `npm run preview`

Open the preview URL and then switch your browser to **Offline mode** (DevTools → Network → Offline).

## Monthly Auto-Archive Rules

On every **1st day of a new month**, the app attempts to archive the previous month:

- ✅ If all previous month settlements are settled → archives automatically
- ❌ If there are unsettled settlements →
  - archiving is blocked
  - adding new items is blocked
  - popup shows: **"Settle previous month settlements first"**

Once the user settles all debts, the archive happens automatically.

## Developer Mode: Test Archive Logic (locally)

Because waiting for the real 1st day is inconvenient, you can simulate it locally.

Open DevTools Console and set:

```js
// 1) Simulate the current date/time
localStorage.setItem('rw_dev_date', new Date('2026-02-01T00:05:00.000Z').toISOString());

// 2) Force "today is 1st" even if your real date isn't
localStorage.setItem('rw_dev_force_first', '1');

// Reload
location.reload();
```

To disable dev mode:

```js
localStorage.removeItem('rw_dev_date');
localStorage.removeItem('rw_dev_force_first');
location.reload();
```
