import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseRecordingSnapshot,
  sortRecordingsNewestFirst,
  type Recording,
} from './model.ts';

test('parses a valid snapshot without trusting the native payload', () => {
  assert.deepEqual(
    parseRecordingSnapshot({
      status: {state: 'recording', startedAtMs: 1_000},
      recordings: [
        {
          id: 'one',
          createdAtMs: 500,
          durationMs: 250,
          byteSize: 12,
          fileName: 'one.m4a',
        },
      ],
    }),
    {
      status: {state: 'recording', startedAtMs: 1_000},
      recordings: [
        {
          id: 'one',
          createdAtMs: 500,
          durationMs: 250,
          byteSize: 12,
          fileName: 'one.m4a',
        },
      ],
    },
  );
});

test('accepts every valid recording status payload', () => {
  const statuses = [
    {state: 'idle'},
    {state: 'recording', startedAtMs: 1_000},
    {state: 'stopping'},
    {state: 'failed', message: 'Microphone access was denied.'},
  ];

  for (const status of statuses) {
    assert.deepEqual(
      parseRecordingSnapshot({status, recordings: []}).status,
      status,
    );
  }
});

test('rejects malformed status and recording values', () => {
  assert.throws(
    () => parseRecordingSnapshot({status: {state: 'paused'}, recordings: []}),
    /state is invalid/,
  );
  assert.throws(
    () =>
      parseRecordingSnapshot({
        status: {state: 'idle'},
        recordings: [
          {
            id: 'one',
            createdAtMs: 1,
            durationMs: -1,
            byteSize: 1,
            fileName: 'one.m4a',
          },
        ],
      }),
    /durationMs/,
  );
  const recording = {
    id: 'duplicate',
    createdAtMs: 1,
    durationMs: 1,
    byteSize: 1,
    fileName: 'one.m4a',
  };
  assert.throws(
    () =>
      parseRecordingSnapshot({
        status: {state: 'idle'},
        recordings: [recording, recording],
      }),
    /duplicate recording id/,
  );
});

test('sorts newest first, keeps ties stable, and does not mutate input', () => {
  const recordings: Recording[] = [
    {id: 'old', createdAtMs: 1, durationMs: 1, byteSize: 1, fileName: 'a'},
    {id: 'new-a', createdAtMs: 2, durationMs: 1, byteSize: 1, fileName: 'b'},
    {id: 'new-b', createdAtMs: 2, durationMs: 1, byteSize: 1, fileName: 'c'},
  ];

  assert.deepEqual(
    sortRecordingsNewestFirst(recordings).map(recording => recording.id),
    ['new-a', 'new-b', 'old'],
  );
  assert.deepEqual(recordings.map(recording => recording.id), [
    'old',
    'new-a',
    'new-b',
  ]);
});
