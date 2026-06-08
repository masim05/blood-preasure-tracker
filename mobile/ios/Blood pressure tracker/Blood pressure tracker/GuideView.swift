// GuideView.swift
// Blood pressure tracker
// Measurement guide screen mirroring Android's GuideScreen.kt

import SwiftUI

// MARK: - Guide example model

struct GuideExamplePanel: Equatable {
    let isGood: Bool
    let systemImageName: String
}

func guideExamplePanels() -> [GuideExamplePanel] {
    [
        GuideExamplePanel(isGood: true,  systemImageName: "photo"),
        GuideExamplePanel(isGood: true,  systemImageName: "photo.fill"),
        GuideExamplePanel(isGood: false, systemImageName: "photo.on.rectangle"),
        GuideExamplePanel(isGood: false, systemImageName: "photo.on.rectangle.angled"),
    ]
}

// MARK: - GuideView

struct GuideView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                Spacer().frame(height: 8)

                Text("Measurement guide")
                    .font(.title2.bold())
                    .frame(maxWidth: .infinity, alignment: .center)

                Text("Take a clear photo showing the entire blood pressure monitor display and the arm on which the measurement was taken.")
                    .font(.body)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)

                GuideExampleCollage(examples: guideExamplePanels())
                    .frame(maxWidth: .infinity)

                Button(action: { appState.continueToCamera() }) {
                    Text("Next")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                }
                .background(AppColors.primaryGreen)
                .cornerRadius(10)
                .accessibilityIdentifier(AccessibilityIdentifiers.guideContinue)

                Spacer().frame(height: 8)
            }
            .padding(24)
        }
        .accessibilityIdentifier(AccessibilityIdentifiers.guideScreen)
        .background(Color(.systemBackground))
    }
}

// MARK: - Example collage

private struct GuideExampleCollage: View {
    let examples: [GuideExamplePanel]

    var body: some View {
        VStack(spacing: 12) {
            ForEach(Array(stride(from: 0, to: examples.count, by: 2)), id: \.self) { idx in
                HStack(spacing: 12) {
                    GuideExampleCard(example: examples[idx])
                    if idx + 1 < examples.count {
                        GuideExampleCard(example: examples[idx + 1])
                    }
                }
            }
        }
    }
}

// MARK: - Example card

private struct GuideExampleCard: View {
    let example: GuideExamplePanel

    private var borderColor: Color { example.isGood ? Color.green.opacity(0.4) : Color.red.opacity(0.4) }
    private var badgeColor: Color  { example.isGood ? AppColors.primaryGreen : AppColors.elevatedRed }
    private var badgeIcon: String  { example.isGood ? "checkmark.circle.fill" : "xmark.circle.fill" }
    private var badgeLabel: String { example.isGood ? "Good example" : "Bad example" }

    var body: some View {
        ZStack(alignment: .topTrailing) {
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(.secondarySystemBackground))
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(borderColor, lineWidth: 2)
                )

            Image(systemName: example.systemImageName)
                .font(.system(size: 48))
                .foregroundColor(Color(.tertiaryLabel))
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding(16)

            Image(systemName: badgeIcon)
                .font(.system(size: 28))
                .foregroundColor(badgeColor)
                .padding(10)
                .accessibilityLabel(badgeLabel)
        }
        .aspectRatio(1, contentMode: .fit)
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }
}
