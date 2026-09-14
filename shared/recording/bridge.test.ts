import assert from 'node:assert/strict';
import test from 'node:test';

import {createRecordingBridge} from './bridge.ts';

test('maps each native method to a validated snapshot', async () => {
  const calls: string[] = [];
  const snapshot = {status: {state: 'idle'}, recordings: []};
  const bridge = createRecordingBridge({
    async getSnapshot(): Promise<unknown> {
      calls.push('getSnapshot');
      return snapshot;
    },
    async startRecording(): Promise<unknown> {
      calls.push('startRecording');
      return {status: {state: 'recording', startedAtMs: 1_000}, recordings: []};
    },
    async stopRecording(): Promise<unknown> {
      calls.push('stopRecording');
      return snapshot;
    },
  });

  assert.equal(bridge.isAvailable, true);
  assert.deepEqual(await bridge.getSnapshot(), snapshot);
  assert.deepEqual((await bridge.start()).status, {
    state: 'recording',
    startedAtMs: 1_000,
  });
  assert.deepEqual(await bridge.stop(), snapshot);
  assert.deepEqual(calls, ['getSnapshot', 'startRecording', 'stopRecording']);
});

test('rejects unavailable and malformed native modules', async () => {
  const unavailable = createRecordingBridge(undefined);
  const incomplete = createRecordingBridge({getSnapshot: async () => ({})});

  assert.equal(unavailable.isAvailable, false);
  assert.equal(incomplete.isAvailable, false);
  await assert.rejects(unavailable.getSnapshot(), /host is not integrated/);
  await assert.rejects(incomplete.start(), /host is not integrated/);
});

test('rejects an invalid native payload', async () => {
  const invalidBridge = createRecordingBridge({
    getSnapshot: async () => ({status: {state: 'paused'}, recordings: []}),
    startRecording: async () => ({}),
    stopRecording: async () => ({}),
  });

  await assert.rejects(invalidBridge.getSnapshot(), /state is invalid/);
});
