import Foundation

public enum RecordingState: Sendable, Equatable {
    case idle
    case recording(startedAt: Date)
    case stopping
    case failed(message: String)
}

public struct RecordingArtifact: Sendable, Equatable {
    public let identifier: UUID
    public let fileURL: URL
    public let createdAt: Date
    public let byteSize: Int64

    public init(identifier: UUID, fileURL: URL, createdAt: Date, byteSize: Int64) {
        self.identifier = identifier
        self.fileURL = fileURL
        self.createdAt = createdAt
        self.byteSize = byteSize
    }
}

/// Platform recording implementations will conform after Phase 0 hardware validation.
/// UI and bridges depend on this boundary rather than AVFoundation or WatchKit directly.
public protocol RecordingControlling: Actor {
    var state: RecordingState { get }

    func start() async throws
    func stop() async throws -> RecordingArtifact
}
