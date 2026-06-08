// MeasurementDetailView.swift
// Blood pressure tracker
// Measurement detail screen mirroring Android's MeasurementDetailScreen.kt

import SwiftUI

// MARK: - Detail helpers (internal for tests)

func resolveMeasurementImageUrl(_ imageUrl: String, apiBaseUrl: String) -> String? {
    let trimmed = imageUrl.trimmingCharacters(in: .whitespaces)
    if trimmed.isEmpty { return nil }
    if trimmed.hasPrefix("http://") || trimmed.hasPrefix("https://") { return trimmed }
    let base = apiBaseUrl.hasSuffix("/") ? String(apiBaseUrl.dropLast()) : apiBaseUrl
    let path = trimmed.hasPrefix("/") ? trimmed : "/\(trimmed)"
    return base + path
}

func shouldShowDetailLoadingPlaceholder(_ detail: MeasurementDetail?) -> Bool {
    detail == nil
}

func showDetailRefreshLoadingIndicator(isLoading: Bool, detail: MeasurementDetail?) -> Bool {
    isLoading && detail != nil
}

// MARK: - MeasurementDetailView

struct MeasurementDetailView: View {
    @EnvironmentObject private var appState: AppState

    @State private var systolic: String = ""
    @State private var diastolic: String = ""
    @State private var pulse: String = ""
    @State private var armSide: ArmSide = .unknown

    private var detail: MeasurementDetail? { appState.measurementDetail }
    private var isLoading: Bool { appState.isLoading }

    var body: some View {
        ZStack(alignment: .top) {
            AppColors.pageBackground.ignoresSafeArea()

            if shouldShowDetailLoadingPlaceholder(detail) {
                loadingPlaceholderView
            } else {
                RefreshableScrollView(onRefresh: {
                    if let id = detail?.id { appState.loadDetail(measurementId: id) }
                }) {
                    loadedContent
                }
            }
        }
        .accessibilityIdentifier(AccessibilityIdentifiers.measurementDetailScreen)
        .onAppear {
            syncFields()
            if let id = detail?.id { appState.loadDetail(measurementId: id) }
        }
        .onChange(of: appState.measurementDetail) { _, _ in syncFields() }
    }

    // MARK: - Loading placeholder (no detail yet)

    private var loadingPlaceholderView: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Measurement detail").font(.title2.bold())
            if let msg = appState.apiError?.message {
                Text(msg).foregroundColor(.red).font(.system(size: 14))
                    .accessibilityIdentifier(AccessibilityIdentifiers.measurementDetailError)
            }
            Text("Loading").padding(.top, 16)
            Spacer().frame(height: 12)
            DetailBackButton { appState.goBack() }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Loaded content

    private var loadedContent: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Measurement detail").font(.title2.bold())

            if let msg = appState.apiError?.message {
                Text(msg).foregroundColor(.red).font(.system(size: 14))
                    .padding(.top, 12)
                    .accessibilityIdentifier(AccessibilityIdentifiers.measurementDetailError)
            }

            if showDetailRefreshLoadingIndicator(isLoading: isLoading, detail: detail) {
                Text("Loading").font(.system(size: 14)).padding(.top, 16)
            }

            if let md = detail {
                detailBody(md: md)
            }
        }
        .padding(16)
    }

    // MARK: - Detail body

    @ViewBuilder
    private func detailBody(md: MeasurementDetail) -> some View {
        Spacer().frame(height: 12)

        // Image section
        DetailSectionLabel("Captured measurement image")
        Spacer().frame(height: 6)
        DetailCardContainer {
            MeasurementImageView(
                imageUrl: md.imageUrl,
                apiBaseUrl: apiBaseUrl,
                loadImage: { url in appState.fetchMeasurementImage(imageUrl: url) }
            )
            .frame(maxWidth: .infinity)
            .frame(height: 260)
        }
        .accessibilityIdentifier(AccessibilityIdentifiers.measurementDetailImage)

        Spacer().frame(height: 12)

        // Values section
        DetailSectionLabel("Measurement detail")
        Spacer().frame(height: 6)
        DetailCardContainer {
            HStack(spacing: 8) {
                DetailNumberField("Systolic", value: $systolic, accessibilityId: AccessibilityIdentifiers.measurementDetailSystolic)
                DetailNumberField("Diastolic", value: $diastolic, accessibilityId: AccessibilityIdentifiers.measurementDetailDiastolic)
                DetailNumberField("Pulse", value: $pulse, accessibilityId: AccessibilityIdentifiers.measurementDetailPulse)
            }

            DetailArmSidePicker(selected: $armSide)
                .padding(.top, 8)

            Text("Status: \(statusLabel(md.status))")
                .font(.system(size: 14))
                .padding(.top, 8)
                .accessibilityIdentifier(
                    md.status == .saved
                        ? AccessibilityIdentifiers.measurementDetailStatusSaved
                        : "measurement_detail_status"
                )

            if let recErr = md.recognitionError, !recErr.isEmpty {
                Text("Recognition error: \(recErr)")
                    .foregroundColor(.red)
                    .font(.system(size: 14))
                    .padding(.top, 4)
            }
        }

        // Action buttons
        HStack(spacing: 8) {
            DetailBackButton { appState.goBack() }

            Button(action: { saveAction(md: md) }) {
                Text(isLoading ? "Loading" : "Save")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
            }
            .background(AppColors.primaryGreen)
            .cornerRadius(10)
            .disabled(isLoading)
            .accessibilityIdentifier(AccessibilityIdentifiers.measurementDetailSave)
        }
        .padding(.top, 8)
    }

    // MARK: - Helpers

    private func syncFields() {
        guard let md = detail else { return }
        systolic = md.systolic.map(String.init) ?? ""
        diastolic = md.diastolic.map(String.init) ?? ""
        pulse = md.pulse.map(String.init) ?? ""
        armSide = md.armSide
    }

    private func saveAction(md: MeasurementDetail) {
        appState.saveDetail(
            MeasurementDetail(
                id: md.id,
                status: md.status,
                systolic: Int(systolic) ?? md.systolic,
                diastolic: Int(diastolic) ?? md.diastolic,
                pulse: Int(pulse) ?? md.pulse,
                armSide: armSide,
                measurementTime: md.measurementTime,
                savedAt: md.savedAt,
                imageUrl: md.imageUrl,
                recognitionError: md.recognitionError
            )
        )
    }

    private func statusLabel(_ status: MeasurementStatus) -> String {
        switch status {
        case .pending:     return "pending"
        case .recognizing: return "recognizing"
        case .recognized:  return "recognized"
        case .saved:       return "saved"
        case .failed:      return "failed"
        }
    }
}

// MARK: - Measurement image view

private struct MeasurementImageView: View {
    let imageUrl: String
    let apiBaseUrl: String
    let loadImage: (String) -> AppResult<Data>

    @State private var imageData: Data? = nil
    @State private var imageError: String? = nil
    @State private var isImageLoading: Bool = false

    var body: some View {
        ZStack {
            Color(.secondarySystemBackground)

            if let data = imageData, let uiImage = UIImage(data: data) {
                Image(uiImage: uiImage)
                    .resizable()
                    .scaledToFit()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .accessibilityIdentifier(AccessibilityIdentifiers.measurementDetailImageLoaded)
            } else if isImageLoading {
                Text("Loading").font(.system(size: 14))
            } else if let err = imageError {
                Text(err).foregroundColor(.red).font(.system(size: 14))
            } else {
                Text("Original image is unavailable.").font(.system(size: 14))
            }
        }
        .onAppear { loadImageIfNeeded() }
        .onChange(of: imageUrl) { _, _ in loadImageIfNeeded() }
    }

    private func loadImageIfNeeded() {
        guard let resolved = resolveMeasurementImageUrl(imageUrl, apiBaseUrl: apiBaseUrl) else {
            imageData = nil; imageError = nil; isImageLoading = false
            return
        }
        isImageLoading = true
        imageError = nil
        Task.detached {
            let result = loadImage(resolved)
            await MainActor.run {
                isImageLoading = false
                switch result {
                case .success(let data): imageData = data
                case .failure(let err): imageError = err.message
                }
            }
        }
    }
}

// MARK: - Supporting views (private)

private struct DetailBackButton: View {
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            Text("Back")
                .font(.system(size: 14))
                .foregroundColor(AppColors.labelColor)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
        }
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(AppColors.inputBorder, lineWidth: 0.5))
        .accessibilityIdentifier(AccessibilityIdentifiers.measurementDetailBack)
    }
}

private struct DetailNumberField: View {
    let label: String
    @Binding var value: String
    let accessibilityId: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).font(.system(size: 11)).foregroundColor(AppColors.labelColor)
            TextField(label, text: $value)
                .keyboardType(.numberPad)
                .font(.system(size: 14))
                .padding(8)
                .background(Color.white)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(AppColors.inputBorder, lineWidth: 1))
        }
        .frame(maxWidth: .infinity)
        .accessibilityIdentifier(accessibilityId)
    }
}

private struct DetailArmSidePicker: View {
    @Binding var selected: ArmSide

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Arm side").font(.system(size: 11)).foregroundColor(AppColors.labelColor)
            Picker("Arm side", selection: $selected) {
                Text("left").tag(ArmSide.left)
                Text("right").tag(ArmSide.right)
                Text("unknown").tag(ArmSide.unknown)
            }
            .pickerStyle(.segmented)
        }
        .accessibilityIdentifier(AccessibilityIdentifiers.measurementDetailArmSide)
    }
}

private struct DetailSectionLabel: View {
    let text: String
    init(_ text: String) { self.text = text }

    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: .medium))
            .foregroundColor(AppColors.labelColor)
            .kerning(0.6)
    }
}

private struct DetailCardContainer<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 0) { content }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12).stroke(AppColors.cardBorder, lineWidth: 0.5)
            )
    }
}
