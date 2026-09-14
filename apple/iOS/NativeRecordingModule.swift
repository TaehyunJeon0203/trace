#if canImport(React)
import Foundation
import NativeRecordingCore
import React

/// Thin React Native adapter for the Swift-owned recording lifecycle.
///
/// The generated iOS host is not checked in, so this stub exposes the complete
/// bridge shape but rejects recording commands rather than simulating audio or
/// background execution. Replace its internals with a RecordingControlling
/// actor when the host and hardware-validated AVFoundation implementation exist.
@objc(NativeRecordingModule)
final class NativeRecordingModule: NSObject, RCTBridgeModule {
    static func moduleName() -> String! { "NativeRecordingModule" }
    static func requiresMainQueueSetup() -> Bool { false }

    @objc(getSnapshot:rejecter:)
    func getSnapshot(
        resolve: RCTPromiseResolveBlock,
        reject: RCTPromiseRejectBlock
    ) {
        resolve(RecordingBridgePayload.snapshot(status: .idle, recordings: []))
    }

    @objc(startRecording:rejecter:)
    func startRecording(
        resolve: RCTPromiseResolveBlock,
        reject: RCTPromiseRejectBlock
    ) {
        reject(
            "recording_not_implemented",
            "AVFoundation recording is not implemented in this source-only scaffold.",
            nil
        )
    }

    @objc(stopRecording:rejecter:)
    func stopRecording(
        resolve: RCTPromiseResolveBlock,
        reject: RCTPromiseRejectBlock
    ) {
        reject(
            "recording_not_active",
            "There is no native recording to stop.",
            nil
        )
    }
}

/// Exact Swift-to-TypeScript payload contract consumed by
/// `parseRecordingSnapshot`:
///
/// - snapshot: `status` and `recordings`
/// - status: `state` (`idle`, `recording`, `stopping`, or `failed`), plus
///   `startedAtMs` for `recording` (milliseconds since Unix epoch) or `message`
///   for `failed`
/// - recording: `id` (UUID string), `createdAtMs` (milliseconds since Unix
///   epoch), `durationMs` (milliseconds), `byteSize` (bytes), and `fileName`
///
/// Swift `Date` and `TimeInterval` values are seconds, so all time values are
/// converted to milliseconds only at this bridge boundary.
private enum RecordingBridgePayload {
    enum Status {
        case idle
        case recording(startedAt: Date)
        case stopping
        case failed(message: String)
    }

    static func snapshot(
        status: Status,
        recordings: [RecordingArtifact]
    ) -> [String: Any] {
        [
            "status": statusPayload(status),
            "recordings": recordings.map(recordingPayload),
        ]
    }

    private static func statusPayload(_ status: Status) -> [String: Any] {
        switch status {
        case .idle:
            return ["state": "idle"]
        case let .recording(startedAt):
            return [
                "state": "recording",
                "startedAtMs": startedAt.timeIntervalSince1970 * 1_000,
            ]
        case .stopping:
            return ["state": "stopping"]
        case let .failed(message):
            return ["state": "failed", "message": message]
        }
    }

    private static func recordingPayload(_ recording: RecordingArtifact) -> [String: Any] {
        [
            "id": recording.identifier.uuidString,
            "createdAtMs": recording.createdAt.timeIntervalSince1970 * 1_000,
            "durationMs": recording.duration * 1_000,
            "byteSize": recording.byteSize,
            "fileName": recording.fileURL.lastPathComponent,
        ]
    }
}
#endif
