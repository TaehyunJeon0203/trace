// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "NativeRecordingCore",
    platforms: [
        .macOS(.v13),
        .iOS(.v17),
        .watchOS(.v10),
    ],
    products: [
        .library(name: "NativeRecordingCore", targets: ["NativeRecordingCore"]),
    ],
    targets: [
        .target(name: "NativeRecordingCore")
    ]
)
