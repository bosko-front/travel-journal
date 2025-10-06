import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image, Platform} from 'react-native';
import {useRouter} from 'expo-router';
import {useEntryStore} from '@/stores/entryStore';
import {pickImages, takePhoto} from '@/lib/images';
import {LinearGradient} from "expo-linear-gradient";
import {Ionicons} from "@expo/vector-icons";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import DateTimePicker from '@react-native-community/datetimepicker';
import { scale, verticalScale, moderateScale } from "@/utils/scaling";
import { getCurrentCoords, reverseGeocode, countryFlagEmoji } from '@/lib/location';
import {weatherGradients} from "@/lib/weatherGradients";
import LottieView from "lottie-react-native";
import {weatherAnimations} from "@/lib/weatherAnimations";
import { useWeatherStore } from "@/stores/weatherStore";
import AiAudioTranscribe from "@/components/aiAudioTranscribe";
import * as Haptics from 'expo-haptics';

export default function NewEntryScreen() {
    const router = useRouter();
    const {addEntry} = useEntryStore();

    const [title, setTitle] = useState('');
    const [note, setNote] = useState('');
    const [dateIso, setDateIso] = useState(new Date().toISOString().slice(0, 10));
    const [photos, setPhotos] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const inset = useSafeAreaInsets();
    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [coords, setCoords] = useState<{lat:number,lng:number}|null>(null);
    const [addr, setAddr] = useState<{place_name:string; locality:string; country_code:string} | null>(null);
    const [weather, setWeather] = useState<{temp:number, desc:string, icon:string} | null>(null);
    const globalWeather = useWeatherStore(s => s.weather);

    const onPickImages = async () => {
        const uris = await pickImages(10);
        if (uris.length) setPhotos(p => [...uris, ...p]);
    };

    const gradientColors =
        globalWeather?.icon && weatherGradients[globalWeather.icon]
            ? weatherGradients[globalWeather.icon]
            : weatherGradients.default;

    const onTakePhoto = async () => {
        const uri = await takePhoto();
        if (uri) setPhotos(p => [uri, ...p]);
    };



    const onSave = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        if (!title.trim()) {
            Alert.alert('Error', 'Title is required. Please enter a title.');
            return;
        }
        setLoading(true);
        try {
            const payload = {
                title: title.trim(),
                note: note.trim() || null,
                date_iso: dateIso,
                lat: coords?.lat ?? null,
                lng: coords?.lng ?? null,
                place_name: addr?.place_name ?? null,
                locality: addr?.locality ?? null,
                country_code: addr?.country_code ?? null,
                weather: weather ? {
                    temp: weather.temp,
                    desc: weather.desc,
                    icon: weather.icon,
                } : null,
            };
            await addEntry(payload as any, photos);
            Alert.alert('Saved', 'Entry added successfully.', [{text: 'OK', onPress: () => router.back()}]);
        } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'Saving failed. Please try again.', []);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (_: any, selectedDate?: Date) => {
        setShowPicker(Platform.OS === 'ios'); // keep open on iOS, auto-close on Android
        if (selectedDate) {
            setDate(selectedDate);
            setDateIso(selectedDate.toISOString().split('T')[0]); // save YYYY-MM-DD
        }
    };

    const onUseLocation = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        const c = await getCurrentCoords();
        if (!c) return;
        setCoords(c);
        const pretty = await reverseGeocode(c.lat, c.lng);
        setAddr(pretty);

        // Delegate weather fetching to the global store to avoid duplicate requests and respect TTL/cache
        const { setFromCoords } = useWeatherStore.getState();
        await setFromCoords(c.lat, c.lng);
        setWeather(useWeatherStore.getState().weather);
    };

    return (
        <View style={{flex: 1}}>
            <LinearGradient colors={gradientColors as [string, string]} style={[s.header, {paddingTop: inset.top + verticalScale(12)}]}>
                <View style={s.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}
                                      hitSlop={{top: verticalScale(8), bottom: verticalScale(8), left: scale(8), right: scale(8)}}>
                        <Ionicons name="chevron-back" size={moderateScale(24)} color="#fff"/>
                    </TouchableOpacity>
                    <View style={{flex: 1, justifyContent:'center', alignItems:'center'}}>
                        <Text numberOfLines={1} style={s.headerTitle}>New entry</Text>
                    </View>
                    {globalWeather?.icon && (
                        <View style={s.weatherRight}>
                            <LottieView
                                source={weatherAnimations[globalWeather.icon] || weatherAnimations.default}
                                autoPlay
                                loop
                                style={{ width: 60, height: 60 }}
                            />
                        </View>
                    )}
                </View>
            </LinearGradient>

            <ScrollView style={{flex: 1, backgroundColor: '#F3F4F6'}}
                        contentContainerStyle={{padding: scale(16), paddingTop: verticalScale(48)}}>


                <Text style={s.label}>Title *</Text>
                <TextInput
                    style={s.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="example Vienna – Prater"
                    placeholderTextColor="#9CA3AF"
                />

                <Text style={s.label}>Date</Text>
                <TouchableOpacity
                    style={s.input}
                    onPress={() => setShowPicker(true)}
                >
                    <Text>{dateIso || 'Choose date'}</Text>
                </TouchableOpacity>

                {showPicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        themeVariant='light'
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                    />
                )}

                <Text style={s.label}>Notes</Text>

                <AiAudioTranscribe note={note} onChangeNote={setNote} />

                <View style={s.row}>
                    <TouchableOpacity style={[s.btnOutline, {flex: 1}]} onPress={onPickImages}>
                        <Text style={s.btnOutlineText}>+ Gallery</Text>
                    </TouchableOpacity>
                    <View style={{width: scale(10)}}/>
                    <TouchableOpacity style={[s.btnOutline, {flex: 1}]} onPress={onTakePhoto}>
                        <Text style={s.btnOutlineText}>📷 Camera</Text>
                    </TouchableOpacity>
                </View>

                {photos.length > 0 && (
                    <View style={s.grid}>
                        {photos.map((uri, i) => (
                            <TouchableOpacity key={i}
                                              onLongPress={() => setPhotos(p => p.filter((_, idx) => idx !== i))}>
                                <View style={s.thumbWrap}>
                                    <Image source={{uri}} style={{width: '100%', height: '100%'}} resizeMode="cover"/>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={{height: verticalScale(12)}}/>

                <TouchableOpacity style={s.btnGhost} onPress={onUseLocation}>
                    <Text style={s.btnGhostText}>
                        {addr
                            ? `${addr.place_name}, ${addr.locality} ${countryFlagEmoji(addr.country_code)}`
                            : coords
                                ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                                : 'Use my location'}
                    </Text>
                    {weather && (
                        <View style={{marginTop: 12, alignItems: 'center'}}>
                            <Text style={{fontWeight: '600', color: '#374151'}}>
                                {weather.temp}°C – {weather.desc}
                            </Text>
                            <Image
                                source={{uri: `https://openweathermap.org/img/wn/${weather.icon}@2x.png`}}
                                style={{width: 48, height: 48}}
                            />
                        </View>
                    )}
                </TouchableOpacity>


                <View style={{height: verticalScale(16)}}/>

                <TouchableOpacity
                    style={[s.btnWrapper, loading && {opacity: 0.7}]}
                    onPress={onSave}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={gradientColors} // example: light-to-dark green
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={s.btnPrimary}
                    >
                        <Text style={s.btnPrimaryText}>
                            {loading ? 'Saving...' : 'Save'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>


                <View style={{height: verticalScale(40)}}/>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    h1: {fontSize: moderateScale(22), fontWeight: '800', color: '#111827', marginBottom: verticalScale(12)},
    label: {marginTop: verticalScale(12), marginBottom: verticalScale(6), color: '#374151', fontWeight: '600'},
    input: {
        backgroundColor: '#fff', borderRadius: scale(10), borderWidth: 1, borderColor: '#E5E7EB',
        paddingHorizontal: scale(12), paddingVertical: verticalScale(10), color: '#111827',
    },
    row: {flexDirection: 'row', marginTop: verticalScale(12)},
    btn: {
        backgroundColor: '#10B981', paddingVertical: verticalScale(12), borderRadius: scale(10), alignItems: 'center',
    },
    btnText: {color: '#fff', fontWeight: '700'},
    btnOutline: {
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#10B981',
        paddingVertical: verticalScale(12), borderRadius: scale(10), alignItems: 'center',
    },
    btnOutlineText: {color: '#10B981', fontWeight: '700'},
    grid: {flexDirection: 'row', flexWrap: 'wrap', gap: scale(8), marginTop: verticalScale(12)},
    thumbWrap: {width: scale(84), height: verticalScale(84), borderRadius: scale(10), overflow: 'hidden', backgroundColor: '#F3F4F6'},
    thumb: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B981'},
    btnGhost: {
        paddingVertical: verticalScale(10),
        alignItems: 'center',
        borderRadius: scale(10),
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0'
    },
    btnGhostText: {color: '#047857', fontWeight: '700'},
    btnWrapper: {
        borderRadius: scale(12),
        overflow: 'hidden', // ensures gradient corners are rounded
    },
    btnPrimary: {
        paddingVertical: verticalScale(14),
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnPrimaryText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: moderateScale(16),
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
    backBtn: {
        width: scale(36), height: verticalScale(36), borderRadius: scale(18), backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center', justifyContent: 'center', marginRight: scale(8),
    },
    weatherRight: { position: 'absolute', right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: '#fff', fontSize: moderateScale(22), fontWeight: '800' },
    header: {
        paddingHorizontal: scale(16),
        paddingTop: verticalScale(8),
        paddingBottom: verticalScale(16),
        borderBottomLeftRadius: scale(18),
        borderBottomRightRadius: scale(18),
    },
});
