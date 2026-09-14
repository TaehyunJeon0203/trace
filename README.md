# Trace

Trace is a greenfield scaffold for an iPhone companion app and an Apple Watch recording experience. The iPhone UI uses React Native with TypeScript. Recording is intended to remain native Swift, and the Watch UI is native SwiftUI.

> **Current status:** the first presentation/contract slice is implemented: a typed recording model and validated React Native bridge, an iPhone recording dashboard, and honest Swift module stubs. No AVFoundation audio recording, background execution, transfer, or retention deletion is implemented.

## Repository layout

```text
src/                         React Native iPhone UI and typed native boundary
shared/storage/              Pure TypeScript storage policy
apple/NativeRecordingCore/   Swift package with native recording contracts
apple/iOS/                   iOS React Native bridge source placeholder
apple/watchOS/BlackBoxWatch/ SwiftUI watch app source
```

The intended dependency direction is:

```text
React Native UI -> typed bridge -> iOS native adapter -> NativeRecordingCore
Watch SwiftUI   -> watch native adapter -------------> NativeRecordingCore
```

`RecordingControlling` isolates future AVFoundation/WatchKit code from UI code. Swift remains responsible for recording state, files, and the recordings library; React Native presents snapshots and sends start/stop intents. Native payloads are validated before entering the TypeScript domain. `planEviction` is pure, deterministic, and platform-independent; protected recordings are never selected for eviction.

## Prerequisites and setup

- macOS with Xcode and an Apple Developer account
- Node.js 22.18 or newer (for built-in TypeScript test execution)
- CocoaPods (for the generated React Native iOS host)
- Physical iPhone and Apple Watch for Phase 0

This repository intentionally does **not** contain fabricated `.xcodeproj`, CocoaPods output, or React Native template files. Generate those files with tooling compatible with the pinned React Native version, then integrate the checked-in sources:

1. Run `npm install`.
2. Use the React Native Community CLI/template to create the iOS host named `Trace`, preserving this repository's `src`, `shared`, and `apple` directories and package configuration. Alternatively, generate in a temporary directory and copy only the template-owned `ios/` files.
3. Set the iOS deployment target to **17.0**.
4. Add `apple/iOS/NativeRecordingModule.swift` to the iOS application target.
5. In Xcode, add a watchOS App target with deployment target **10.0**, then add the files in `apple/watchOS/BlackBoxWatch`.
6. Add `apple/NativeRecordingCore` as a local Swift package dependency to both native targets.
7. Configure signing, bundle identifiers, microphone usage descriptions, entitlements, and App Groups only after the Phase 0 findings determine what is needed.

After native host generation, typical commands are `npm start` and `npm run ios`. The pure policy tests can run before dependency installation on Node versions that support TypeScript type stripping:

```sh
npm test
```

## Platform limitations

- iOS/watchOS simulators do not faithfully represent microphone routes, interruption handling, lock-screen behavior, battery/thermal pressure, or Watch-to-iPhone transfer.
- watchOS background runtime is constrained and policy-sensitive; continuous recording must not be assumed viable until measured and reviewed against current Apple requirements.
- React Native cannot own the time-critical recording lifecycle. Native Swift should own sessions, files, interruptions, and recovery; JavaScript should observe state and issue validated user intents.
- The checked-in bridge reports an idle, empty snapshot and exposes start/stop methods, but deliberately rejects those commands until an AVFoundation implementation is integrated and validated. It does not simulate recording or background execution.
- Storage protection in the TypeScript policy is a product-level concept, not filesystem encryption or backup protection.

## Phase 0 hardware spikes

Run these as disposable experiments on supported physical devices before implementing recording:

1. **iPhone lifecycle:** measure audio continuity and callbacks across screen lock, app backgrounding, interruptions, route changes, incoming calls, and termination.
2. **Watch lifecycle:** test extended runtime options, wrist-down behavior, screen lock, low-power mode, interruptions, thermal state, battery drain, and maximum reliable duration.
3. **Audio format:** compare sample rates/codecs for speech quality, CPU, battery, and bytes per hour; confirm playable-file recovery after forced termination.
4. **Connectivity:** measure WatchConnectivity transfer latency and failure recovery when the phone is unavailable, locked, low on storage, or reconnecting.
5. **Storage pressure:** validate free-space checks, atomic finalization, retention limits, protected-item behavior, and cleanup after partial writes.
6. **Privacy and review:** confirm consent UX, visible recording indicators, microphone permissions, data-protection class, retention language, and current App Store/watchOS policy.

Record device models, OS versions, battery delta, duration, resulting file size, interruption timeline, and pass/fail criteria for every run. Phase 0 should produce decisions for session APIs, runtime strategy, format, transfer ownership, and recovery semantics.

## GitHub setup placeholder

No remote or CI is configured. When a repository is created:

- add branch protection and required checks;
- add CI for TypeScript tests/type checking and Swift package builds;
- keep signing certificates, provisioning profiles, API keys, and environment files out of Git;
- document bundle IDs, team ownership, release workflow, and privacy-review ownership.
