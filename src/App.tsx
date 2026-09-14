import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  sortRecordingsNewestFirst,
  type Recording,
  type RecordingSnapshot,
  type RecordingStatus,
} from '../shared/recording/model';
import {NativeRecording} from './native/NativeRecording';

const EMPTY_SNAPSHOT: RecordingSnapshot = {
  status: {state: 'idle'},
  recordings: [],
};

export default function App(): React.JSX.Element {
  const [snapshot, setSnapshot] = useState<RecordingSnapshot>(EMPTY_SNAPSHOT);
  const [isLoading, setIsLoading] = useState(NativeRecording.isAvailable);
  const [error, setError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const latestRequestRef = useRef(0);

  const refresh = useCallback(async (): Promise<void> => {
    if (!NativeRecording.isAvailable) {
      return;
    }
    const requestId = ++latestRequestRef.current;
    setIsLoading(true);
    try {
      const nextSnapshot = await NativeRecording.getSnapshot();
      if (requestId === latestRequestRef.current) {
        setSnapshot(nextSnapshot);
        setNowMs(Date.now());
        setError(null);
      }
    } catch (caughtError: unknown) {
      if (requestId === latestRequestRef.current) {
        setError(errorMessage(caughtError));
      }
    } finally {
      if (requestId === latestRequestRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (snapshot.status.state !== 'recording') {
      return undefined;
    }
    const timer = setInterval(() => setNowMs(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [snapshot.status.state]);

  const runAction = useCallback(
    async (action: 'start' | 'stop'): Promise<void> => {
      const requestId = ++latestRequestRef.current;
      setIsLoading(true);
      setError(null);
      try {
        const nextSnapshot =
          action === 'start'
            ? await NativeRecording.start()
            : await NativeRecording.stop();
        if (requestId === latestRequestRef.current) {
          setSnapshot(nextSnapshot);
          setNowMs(Date.now());
        }
      } catch (actionError: unknown) {
        try {
          const reconciledSnapshot = await NativeRecording.getSnapshot();
          if (requestId === latestRequestRef.current) {
            setSnapshot(reconciledSnapshot);
            setNowMs(Date.now());
          }
        } catch {
          // Keep the last valid snapshot and report the original action error.
        }
        if (requestId === latestRequestRef.current) {
          setError(errorMessage(actionError));
        }
      } finally {
        if (requestId === latestRequestRef.current) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  const recordings = useMemo(
    () => sortRecordingsNewestFirst(snapshot.recordings),
    [snapshot.recordings],
  );
  const isRecording = snapshot.status.state === 'recording';
  const actionDisabled =
    !NativeRecording.isAvailable ||
    isLoading ||
    snapshot.status.state === 'stopping';

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={recordings}
        keyExtractor={recording => recording.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <Text style={styles.largeTitle}>Trace</Text>
            <StatusCard status={snapshot.status} nowMs={nowMs} />
            {!NativeRecording.isAvailable ? (
              <Text style={styles.notice}>
                Native recording will become available after the generated iOS
                host and Swift module are integrated.
              </Text>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{disabled: actionDisabled}}
              accessibilityLabel={
                isRecording ? 'Stop recording' : 'Start recording'
              }
              disabled={actionDisabled}
              onPress={() => void runAction(isRecording ? 'stop' : 'start')}
              style={({pressed}) => [
                styles.action,
                isRecording ? styles.stopAction : styles.startAction,
                pressed && styles.actionPressed,
                actionDisabled && styles.actionDisabled,
              ]}>
              {isLoading ? (
                <ActivityIndicator color={isRecording ? '#FF5E65' : '#07130C'} />
              ) : (
                <View
                  style={isRecording ? styles.stopGlyph : styles.recordGlyph}
                />
              )}
              <Text
                style={[
                  styles.actionLabel,
                  isRecording && styles.stopActionLabel,
                ]}>
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Text>
            </Pressable>
            <Text style={styles.sectionTitle}>Recordings</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No recordings yet</Text>
            <Text style={styles.emptyBody}>
              Completed recordings stored by the native recorder will appear
              here.
            </Text>
          </View>
        }
        renderItem={({item}) => <RecordingRow recording={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

function StatusCard({
  status,
  nowMs,
}: {
  readonly status: RecordingStatus;
  readonly nowMs: number;
}): React.JSX.Element {
  const recording = status.state === 'recording';
  const title = statusTitle(status);
  const detail = statusDetail(status, nowMs);

  return (
    <View style={styles.statusCard}>
      <View style={[styles.statusDot, recording && styles.statusDotActive]} />
      <View style={styles.statusText}>
        <Text style={styles.statusLabel}>{title}</Text>
        <Text style={styles.statusDetail}>{detail}</Text>
      </View>
    </View>
  );
}

function RecordingRow({
  recording,
}: {
  readonly recording: Recording;
}): React.JSX.Element {
  return (
    <View style={styles.recordingRow}>
      <View style={styles.waveBadge}>
        <Text style={styles.waveGlyph}>▮▮▮</Text>
      </View>
      <View style={styles.recordingText}>
        <Text numberOfLines={1} style={styles.recordingName}>
          {recording.fileName}
        </Text>
        <Text style={styles.recordingMeta}>
          {formatDate(recording.createdAtMs)} ·{' '}
          {formatDuration(recording.durationMs)}
        </Text>
      </View>
      <Text style={styles.recordingSize}>{formatBytes(recording.byteSize)}</Text>
    </View>
  );
}

function statusTitle(status: RecordingStatus): string {
  switch (status.state) {
    case 'idle':
      return 'Not Recording';
    case 'recording':
      return 'Recording';
    case 'stopping':
      return 'Saving Recording';
    case 'failed':
      return 'Recorder Needs Attention';
  }
}

function statusDetail(status: RecordingStatus, nowMs: number): string {
  switch (status.state) {
    case 'idle':
      return 'Ready when you are';
    case 'recording':
      return formatDuration(Math.max(0, nowMs - status.startedAtMs));
    case 'stopping':
      return 'Finalizing the audio file…';
    case 'failed':
      return status.message;
  }
}

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1_000);
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`;
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function formatDate(timestampMs: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestampMs));
}

function formatBytes(byteSize: number): string {
  if (byteSize < 1_000_000) {
    return `${Math.round(byteSize / 1_000)} KB`;
  }
  return `${(byteSize / 1_000_000).toFixed(1)} MB`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'The recorder could not respond.';
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#0D1210'},
  content: {paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40},
  largeTitle: {
    color: '#F4F7F5',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
    marginBottom: 22,
  },
  statusCard: {
    alignItems: 'center',
    backgroundColor: '#171D1A',
    borderColor: '#252D29',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    padding: 20,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#67716C',
  },
  statusDotActive: {backgroundColor: '#FF5E65'},
  statusText: {marginLeft: 14},
  statusLabel: {color: '#F4F7F5', fontSize: 18, fontWeight: '600'},
  statusDetail: {color: '#98A39E', fontSize: 14, marginTop: 4},
  notice: {color: '#98A39E', fontSize: 13, lineHeight: 19, marginTop: 12},
  error: {color: '#FF8D92', fontSize: 13, lineHeight: 19, marginTop: 12},
  action: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 56,
  },
  startAction: {backgroundColor: '#69E39B'},
  stopAction: {
    backgroundColor: '#2B1C1D',
    borderColor: '#74373A',
    borderWidth: 1,
  },
  actionPressed: {opacity: 0.82},
  actionDisabled: {opacity: 0.45},
  actionLabel: {
    color: '#07130C',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 10,
  },
  stopActionLabel: {color: '#FF7A80'},
  recordGlyph: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#07130C',
  },
  stopGlyph: {
    width: 13,
    height: 13,
    borderRadius: 2,
    backgroundColor: '#FF5E65',
  },
  sectionTitle: {
    color: '#F4F7F5',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 34,
    marginBottom: 14,
  },
  emptyCard: {
    alignItems: 'center',
    borderColor: '#252D29',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 28,
  },
  emptyTitle: {color: '#DCE3DF', fontSize: 16, fontWeight: '600'},
  emptyBody: {
    color: '#7F8A85',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7,
    textAlign: 'center',
  },
  recordingRow: {alignItems: 'center', flexDirection: 'row', minHeight: 68},
  waveBadge: {
    alignItems: 'center',
    backgroundColor: '#172A20',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  waveGlyph: {color: '#69E39B', fontSize: 10, letterSpacing: 1},
  recordingText: {flex: 1, marginHorizontal: 12},
  recordingName: {color: '#E9EEEB', fontSize: 16, fontWeight: '600'},
  recordingMeta: {color: '#7F8A85', fontSize: 13, marginTop: 5},
  recordingSize: {color: '#98A39E', fontSize: 13},
  separator: {
    backgroundColor: '#202723',
    height: StyleSheet.hairlineWidth,
    marginLeft: 56,
  },
});
