import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export async function pickImages(max = 10): Promise<string[]> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return [];
    const res = await ImagePicker.launchImageLibraryAsync({
        quality: 0.85,
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: max,
    });
    if (res.canceled || !res.assets?.length) return [];
    const out: string[] = [];
    for (const a of res.assets) {
        const saved = await saveToAppDir(a.uri);
        out.push(saved);
    }
    return out;
}

export async function takePhoto(): Promise<string | null> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return null;
    const res = await ImagePicker.launchCameraAsync({ quality: 0.85,  mediaTypes: ['images'] });
    if (res.canceled || !res.assets?.length) return null;
    return saveToAppDir(res.assets[0].uri);
}

async function saveToAppDir(srcUri: string) {
    const dir = `${FileSystem.documentDirectory}photos/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const ext = srcUri.split('.').pop()?.toLowerCase() || 'jpg';
    const dest = `${dir}${Date.now()}-${Math.random().toString(36).slice(2,7)}.${ext}`;
    await FileSystem.copyAsync({ from: srcUri, to: dest });
    return dest; // file://...
}