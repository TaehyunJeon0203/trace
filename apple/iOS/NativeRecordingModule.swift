#if canImport(React)
import Foundation
import React

/// React Native bridge placeholder. Recording commands intentionally remain
/// unavailable until the hardware spikes establish a safe lifecycle.
@objc(NativeRecordingModule)
final class NativeRecordingModule: NSObject, RCTBridgeModule {
    static func moduleName() -> String! { "NativeRecordingModule" }
    static func requiresMainQueueSetup() -> Bool { false }

    @objc(getStatus:rejecter:)
    func getStatus(
        resolve: RCTPromiseResolveBlock,
        reject: RCTPromiseRejectBlock
    ) {
        resolve(["state": "idle"])
    }
}
#endif
