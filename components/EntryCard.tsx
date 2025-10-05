import React from 'react';
import {View, Text, Image, StyleSheet, TouchableOpacity} from 'react-native';
import {scale, verticalScale, moderateScale} from "@/utils/scaling";
import {LinearGradient} from "expo-linear-gradient";
import {weatherGradients} from "@/lib/weatherGradients";
import {useWeatherStore} from "@/stores/weatherStore";

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
    const weather = useWeatherStore(s => s.weather);

    const gradientColors =
        weather?.icon && weatherGradients[weather.icon]
            ? weatherGradients[weather.icon]
            : weatherGradients.default;

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={s.card}>
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.thumb} // gradient is the square itself
            >
                <Text style={s.thumbText}>
                    {title.slice(0, 1).toUpperCase()}
                </Text>
            </LinearGradient>
            <View style={{flex: 1}}>
                <Text style={s.title} numberOfLines={1}>{title}</Text>
                <Text style={s.date}>{new Date(date).toLocaleDateString('sr-RS')}</Text>
            </View>
        </TouchableOpacity>
    );
}

    const s = StyleSheet.create({
        card: {
            flexDirection: 'row',
            gap: scale(12),
            backgroundColor: '#fff',
            borderRadius: scale(12),
            padding: scale(12),
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#E5E7EB',
        },
        thumb: {
            width: scale(56),
            height: scale(56),
            borderRadius: scale(8),
            alignItems: 'center',
            justifyContent: 'center',
        },
        thumbText: {
            color: '#fff',
            fontWeight: '700',
            fontSize: moderateScale(18),
        },
        title: {
            fontSize: moderateScale(16),
            fontWeight: '700',
            color: '#111827',
        },
        date: {
            color: '#6B7280',
            marginTop: verticalScale(2),
        },
    });

