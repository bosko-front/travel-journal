import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    Image,
    FlatList,
    SafeAreaView,
    StatusBar, TextInput, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {getEntry, addPhotosToEntry, deletePhoto, updateEntryNote, updateEntry} from '@/db/ index';
import { pickImages, takePhoto } from '@/lib/images';
import {useSafeAreaInsets} from "react-native-safe-area-context";
import { scale, verticalScale, moderateScale } from "@/utils/scaling";
import { countryFlagEmoji, getCurrentCoords, distanceKm, reverseGeocode } from '@/lib/location';

export default function EntryDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const [entry, setEntry] = useState<any>(null);
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingNote, setEditingNote] = useState(false);
    const [noteDraft, setNoteDraft] = useState('');
    const [savingNote, setSavingNote] = useState(false)
    const inset = useSafeAreaInsets();

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const { entry, photos } = await getEntry(Number(id));
            setEntry(entry);
            setPhotos(photos as any[]);
            if (!editingNote) setNoteDraft(entry?.note ?? '');
        } catch (e: any) {
            Alert.alert('Greška', e?.message ?? 'Neuspelo učitavanje');
        } finally {
            setLoading(false);
        }
    }, [id]);

    const startEditNote = () => {
        setNoteDraft(entry?.note ?? '');
        setEditingNote(true);
    };

    const cancelEditNote = () => {
        setNoteDraft(entry?.note ?? '');
        setEditingNote(false);
    };


    const saveNote = async () => {
        try {
            setSavingNote(true);
            await updateEntryNote(Number(id), noteDraft.trim() === '' ? null : noteDraft.trim());
            await load();

            Alert.alert('Sačuvano', 'Beleška je uspešno ažurirana ✅'); // success alert
            setEditingNote(false);
        } catch (e: any) {
            Alert.alert('Greška', e?.message ?? 'Neuspelo čuvanje');
        } finally {
            setSavingNote(false);
        }
    };




    useEffect(() => {
        load();
    }, [load]);

    const onAddFromGallery = async () => {
        const uris = await pickImages(10);
        if (!uris.length) return;
        await addPhotosToEntry(Number(id), uris);
        await load();
    };

    const onAddFromCamera = async () => {
        const uri = await takePhoto();
        if (!uri) return;
        await addPhotosToEntry(Number(id), [uri]);
        await load();
    };

    const onDeletePhoto = async (photoId: number) => {
        Alert.alert('Obriši fotografiju', 'Da li ste sigurni?', [
            { text: 'Otkaži', style: 'cancel' },
            {
                text: 'Obriši',
                style: 'destructive',
                onPress: async () => {
                    await deletePhoto(photoId);
                    await load();
                },
            },
        ]);
    };

    const renderPhoto = ({ item }: { item: any }) => (
        <TouchableOpacity activeOpacity={0.85} onLongPress={() => onDeletePhoto(item.id)}>
            <View style={s.thumbWrap}>
                <Image source={{ uri: item.uri }} style={s.thumbImg} resizeMode="cover" />
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                <StatusBar barStyle="light-content" />
                <Text>Učitavanje…</Text>
            </SafeAreaView>
        );
    }

    if (!entry) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                <StatusBar barStyle="light-content" />
                <Text>Ne postoji zapis.</Text>
            </SafeAreaView>
        );
    }

    const prettyDate = new Date(entry.date_iso).toLocaleDateString('sr-RS', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <View style={s.safe}>
            <StatusBar barStyle="light-content" />
            {/* HEADER */}
            <LinearGradient colors={['#10B981', '#059669']} style={[s.header, { paddingTop: inset.top + verticalScale(8) }]}>
                <View style={s.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="chevron-back" size={moderateScale(24)} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ flex: 1, paddingRight: 40 }}>
                        <Text numberOfLines={1} style={s.headerTitle}>{entry.title}</Text>
                        <Text style={s.headerSub}>{prettyDate}</Text>
                    </View>
                </View>

                {/* Chips row */}
                <View style={s.chips}>
                    <View style={s.chip}>
                        <Ionicons name="images-outline" size={moderateScale(16)} color="#065F46" />
                        <Text style={s.chipText}>{photos.length} fotografije</Text>
                    </View>
                    <View style={s.chip}>
                        <Ionicons name="location-outline" size={moderateScale(16)} color="#065F46" />
                        <Text style={s.chipText}>
                            {(entry.place_name || '—')}, {(entry.locality || '—')} {countryFlagEmoji(entry.country_code || '')}
                        </Text>
                    </View>
                </View>

            </LinearGradient>

            {/* CONTENT */}
            <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: verticalScale(32) }} showsVerticalScrollIndicator={false}>
                {/* Location card */}
                <View style={s.card}>
                    <Text style={s.sectionTitle}>Lokacija</Text>
                    {entry.lat && entry.lng ? (
                        <>
                            <Text style={s.noteText}>
                                {(entry.place_name || '—')}, {(entry.locality || '—')} {countryFlagEmoji(entry.country_code || '')}
                            </Text>
                            <View style={{ flexDirection:'row', gap: 12, marginTop: 10, flexWrap:'wrap' }}>
                                <TouchableOpacity
                                    style={s.outlineBtn}
                                    onPress={() => Linking.openURL(`https://maps.google.com/?q=${entry.lat},${entry.lng}`)}
                                >
                                    <Text style={s.outlineBtnText}>Open in Maps</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={s.outlineBtn}
                                    onPress={async () => {
                                        const me = await getCurrentCoords();
                                        if (!me) return;
                                        const d = distanceKm(me, { lat: entry.lat, lng: entry.lng });
                                        Alert.alert('Distance', `${d.toFixed(1)} km from your current location`);
                                    }}
                                >
                                    <Text style={s.outlineBtnText}>Distance from me</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={s.outlineBtn}
                                    onPress={async () => {
                                        // refresh reverse geocode if needed
                                        const info = await reverseGeocode(entry.lat, entry.lng);
                                        if (info) {
                                            await updateEntry(Number(id), info as any);
                                            await load();
                                        }
                                    }}
                                >
                                    <Text style={s.outlineBtnText}>Refresh address</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <Text style={s.placeholder}>Bez lokacije</Text>
                    )}
                </View>

                <View style={s.card}>
                    <View style={s.cardHeaderRow}>
                        <Text style={s.sectionTitle}>Beleška</Text>
                        {!editingNote ? (
                            <TouchableOpacity onPress={startEditNote} style={s.iconBtn} hitSlop={{ top: verticalScale(8), bottom: verticalScale(8), left: scale(8), right: scale(8) }}>
                                <Ionicons name="pencil-outline" size={moderateScale(18)} color="#6B7280" />
                            </TouchableOpacity>
                        ) : (
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity disabled={savingNote} onPress={saveNote} style={[s.iconBtn, savingNote && { opacity: 0.6 }]}>
                                    <Ionicons name="checkmark" size={moderateScale(20)} color="#10B981" />
                                </TouchableOpacity>
                                <TouchableOpacity disabled={savingNote} onPress={cancelEditNote} style={s.iconBtn}>
                                    <Ionicons name="close" size={moderateScale(20)} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {!editingNote ? (
                        entry.note ? (
                            <Text style={s.noteText}>{entry.note}</Text>
                        ) : (
                            <Text style={s.placeholder}>Nema beleške.</Text>
                        )
                    ) : (
                        <TextInput
                            style={[s.input, { height: verticalScale(120), textAlignVertical: 'top', marginTop: verticalScale(8) }]}
                            value={noteDraft}
                            onChangeText={setNoteDraft}
                            placeholder="Utisci, preporuke, itd."
                            multiline
                            autoFocus
                            editable={!savingNote}
                        />
                    )}
                </View>

                {/* Actions */}
                <View style={s.actionsRow}>
                    <TouchableOpacity style={[s.primaryBtn, { flex: 1 }]} onPress={onAddFromGallery} activeOpacity={0.9}>
                        <Ionicons name="image-outline" size={moderateScale(18)} color="#fff" />
                        <Text style={s.primaryBtnText}>Dodaj iz galerije</Text>
                    </TouchableOpacity>
                    <View style={{ width: scale(12) }} />
                    <TouchableOpacity style={[s.outlineBtn, { flex: 1 }]} onPress={onAddFromCamera} activeOpacity={0.9}>
                        <Ionicons name="camera-outline" size={moderateScale(18)} color="#10B981" />
                        <Text style={s.outlineBtnText}>Kamera</Text>
                    </TouchableOpacity>
                </View>

                {/* Photos strip */}
                <View style={{ marginTop: verticalScale(16) }}>
                    <Text style={s.sectionTitle}>Fotografije</Text>
                    {photos.length ? (
                        <FlatList
                            data={photos}
                            keyExtractor={(item) => String(item.id)}
                            renderItem={renderPhoto}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingVertical: verticalScale(8) }}
                            ItemSeparatorComponent={() => <View style={{ width: scale(12) }} />}
                        />
                    ) : (
                        <Text style={s.placeholder}>Nema fotografija.</Text>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F3F4F6' },

    // Header
    header: {
        paddingHorizontal: scale(16),
        paddingTop: verticalScale(8),
        paddingBottom: verticalScale(16),
        borderBottomLeftRadius: scale(18),
        borderBottomRightRadius: scale(18),
    },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    backBtn: {
        width: scale(36), height: verticalScale(36), borderRadius: scale(18), backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center', justifyContent: 'center', marginRight: scale(8),
    },
    headerTitle: { color: '#fff', fontSize: moderateScale(22), fontWeight: '800' },
    headerSub: { color: '#D1FAE5', marginTop: verticalScale(2), fontSize: moderateScale(13) },

    chips: { flexDirection: 'row', gap: scale(8), marginTop: verticalScale(12), flexWrap: 'wrap' },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: scale(6),
        backgroundColor: '#ECFDF5', paddingHorizontal: scale(10), paddingVertical: verticalScale(6),
        borderRadius: 999, borderWidth: 1, borderColor: '#A7F3D0',
    },
    chipText: { color: '#065F46', fontWeight: '600', fontSize: moderateScale(12) },

    // Body
    body: { flex: 1, paddingHorizontal: scale(16), paddingTop: verticalScale(12) },

    card: {
        backgroundColor: '#fff',
        borderRadius: scale(12),
        padding: scale(14),
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: verticalScale(16),
    },

    sectionTitle: { fontSize: moderateScale(15), fontWeight: '700', color: '#111827', marginBottom: verticalScale(8) },
    noteText: { color: '#374151', lineHeight: verticalScale(20) },
    placeholder: { color: '#6B7280' },

    actionsRow: { flexDirection: 'row', marginTop: verticalScale(16) },

    primaryBtn: {
        backgroundColor: '#10B981',
        paddingVertical: verticalScale(12),
        borderRadius: scale(12),
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: scale(8),
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },
    primaryBtnText: { color: '#fff', fontWeight: '800' },

    outlineBtn: {
        backgroundColor: '#fff',
        paddingVertical: verticalScale(12),
        borderRadius: scale(12),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#10B981',
        flexDirection: 'row',
        gap: scale(8),
    },
    outlineBtnText: { color: '#10B981', fontWeight: '800', padding:scale(10) },

    thumbWrap: {
        width: scale(132),
        height: verticalScale(132),
        borderRadius: scale(12),
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
    },
    thumbImg: { width: '100%', height: '100%' },
    input: {
        backgroundColor: '#fff',
        borderRadius: scale(10),
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: scale(12),
        paddingVertical: verticalScale(10),
        color: '#111827',
    },

    iconBtn: {
        padding: scale(6),
        borderRadius: scale(8),
        backgroundColor: '#F3F4F6',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: verticalScale(6),
    },
});
