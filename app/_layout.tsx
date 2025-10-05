import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { initDb } from '@/db/ index';
import {GestureHandlerRootView} from "react-native-gesture-handler";
import { useWeatherStore } from '@/stores/weatherStore';

export default function RootLayout() {
    const [ready, setReady] = useState(false);
    const initWeather = useWeatherStore(s => s.initIfNeeded);

    useEffect(() => {
        (async () => {
            await initDb();
            setReady(true);
            // Kick off weather fetch once at app start
            initWeather();
        })();
    }, [initWeather]);

    if (!ready) return null;
    return <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
}
