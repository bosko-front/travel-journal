import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as FileSystem from 'expo-file-system';
import { getCurrentCoords } from '@/lib/location';
import { getWeather, WeatherInfo } from '@/lib/weather';

const TTL_MS = 10 * 60 * 1000; // 10 minutes

// Minimal file-based storage for React Native via Expo FileSystem
const WEATHER_CACHE_FILE = `${FileSystem.documentDirectory}weather-cache.json`;
const fileStorage = {
  getItem: async (_name: string) => {
    try {
      const info = await FileSystem.getInfoAsync(WEATHER_CACHE_FILE);
      if (!info.exists) return null;
      return await FileSystem.readAsStringAsync(WEATHER_CACHE_FILE);
    } catch {
      return null;
    }
  },
  setItem: async (_name: string, value: string) => {
    try {
      await FileSystem.writeAsStringAsync(WEATHER_CACHE_FILE, value);
    } catch {
      // noop
    }
  },
  removeItem: async (_name: string) => {
    try {
      await FileSystem.deleteAsync(WEATHER_CACHE_FILE, { idempotent: true });
    } catch {
      // noop
    }
  },
};

type State = {
  weather: WeatherInfo | null;
  loading: boolean;
  lastFetchedAt: number | null;
  _inited: boolean;
};

type Actions = {
  initIfNeeded: () => Promise<void>;
  refresh: () => Promise<void>;
  setFromCoords: (lat: number, lon: number) => Promise<void>;
  setWeather: (w: WeatherInfo | null) => void;
};

export const useWeatherStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      weather: null,
      loading: false,
      lastFetchedAt: null,
      _inited: false,

      initIfNeeded: async () => {
        if (get()._inited) return; // prevent duplicate init on fast mounts
        set({ _inited: true });
        const { lastFetchedAt, weather } = get();
        const now = Date.now();
        const isFresh = lastFetchedAt != null && now - lastFetchedAt < TTL_MS && !!weather;
        if (isFresh) return; // already have fresh data
        await get().refresh();
      },

      refresh: async () => {
        if (get().loading) return;
        set({ loading: true });
        try {
          const coords = await getCurrentCoords();
          if (!coords) {
            set({ weather: null, lastFetchedAt: Date.now() });
            return;
          }
          const w = await getWeather(coords.lat, coords.lng);
          set({ weather: w, lastFetchedAt: Date.now() });
        } catch (e) {
          // keep previous weather if any; just timestamp to avoid thrash
          set({ lastFetchedAt: Date.now() });
        } finally {
          set({ loading: false });
        }
      },

      setFromCoords: async (lat, lon) => {
        if (get().loading) return; // avoid spamming
        set({ loading: true });
        try {
          const w = await getWeather(lat, lon);
          set({ weather: w, lastFetchedAt: Date.now() });
        } finally {
          set({ loading: false });
        }
      },

      setWeather: (w) => set({ weather: w, lastFetchedAt: Date.now() }),
    }),
    {
      name: 'weather-cache',
      storage: createJSONStorage(() => fileStorage),
      partialize: (state) => ({ weather: state.weather, lastFetchedAt: state.lastFetchedAt }),
    }
  )
);
