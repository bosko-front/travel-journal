import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { scale, verticalScale, moderateScale } from "@/utils/scaling";

export default function EntryCard({
                                      title,
                                      date,
                                      thumbUri,
                                      onPress,
                                  }: {
    title: string;
    date: string;
    thumbUri?: string;
    onPress?: () => void;
}) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={s.card}>
            {thumbUri ? (
                <Image source={{ uri: thumbUri }} style={s.thumb} />
            ) : (
                <View style={[s.thumb, s.thumbFallback]}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: moderateScale(18) }}>
                        {title.slice(0,1).toUpperCase()}
                    </Text>
                </View>
            )}
            <View style={{ flex: 1 }}>
                <Text style={s.title} numberOfLines={1}>{title}</Text>
                <Text style={s.date}>{new Date(date).toLocaleDateString('sr-RS')}</Text>
            </View>
        </TouchableOpacity>
    );
}

const s = StyleSheet.create({
    card: {
        flexDirection: 'row', gap: scale(12), backgroundColor: '#fff', borderRadius: scale(12),
        padding: scale(12), alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
    },
    thumb: { width: scale(56), height: scale(56), borderRadius: scale(8), backgroundColor: '#F3F4F6' },
    thumbFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B981' },
    title: { fontSize: moderateScale(16), fontWeight: '700', color: '#111827' },
    date: { color: '#6B7280', marginTop: verticalScale(2) },
});
