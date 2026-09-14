import {NativeModules} from 'react-native';

import {createRecordingBridge} from '../../shared/recording/bridge';

export const NativeRecording = createRecordingBridge(
  NativeModules.NativeRecordingModule,
);
