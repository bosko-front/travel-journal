# Travel Journal

A modern, mobile-first travel diary built with Expo + React Native. Capture moments with photos, write notes, and tag entries with real locations — all stored locally on device using SQLite. Designed with smooth interactions (swipe-to-delete, gradients, animations) and a clean, accessible UI.


## Highlights

- Fast local-first experience (SQLite via `expo-sqlite`)
- Add photos from camera or gallery (Image Picker + Camera)
- One-tap "Use my location" with reverse geocoding (city/place + country flag emoji)
- Friendly editing flow: create entries, add/remove photos, edit notes
- Swipeable list items with delete action (Reanimated + Gesture Handler)
- Debounced search across title, notes and place fields
- Live weather backdrop driven by your current location (OpenWeatherMap) with animated gradients
- On-device voice transcription for notes (Whisper Tiny via Executorch) — no audio leaves the device; one‑time model download (~75–100MB)
- Expo Router for clean, file-based navigation
- Consistent look & feel with scaling utilities and safe area handling


## Screens

- Home: list of entries with search, swipe-to-delete, and weather-driven visuals
- New Entry: title, date picker, note, add photos (camera/gallery), use current location, optional voice notes
- Entry Details: full entry view, photo grid, add/remove photos, edit note


## Tech Stack

- React Native 0.79, React 19, Expo SDK 53
- Navigation: `expo-router`
- Database: `expo-sqlite`
- Media: `expo-image-picker`, `expo-camera`, `expo-file-system`
- Audio + STT: `react-native-audio-api`, `react-native-executorch` (Whisper Tiny EN), `expo-haptics`
- Location + Weather: `expo-location`, OpenWeatherMap API
- UI/UX: `react-native-gesture-handler`, `react-native-reanimated`, `react-native-safe-area-context`, `expo-linear-gradient`
- State: `zustand`
- TypeScript


## Architecture at a Glance

- app/ — file-based routes (Expo Router)
  - index.tsx — home list with search, swipe-to-delete, FAB, weather visuals
  - entry/new.tsx — create form (photos, date picker, location, voice notes)
  - entry/[id].tsx — entry details (photos grid, edit note)
- db/index.ts — SQLite schema + queries (entries, photos, migrations)
- stores/entryStore.ts — Zustand store for list refresh, create, delete
- stores/weatherStore.ts — weather caching, TTL, and initialization
- lib/weather.ts — OpenWeatherMap integration
- lib/location.ts — permissions, get coords, reverse geocode, distance, flag emoji
- components/aiAudioTranscribe.tsx — on-device Whisper transcription UI/logic
- components/EntryCard.tsx — list item UI
- utils/scaling.ts — responsive sizing helpers


## Getting Started

Prerequisites
- Node.js 18+
- npm or yarn
- Xcode (for iOS) and/or Android Studio (for Android)
- Expo CLI (installed via `npx` commands)

Install
```bash
npm install
```

Configure environment
- Create an OpenWeatherMap account and get an API key
- Expose it to Expo as an env variable (e.g. in your shell or `.env`):
  - `EXPO_PUBLIC_WEATHER_API_KEY=YOUR_KEY_HERE`

Run (local dev)
```bash
# Start the development server
npx expo start

# Or run platforms directly
npm run ios     # iOS simulator (requires Xcode)
npm run android # Android emulator (requires Android Studio)
npm run web     # Web (experimental)
```

First run tips
- On iOS Simulator, press Cmd+D to open the dev menu; on Android, Cmd+M or Ctrl+M.
- If you plan to test Camera/Location/Microphone and on-device transcription, prefer a real device. The first time you enable voice notes, a ~75–100MB model will be downloaded and stored on-device.


## Permissions

This app requests:
- Camera (capture photos)
- Media Library / Photos (pick from gallery)
- Location (get current coordinates for entries and to fetch local weather)
- Microphone (record audio for on-device speech-to-text)

On first use of these features, the system will prompt you. If you deny, you can continue without those features (e.g., save an entry without photos, location, or voice notes).


## Data Model (SQLite)

Tables
- entries: id, title, note, date_iso, lat, lng, place_name, locality, country_code, created_at, updated_at
- photos: id, entry_id, uri, created_at

Notes
- Migrations are best-effort and idempotent; foreign keys are enforced; deleting an entry cascades to its photos.
- Search matches title, note, place_name, and locality.


## How It Works

- Creating an entry triggers a SQLite transaction that inserts the entry and its photos.
- The home list subscribes to a Zustand store; after mutations, the store refreshes the list from SQLite.
- Swipeable rows are powered by Reanimated/Gesture Handler; destructive actions confirm via native Alerts.
- Location is obtained with `expo-location` and reverse geocoded into a PrettyAddress shown with a country flag emoji.
- Weather is fetched from OpenWeatherMap using your current coordinates and cached locally for ~10 minutes.
- Voice notes are transcribed on-device using Executorch + Whisper Tiny; no audio is uploaded.


## Development Notes

- Internationalization: current UI strings are in Serbian (e.g., labels and alerts). Adjust as needed.
- Date handling: stored as `YYYY-MM-DD` (date_iso) and displayed using locale formatting.
- Styling: Tailored with StyleSheet and a small scaling util for consistent sizing across devices.
- Web: Project can start on web but camera/location/microphone features are limited in browsers.


## Roadmap Ideas

- Map view of entries and distance calculations between trips
- Share/export entries (e.g., PDF or Markdown)
- Theming (dark mode)
- iCloud/Drive/Google Photos sync backup
- Tags and advanced filters


## Running Lint
```bash
npm run lint
```


## License

This project is for portfolio and educational purposes. If you’d like to use or contribute, feel free to open an issue or PR.
