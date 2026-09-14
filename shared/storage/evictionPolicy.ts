export interface StoredRecording {
  readonly id: string;
  readonly createdAtMs: number;
  readonly byteSize: number;
  readonly protected?: boolean;
}

export interface EvictionPlan {
  readonly evictedIds: readonly string[];
  readonly reclaimedBytes: number;
  readonly remainingBytes: number;
  readonly fitsWithinLimit: boolean;
}

/**
 * Selects oldest unprotected recordings until total storage fits maxBytes.
 * The function is deterministic and never mutates its input.
 */
export function planEviction(
  recordings: readonly StoredRecording[],
  maxBytes: number,
): EvictionPlan {
  assertNonNegativeFinite(maxBytes, 'maxBytes');

  const seenIds = new Set<string>();
  let totalBytes = 0;

  for (const recording of recordings) {
    if (!recording.id) {
      throw new TypeError('recording id must not be empty');
    }
    if (seenIds.has(recording.id)) {
      throw new TypeError(`duplicate recording id: ${recording.id}`);
    }
    seenIds.add(recording.id);
    assertNonNegativeFinite(recording.byteSize, `byteSize for ${recording.id}`);
    assertFinite(recording.createdAtMs, `createdAtMs for ${recording.id}`);
    totalBytes += recording.byteSize;
  }

  const candidates = recordings
    .filter(recording => !recording.protected)
    .map((recording, index) => ({recording, index}))
    .sort(
      (left, right) =>
        left.recording.createdAtMs - right.recording.createdAtMs ||
        left.index - right.index,
    );

  const evictedIds: string[] = [];
  let remainingBytes = totalBytes;

  for (const {recording} of candidates) {
    if (remainingBytes <= maxBytes) {
      break;
    }
    evictedIds.push(recording.id);
    remainingBytes -= recording.byteSize;
  }

  return {
    evictedIds,
    reclaimedBytes: totalBytes - remainingBytes,
    remainingBytes,
    fitsWithinLimit: remainingBytes <= maxBytes,
  };
}

function assertNonNegativeFinite(value: number, label: string): void {
  assertFinite(value, label);
  if (value < 0) {
    throw new RangeError(`${label} must be non-negative`);
  }
}

function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${label} must be finite`);
  }
}
