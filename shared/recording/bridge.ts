import {
  parseRecordingSnapshot,
  type RecordingSnapshot,
} from './model.ts';

interface NativeRecordingModule {
  getSnapshot(): Promise<unknown>;
  startRecording(): Promise<unknown>;
  stopRecording(): Promise<unknown>;
}

export interface RecordingBridge {
  readonly isAvailable: boolean;
  getSnapshot(): Promise<RecordingSnapshot>;
  start(): Promise<RecordingSnapshot>;
  stop(): Promise<RecordingSnapshot>;
}

export function createRecordingBridge(candidate: unknown): RecordingBridge {
  const nativeModule = isNativeRecordingModule(candidate) ? candidate : undefined;

  const invoke = async (
    method: keyof NativeRecordingModule,
  ): Promise<RecordingSnapshot> => {
    if (!nativeModule) {
      throw new Error(
        'Native recording is unavailable because the iOS host is not integrated.',
      );
    }

    return parseRecordingSnapshot(await nativeModule[method]());
  };

  return {
    isAvailable: nativeModule !== undefined,
    getSnapshot: () => invoke('getSnapshot'),
    start: () => invoke('startRecording'),
    stop: () => invoke('stopRecording'),
  };
}

function isNativeRecordingModule(value: unknown): value is NativeRecordingModule {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const module = value as Readonly<Record<string, unknown>>;
  return (
    typeof module.getSnapshot === 'function' &&
    typeof module.startRecording === 'function' &&
    typeof module.stopRecording === 'function'
  );
}
