import assert from 'node:assert/strict';
import test from 'node:test';

import {planEviction, type StoredRecording} from './evictionPolicy.ts';

test('evicts oldest unprotected recordings until under the limit', () => {
  const recordings: StoredRecording[] = [
    {id: 'new', createdAtMs: 300, byteSize: 40},
    {id: 'old', createdAtMs: 100, byteSize: 30},
    {id: 'middle', createdAtMs: 200, byteSize: 50},
  ];

  assert.deepEqual(planEviction(recordings, 60), {
    evictedIds: ['old', 'middle'],
    reclaimedBytes: 80,
    remainingBytes: 40,
    fitsWithinLimit: true,
  });
});

test('preserves protected recordings and reports when the limit is impossible', () => {
  const recordings: StoredRecording[] = [
    {id: 'protected', createdAtMs: 1, byteSize: 80, protected: true},
    {id: 'disposable', createdAtMs: 2, byteSize: 10},
  ];

  assert.deepEqual(planEviction(recordings, 50), {
    evictedIds: ['disposable'],
    reclaimedBytes: 10,
    remainingBytes: 80,
    fitsWithinLimit: false,
  });
});

test('keeps input order stable when timestamps match and does not mutate input', () => {
  const recordings: StoredRecording[] = [
    {id: 'first', createdAtMs: 1, byteSize: 5},
    {id: 'second', createdAtMs: 1, byteSize: 5},
  ];
  const snapshot = structuredClone(recordings);

  assert.deepEqual(planEviction(recordings, 5).evictedIds, ['first']);
  assert.deepEqual(recordings, snapshot);
});

test('rejects invalid limits, sizes, timestamps, and duplicate identifiers', () => {
  assert.throws(() => planEviction([], -1), RangeError);
  assert.throws(
    () => planEviction([{id: 'a', createdAtMs: 1, byteSize: Number.NaN}], 1),
    TypeError,
  );
  assert.throws(
    () => planEviction([{id: 'a', createdAtMs: Infinity, byteSize: 1}], 1),
    TypeError,
  );
  assert.throws(
    () =>
      planEviction(
        [
          {id: 'same', createdAtMs: 1, byteSize: 1},
          {id: 'same', createdAtMs: 2, byteSize: 1},
        ],
        1,
      ),
    TypeError,
  );
});
