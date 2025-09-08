// lib/location.ts
import * as Location from 'expo-location';

export type PrettyAddress = {
    place_name: string;    // e.g., "Studentski trg 16"
    locality: string;      // e.g., "Belgrade"
    country_code: string;  // e.g., "RS"
};

export async function getCurrentCoords() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
    });
    return { lat: loc.coords.latitude, lng: loc.coords.longitude };
}

export async function reverseGeocode(lat: number, lng: number): Promise<PrettyAddress | null> {
    const items = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (!items?.length) return null;
    const a = items[0]; // { name, street, city, region, postalCode, country, isoCountryCode, district }
    const place =
        [a.name, a.street].filter(Boolean).join(' ') ||
        [a.district, a.city].filter(Boolean).join(', ') ||
        a.city || a.region || a.country || 'Unknown';
    return {
        place_name: place,
        locality: a.city || a.region || a.country || '—',
        country_code: (a.isoCountryCode || '').toUpperCase(),
    };
}

export function countryFlagEmoji(iso2: string) {
    if (!iso2 || iso2.length !== 2) return '🌍';
    const base = 0x1f1e6; // 'A'
    const chars = iso2.toUpperCase().split('').map(c => base + (c.charCodeAt(0) - 65));
    return String.fromCodePoint(chars[0], chars[1]);
}

// Haversine distance in km
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
}
const toRad = (deg: number) => (deg * Math.PI) / 180;
