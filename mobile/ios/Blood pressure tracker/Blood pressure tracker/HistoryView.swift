// HistoryView.swift
// Blood pressure tracker
// Measurement history screen mirroring Android's HistoryScreen.kt

import SwiftUI

// MARK: - History helpers (internal for tests)

func historyStatusText(isLoading: Bool, measurements: [Measurement]) -> String? {
    guard measurements.isEmpty else { return nil }
    return isLoading ? "Loading" : "No saved measurements match the selected filter."
}

func showHistoryRefreshLoadingIndicator(isLoading: Bool, measurements: [Measurement]) -> Bool {
    isLoading && !measurements.isEmpty
}

func formatHistoryTime(_ value: String) -> String {
    if value.isEmpty { return value }
    if let date = HistoryTimeFormatters.isoWithFractional.date(from: value) {
        return HistoryTimeFormatters.output.string(from: date)
    }
    if let date = HistoryTimeFormatters.fallback.date(from: value) {
        return HistoryTimeFormatters.output.string(from: date)
    }
    return value
}

private enum HistoryTimeFormatters {
    static let isoWithFractional: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    static let fallback: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm"
        return formatter
    }()

    static let output: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "MM-dd HH:mm"
        return formatter
    }()
}

func armShortLabel(_ armSide: ArmSide) -> String {
    switch armSide {
    case .left:    return "L"
    case .right:   return "R"
    case .unknown: return "—"
    }
}

// MARK: - HistoryView

struct HistoryView: View {
    @EnvironmentObject private var appState: AppState

    @State private var from: String = ""
    @State private var to: String = ""
    @State private var showFromPicker = false
    @State private var showToPicker = false

    private var filter: HistoryFilter { appState.historyFilter }
    private var measurements: [Measurement] { appState.measurements }
    private var isLoading: Bool { appState.isLoading }

    var body: some View {
        ZStack(alignment: .top) {
            AppColors.pageBackground.ignoresSafeArea()

            RefreshableScrollView(onRefresh: { appState.loadHistory() }) {
                VStack(alignment: .leading, spacing: 0) {
                    Text("Measurement history")
                        .font(.title2.bold())
                        .padding(.bottom, 12)

                    // Date range section
                    SectionLabel("DATE RANGE")
                    Spacer().frame(height: 6)
                    CardContainer {
                        HStack(spacing: 8) {
                            DateSelectorButton(
                                label: from.isEmpty ? "From date" : "From date: \(from)",
                                accessibilityId: AccessibilityIdentifiers.historyFromDate
                            ) { showFromPicker = true }

                            DateSelectorButton(
                                label: to.isEmpty ? "To date" : "To date: \(to)",
                                accessibilityId: AccessibilityIdentifiers.historyToDate
                            ) { showToPicker = true }
                        }

                        HStack(spacing: 8) {
                            Button(action: applyFilter) {
                                Text("Apply")
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                            }
                            .background(AppColors.primaryGreen)
                            .cornerRadius(8)
                            .accessibilityIdentifier(AccessibilityIdentifiers.historyApplyFilter)

                            Button(action: clearFilter) {
                                Text("Clear")
                                    .font(.system(size: 14))
                                    .foregroundColor(AppColors.secondaryText)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                            }
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(AppColors.inputBorder, lineWidth: 0.5))
                            .accessibilityIdentifier(AccessibilityIdentifiers.historyClearFilter)

                            Button(action: exportCsv) {
                                HStack(spacing: 4) {
                                    Image(systemName: "square.and.arrow.up")
                                        .font(.system(size: 12))
                                    Text("CSV")
                                        .font(.system(size: 14))
                                }
                                .foregroundColor(AppColors.blue)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                            }
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(AppColors.inputBorder, lineWidth: 0.5))
                            .disabled(measurements.isEmpty || isLoading)
                            .accessibilityIdentifier(AccessibilityIdentifiers.historyExportCsv)
                        }
                        .padding(.top, 8)
                    }

                    // Error
                    if let msg = appState.apiError?.message ?? validationErrorText() {
                        Text(msg)
                            .foregroundColor(.red)
                            .font(.system(size: 14))
                            .padding(.top, 12)
                            .accessibilityIdentifier(AccessibilityIdentifiers.historyError)
                    }

                    Spacer().frame(height: 12)
                    SectionLabel("READINGS")
                    Spacer().frame(height: 6)

                    if let statusText = historyStatusText(isLoading: isLoading, measurements: measurements) {
                        CardContainer {
                            Text(statusText)
                                .foregroundColor(AppColors.secondaryText)
                                .padding(.vertical, 10)
                        }
                    } else {
                        CardContainer {
                            HistoryTable(
                                measurements: measurements,
                                lastUploadedId: appState.lastUploadId,
                                onSelected: { appState.rowOpensDetail($0) }
                            )
                        }
                        if showHistoryRefreshLoadingIndicator(isLoading: isLoading, measurements: measurements) {
                            Text("Loading")
                                .font(.system(size: 14))
                                .padding(.top, 8)
                        }
                    }
                }
                .padding(16)
            }
            .accessibilityIdentifier(AccessibilityIdentifiers.historyRefresh)
        }
        .accessibilityIdentifier(AccessibilityIdentifiers.historyScreen)
        .sheet(isPresented: $showFromPicker) {
            DatePickerSheet(title: "Select from date", selected: $from) { showFromPicker = false }
        }
        .sheet(isPresented: $showToPicker) {
            DatePickerSheet(title: "Select to date", selected: $to) { showToPicker = false }
        }
        .onAppear {
            from = filter.from
            to = filter.to
            if measurements.isEmpty { appState.loadHistory() }
        }
        .onChange(of: filter) { _, newFilter in
            from = newFilter.from
            to = newFilter.to
        }
    }

    private func applyFilter() {
        appState.loadHistory(filter: HistoryFilter(from: from, to: to))
    }

    private func clearFilter() {
        from = ""; to = ""
        appState.clearFilter()
    }

    private func exportCsv() {
        let header = "Time,SYS,DIA,Pulse,Arm\n"
        let rows = measurements.map { m in
            "\(formatHistoryTime(m.measurementTime.isEmpty ? m.savedAt : m.measurementTime)),\(m.systolic),\(m.diastolic),\(m.pulse),\(m.armSide.rawValue)"
        }.joined(separator: "\n")
        let csv = header + rows
        let av = UIActivityViewController(activityItems: [csv], applicationActivities: nil)
        
        // Configure popover for iPad
        if UIDevice.current.userInterfaceIdiom == .pad {
            if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
               let root = scene.windows.first?.rootViewController {
                av.popoverPresentationController?.sourceView = root.view
                av.popoverPresentationController?.sourceRect = CGRect(x: root.view.bounds.midX, y: root.view.bounds.midY, width: 0, height: 0)
                av.popoverPresentationController?.permittedArrowDirections = []
            }
        }
        
        if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let root = scene.windows.first?.rootViewController {
            root.present(av, animated: true)
        }
    }

    private func validationErrorText() -> String? {
        guard let ve = appState.validationError else { return nil }
        switch ve {
        case .invalidDate:  return "Use dates in YYYY-MM-DD format."
        case .dateOrder:    return "From date must be before or equal to to date."
        default: return nil
        }
    }
}

// MARK: - History table

private struct HistoryTable: View {
    let measurements: [Measurement]
    let lastUploadedId: String?
    let onSelected: (Measurement) -> Void

    var body: some View {
        VStack(spacing: 0) {
            // Header row
            HStack(spacing: 0) {
                HistoryCell("Time",  weight: 2, header: true)
                HistoryCell("SYS",   weight: 1, header: true)
                HistoryCell("DIA",   weight: 1, header: true)
                HistoryCell("♥",     weight: 1, header: true)
                HistoryCell("Arm",   weight: 1, header: true)
            }
            .padding(.vertical, 6)
            .accessibilityIdentifier(AccessibilityIdentifiers.historyTable)

            ForEach(measurements, id: \.id) { measurement in
                Button(action: { onSelected(measurement) }) {
                    VStack(spacing: 0) {
                        HStack(spacing: 0) {
                            HistoryCell(
                                formatHistoryTime(measurement.measurementTime.isEmpty ? measurement.savedAt : measurement.measurementTime),
                                weight: 2
                            )
                            HistoryCell(
                                "\(measurement.systolic)",
                                weight: 1,
                                color: measurement.systolic >= 130 ? AppColors.elevatedRed : AppColors.normalGreen,
                                bold: true
                            )
                            HistoryCell("\(measurement.diastolic)", weight: 1, bold: true)
                            HistoryCell("\(measurement.pulse)", weight: 1)
                            HistoryCell(armShortLabel(measurement.armSide), weight: 1)
                        }
                        .frame(minHeight: 48)
                        .padding(.vertical, 8)

                        Rectangle()
                            .fill(Color(white: 0.97))
                            .frame(height: 0.5)
                    }
                }
                .accessibilityIdentifier(
                    measurement.id == lastUploadedId
                        ? AccessibilityIdentifiers.historyLastUploadedRow
                        : AccessibilityIdentifiers.historyRow
                )
            }
        }
    }
}

private struct HistoryCell: View {
    let text: String
    let weight: CGFloat
    let header: Bool
    let color: Color
    let bold: Bool

    init(_ text: String, weight: CGFloat, header: Bool = false, color: Color = AppColors.secondaryText, bold: Bool = false) {
        self.text = text
        self.weight = weight
        self.header = header
        self.color = color
        self.bold = bold
    }

    var body: some View {
        Text(text)
            .font(.system(
                size: header ? 10 : (bold ? 12 : 11),
                weight: header || bold ? .medium : .regular
            ))
            .foregroundColor(header ? AppColors.labelColor : color)
            .frame(maxWidth: .infinity, alignment: .leading)
            .layoutPriority(weight == 2 ? 1 : 0)
    }
}

private struct DateSelectorButton: View {
    let label: String
    let accessibilityId: String
    let onClick: () -> Void

    var body: some View {
        Button(action: onClick) {
            HStack(spacing: 6) {
                Image(systemName: "calendar")
                    .font(.system(size: 12))
                Text(label)
                    .font(.system(size: 13))
                Spacer(minLength: 0)
            }
            .foregroundColor(AppColors.secondaryText)
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 10)
            .padding(.vertical, 10)
        }
        .background(Color.white)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(AppColors.inputBorder, lineWidth: 0.5))
        .cornerRadius(8)
        .accessibilityIdentifier(accessibilityId)
    }
}

// MARK: - Section label

private struct SectionLabel: View {
    let text: String
    init(_ text: String) { self.text = text }

    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: .medium))
            .foregroundColor(AppColors.labelColor)
            .kerning(0.6)
    }
}

// MARK: - Card container

struct CardContainer<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 0) { content }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(AppColors.cardBorder, lineWidth: 0.5)
            )
    }
}

// MARK: - Date picker sheet

private struct DatePickerSheet: View {
    let title: String
    @Binding var selected: String
    let onDismiss: () -> Void

    @State private var pickedDate: Date = Date()

    var body: some View {
        NavigationView {
            VStack {
                DatePicker(title, selection: $pickedDate, displayedComponents: .date)
                    .datePickerStyle(.graphical)
                    .padding()
            }
            .navigationTitle(title)
            .navigationBarItems(
                leading: Button("Cancel") { onDismiss() },
                trailing: Button("OK") {
                    let df = DateFormatter()
                    df.dateFormat = "yyyy-MM-dd"
                    selected = df.string(from: pickedDate)
                    onDismiss()
                }
            )
        }
    }
}

// MARK: - Pull-to-refresh scroll view

struct RefreshableScrollView<Content: View>: View {
    let onRefresh: () -> Void
    @ViewBuilder let content: Content

    var body: some View {
        List {
            content
                .listRowSeparator(.hidden)
                .listRowBackground(Color.clear)
                .listRowInsets(EdgeInsets())
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .refreshable { onRefresh() }
    }
}

import UIKit
