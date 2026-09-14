export type RecordingStatus =
  | {readonly state: 'idle'}
  | {readonly state: 'recording'; readonly startedAtMs: number}
  | {readonly state: 'stopping'}
  | {readonly state: 'failed'; readonly message: string};

export interface Recording {
  readonly id: string;
  readonly createdAtMs: number;
  readonly durationMs: number;
  readonly byteSize: number;
  readonly fileName: string;
}

export interface RecordingSnapshot {
  readonly status: RecordingStatus;
  readonly recordings: readonly Recording[];
}

export function parseRecordingSnapshot(value: unknown): RecordingSnapshot {
  const snapshot = requireObject(value, 'recording snapshot');
  const recordings = snapshot.recordings;

  if (!Array.isArray(recordings)) {
    throw new TypeError('recording snapshot recordings must be an array');
  }

  const parsedRecordings = recordings.map((recording, index) =>
    parseRecording(recording, index),
  );
  const seenIds = new Set<string>();
  for (const recording of parsedRecordings) {
    if (seenIds.has(recording.id)) {
      throw new TypeError(`duplicate recording id: ${recording.id}`);
    }
    seenIds.add(recording.id);
  }

  return {
    status: parseStatus(snapshot.status),
    recordings: parsedRecordings,
  };
}

export function sortRecordingsNewestFirst(
  recordings: readonly Recording[],
): readonly Recording[] {
  return recordings
    .map((recording, index) => ({recording, index}))
    .sort(
      (left, right) =>
        right.recording.createdAtMs - left.recording.createdAtMs ||
        left.index - right.index,
    )
    .map(({recording}) => recording);
}

function parseStatus(value: unknown): RecordingStatus {
  const status = requireObject(value, 'recording status');

  switch (status.state) {
    case 'idle':
      return {state: 'idle'};
    case 'recording':
      return {
        state: 'recording',
        startedAtMs: requireNonNegativeNumber(
          status.startedAtMs,
          'recording status startedAtMs',
        ),
      };
    case 'stopping':
      return {state: 'stopping'};
    case 'failed':
      return {
        state: 'failed',
        message: requireNonEmptyString(
          status.message,
          'recording status message',
        ),
      };
    default:
      throw new TypeError('recording status state is invalid');
  }
}

function parseRecording(value: unknown, index: number): Recording {
  const label = `recording at index ${index}`;
  const recording = requireObject(value, label);

  return {
    id: requireNonEmptyString(recording.id, `${label} id`),
    createdAtMs: requireNonNegativeNumber(
      recording.createdAtMs,
      `${label} createdAtMs`,
    ),
    durationMs: requireNonNegativeNumber(
      recording.durationMs,
      `${label} durationMs`,
    ),
    byteSize: requireNonNegativeNumber(recording.byteSize, `${label} byteSize`),
    fileName: requireNonEmptyString(recording.fileName, `${label} fileName`),
  };
}

function requireObject(
  value: unknown,
  label: string,
): Readonly<Record<string, unknown>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as Readonly<Record<string, unknown>>;
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}

function requireNonNegativeNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`${label} must be a non-negative finite number`);
  }
  return value;
}
