import React, {useCallback, useEffect, useRef, useState} from 'react';
import {View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {Link, useFocusEffect, useRouter} from 'expo-router';
import {useEntryStore} from '@/stores/entryStore';
import EntryCard from '@/components/EntryCard';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import {Ionicons} from "@expo/vector-icons";
import {deleteEntry} from "@/db/ index";
import {LinearGradient} from "expo-linear-gradient";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import { scale, verticalScale, moderateScale } from "@/utils/scaling";


export default function Home() {
    const {entries, refresh, loading} = useEntryStore();
    const [q, setQ] = useState('');
    const router = useRouter();
    const rowRefs = useRef<Record<number, Swipeable | null>>({});
    const openRowKey = useRef<number | null>(null);
    const inset = useSafeAreaInsets();

    const closeOpenRow = useCallback(() => {
        if (openRowKey.current != null) {
            const ref = rowRefs.current[openRowKey.current];
            ref?.close();
            openRowKey.current = null;
        }
    }, []);

    useFocusEffect(React.useCallback(() => {
        refresh();
    }, [refresh]));

    useEffect(() => {
        const t = setTimeout(() => refresh(q), 250);
        return () => clearTimeout(t);
    }, [q]);


    const confirmDelete = useCallback(async (id: number) => {
        Alert.alert('Obriši zapis', 'Da li ste sigurni?', [
            {text: 'Otkaži', style: 'cancel'},
            {
                text: 'Obriši',
                style: 'destructive',
                onPress: async () => {
                    await deleteEntry(id);
                    await refresh();
                    closeOpenRow();
                },
            },
        ]);
    }, [refresh, closeOpenRow]);

    const renderRightView = useCallback((itemId: number) => {
        return (
            <TouchableOpacity
                onPress={() => confirmDelete(itemId)}
                activeOpacity={0.85}
                style={styles.rightAction}
            >
                <Ionicons name="trash-outline" size={scale(24)} color="#fff"/>
            </TouchableOpacity>
        );
    }, [confirmDelete]);

    const handleCardPress = useCallback((itemId: number, index: number) => {
        rowRefs.current[index]?.close(); // close this row if partially open
        closeOpenRow();                  // close previously opened row
        openRowKey.current = null;
        router.push({pathname: '/entry/[id]', params: {id: String(itemId)}});
    }, [closeOpenRow, router]);


    const renderItem = useCallback(({item, index}: { item: any; index: number }) => {
        return (
            <Swipeable
                ref={(ref) => {
                    rowRefs.current[index] = ref;
                }}
                friction={2}
                rightThreshold={scale(72)}
                overshootRight={false}
                onSwipeableOpen={() => {
                    // close any previously open row, then set this one as open
                    if (openRowKey.current !== index) {
                        closeOpenRow();
                        openRowKey.current = index;
                    }
                }}
                renderRightActions={() => renderRightView(item.id)}
            >
                <EntryCard
                    title={item.title}
                    date={item.date_iso}
                    onPress={() => handleCardPress(item.id, index)}
                />
            </Swipeable>
        );
    }, [router, renderRightView, closeOpenRow]);

    return (

        <View style={{flex: 1}}>
            <LinearGradient colors={['#10B981', '#059669']} style={[styles.header, {paddingTop: inset.top + verticalScale(8)}]}>
                <View style={styles.headerRow}>
                    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                        <Text numberOfLines={1} style={styles.headerTitle}>Travel Journal</Text>
                    </View>
                </View>
                <TextInput
                    style={styles.search}
                    placeholder="Pretraga..."
                    value={q}
                    onChangeText={setQ}
                />
            </LinearGradient>
            <View style={styles.content}>
                <FlatList
                    data={entries}
                    keyExtractor={(it) => String(it.id)}
                    ItemSeparatorComponent={() => <View style={{height: verticalScale(10)}}/>}
                    contentContainerStyle={{paddingTop: verticalScale(8), paddingBottom: verticalScale(80)}}
                    renderItem={renderItem}
                    ListEmptyComponent={!loading ? <Text style={styles.empty}>Nema zapisa.</Text> : null}
                    onScrollBeginDrag={closeOpenRow} // zatvori otvorenu pri skrolu
                />
                <Link href="/entry/new" asChild>
                    <TouchableOpacity style={styles.fab}>
                        <Text style={{color: '#fff', fontWeight: '800', fontSize: moderateScale(18)}}>＋</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: scale(16)
    },
    title: {fontSize: moderateScale(24), fontWeight: '800', color: '#111827', marginBottom: verticalScale(12)},
    search: {
        backgroundColor: '#fff', borderRadius: scale(10), paddingHorizontal: scale(12), paddingVertical: verticalScale(14),
        marginTop:verticalScale(12),
        borderWidth: 1, borderColor: '#E5E7EB',
    },
    empty: {textAlign: 'center', color: '#6B7280', marginTop: verticalScale(40)},
    fab: {
        position: 'absolute', right: scale(16), bottom: verticalScale(24), backgroundColor: '#10B981',
        width: scale(56), height: scale(56), borderRadius: scale(28), alignItems: 'center', justifyContent: 'center',
        elevation: 4,
    },
    rightAction: {
        backgroundColor: '#EF4444',
        width: scale(72),
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: scale(12),
        marginVertical: verticalScale(4),
        marginLeft: scale(8),
    },
    headerRow: {flexDirection: 'row', alignItems: 'center'},
    headerTitle: {color: '#fff', fontSize: moderateScale(22), fontWeight: '800'},
    header: {
        paddingHorizontal: scale(16),
        paddingTop: verticalScale(8),
        paddingBottom: verticalScale(16),
        borderBottomLeftRadius: scale(18),
        borderBottomRightRadius: scale(18),
    },
});
