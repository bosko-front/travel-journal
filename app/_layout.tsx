import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { initDb } from '@/db/ index';
import {GestureHandlerRootView} from "react-native-gesture-handler";

export default function RootLayout() {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        (async () => { await initDb(); setReady(true); })();
    }, []);
    if (!ready) return null;
    return <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />

    </GestureHandlerRootView>
}
