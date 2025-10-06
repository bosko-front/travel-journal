import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { AudioManager, AudioRecorder } from 'react-native-audio-api';
import { scale, verticalScale } from '@/utils/scaling';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSpeechToText, WHISPER_TINY_EN } from 'react-native-executorch';
import * as Haptics from 'expo-haptics';


type Props = {
    note: string;
    onChangeNote: (text: string) => void;
};

// Inner component that actually mounts the Whisper hook only when needed
function AiAudioTranscribeInner({ note, onChangeNote }: Props) {
    const recorderRef = useRef<AudioRecorder | null>(null);
    const startedRef = useRef(false);
    const [isRecording, setIsRecording] = useState(false);
    const model = useSpeechToText({ model: WHISPER_TINY_EN });

    useEffect(() => {
        AudioManager.setAudioSessionOptions({
            iosCategory: 'playAndRecord',
            iosMode: 'spokenAudio',
            iosOptions: ['allowBluetooth', 'defaultToSpeaker'],
        });
        AudioManager.requestRecordingPermissions();

        recorderRef.current = new AudioRecorder({
            sampleRate: 16000,
            bufferLengthInSamples: 1600,
        });

        return () => {
            try {
                recorderRef.current?.stop();
            } catch {}
            try {
                if (startedRef.current) {
                    model.streamStop();
                }
            } catch (e) {
                console.warn('streamStop on unmount failed (ignored):', e?.message || e);
            }
        };
    }, []);

    // Mark model as ready in storage once it's ready (one-time)
    useEffect(() => {
        if (model.isReady) {
            AsyncStorage.setItem('whisperReady', '1').catch(() => {});
        }
    }, [model.isReady]);

    // 🔄 Sync transcription
    useEffect(() => {
        const interval = setInterval(() => {
            if (isRecording && model.isGenerating) {
                const text = model.nonCommittedTranscription || model.committedTranscription || '';
                if (text && text !== note) onChangeNote(text);
            }
        }, 200);
        return () => clearInterval(interval);
    }, [isRecording, model.isGenerating, model.nonCommittedTranscription]);

    const handleStartStreaming = async () => {
        const recorder = recorderRef.current;
        if (!recorder) return;

        recorder.onAudioReady(({ buffer }) => {
            try {
                const floatArr = Array.from(buffer.getChannelData(0));
                model.streamInsert(floatArr);
            } catch (e) {
                console.warn('Audio buffer error', e);
            }
        });

        await recorder.start();
        setIsRecording(true);
        startedRef.current = true;

        model
            .stream()
            .catch(err => console.warn('Whisper stream error', err))
            .finally(() => {
                setIsRecording(false);
                startedRef.current = false;
            });
    };

    const handleStopStreaming = () => {
        try {
            recorderRef.current?.stop();
        } catch {}
        try {
            if (startedRef.current) {
                model.streamStop();
                startedRef.current = false;
            }
        } catch (e) {
            console.warn('streamStop failed (ignored):', e?.message || e);
        }
        setIsRecording(false);
    };

    const toggleRecording = async () => {
     await  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        if (isRecording) handleStopStreaming();
        else handleStartStreaming();
    };

    return (
        <View style={styles.inputWrapper}>
            <TextInput
                style={[styles.input, styles.multilineInput]}
                value={note}
                onChangeText={onChangeNote}
                placeholder={!model.isReady ? `Downloading Whisper… ${Math.round(model.downloadProgress * 100)} %` : 'Note, recommendations, etc.'}
                placeholderTextColor="#9CA3AF"
                multiline
                editable={!isRecording}
            />

            <TouchableOpacity
                onPress={toggleRecording}
                style={[styles.micInline, isRecording && styles.micActive]}
                disabled={!model.isReady}
                activeOpacity={0.8}
            >
                {!model.isReady ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Ionicons name={isRecording ? 'stop' : 'mic'} size={22} color="#fff" />
                )}
            </TouchableOpacity>
        </View>
    );
}

export default function AiAudioTranscribe({ note, onChangeNote }: Props) {
    const [showEngine, setShowEngine] = useState(false);
    const [readyOnce, setReadyOnce] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem('whisperReady')
            .then(v => setReadyOnce(v === '1'))
            .catch(() => {});
    }, []);

    if (showEngine) {
        return <AiAudioTranscribeInner note={note} onChangeNote={onChangeNote} />;
    }

    const onMicPress = () => {
        if (!readyOnce) {
            Alert.alert(
                'Enable voice notes?',
                'This feature requires a one-time download of the speech model (~75–100MB). Proceed?',
                [
                    { text: 'Not now', style: 'cancel' },
                    {
                        text: 'Download',
                        style: 'default',
                        onPress: () => setShowEngine(true),
                    },
                ]
            );
        } else {
            setShowEngine(true);
        }
    };

    return (
        <View style={styles.inputWrapper}>
            <TextInput
                style={[styles.input, styles.multilineInput]}
                value={note}
                onChangeText={onChangeNote}
                placeholder={'Note, recommendations, etc.'}
                placeholderTextColor="#9CA3AF"
                multiline
            />

            <TouchableOpacity onPress={onMicPress} style={styles.micInline} activeOpacity={0.8}>
                <Ionicons name={'mic'} size={22} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    input: {
        backgroundColor: '#fff',
        borderRadius: scale(10),
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: scale(12),
        paddingVertical: verticalScale(10),
        color: '#111827',
    },
    multilineInput: {
        height: verticalScale(100),
        textAlignVertical: 'top',
        paddingRight: scale(48),
    },
    inputWrapper: {
        position: 'relative',
    },
    micInline: {
        position: 'absolute',
        right: scale(10),
        bottom: verticalScale(10),
        backgroundColor: '#10B981',
        borderRadius: 20,
        width: scale(36),
        height: scale(36),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#10B981',
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    micActive: {
        backgroundColor: '#EF4444',
    },
});
