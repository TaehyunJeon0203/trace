import {NativeModules} from 'react-native';

export type NativeRecordingStatus =
  | {state: 'idle'}
  | {state: 'recording'; startedAtMs: number}
  | {state: 'stopping'}
  | {state: 'failed'; message: string};

interface NativeRecordingModule {
  getStatus(): Promise<NativeRecordingStatus>;
}

/**
 * Typed boundary for the future Swift recorder. Starting and stopping are
 * deliberately absent until Phase 0 proves the native lifecycle.
 */
export const NativeRecording =
  NativeModules.NativeRecordingModule as NativeRecordingModule | undefined;
