import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "waveform")
                .font(.title2)
                .foregroundStyle(.green)
            Text("Trace")
                .font(.headline)
            Text("Phase 0")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Trace, Phase 0")
    }
}

#Preview {
    ContentView()
}
