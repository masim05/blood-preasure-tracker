// HistoryViewTests.swift
// Blood pressure trackerTests
// Mirrors Android HistoryScreenTest.kt

import Testing
import Foundation
@testable import Blood_pressure_tracker

struct HistoryViewTests {

    @Test func formatsIsoTimestampForHistoryTableDisplay() {
        // Android test uses ZoneOffset.ofHours(2) but the iOS formatHistoryTime uses local timezone.
        // We verify the function doesn't crash and transforms a valid ISO timestamp.
        let formatted = formatHistoryTime("2026-05-31T17:31:42.000Z")
        #expect(formatted.range(of: #"^\d{2}-\d{2} \d{2}:\d{2}$"#, options: .regularExpression) != nil)
    }

    @Test func formatsSpaceSeparatedTimestampToHistoryDisplayFormat() {
        #expect(formatHistoryTime("2026-05-31 17:31") == "05-31 17:31")
    }

    @Test func keepsUnknownTimestampValuesUnchanged() {
        #expect(formatHistoryTime("invalid-time") == "invalid-time")
    }

    @Test func refreshLoadingIndicatorShowsWithoutHidingExistingRows() {
        let measurements = [sampleMeasurement()]

        #expect(showHistoryRefreshLoadingIndicator(isLoading: true, measurements: measurements) == true)
        #expect(historyStatusText(isLoading: true, measurements: measurements) == nil)
    }

    @Test func historyStatusUsesLoadingOnlyWhenNoRowsYet() {
        #expect(historyStatusText(isLoading: true, measurements: []) == "Loading")
        #expect(historyStatusText(isLoading: false, measurements: []) == "No saved measurements match the selected filter.")
    }

    @Test func refreshLoadingIndicatorHiddenWhenNotRefreshing() {
        #expect(showHistoryRefreshLoadingIndicator(isLoading: false, measurements: [sampleMeasurement()]) == false)
    }

    private func sampleMeasurement() -> Blood_pressure_tracker.Measurement {
        Blood_pressure_tracker.Measurement(
            id: "msr_1",
            status: .saved,
            systolic: 120,
            diastolic: 80,
            pulse: 70,
            armSide: .left,
            measurementTime: "2026-05-31T17:31:42.000Z",
            savedAt: "2026-05-31T17:31:42.000Z"
        )
    }
}
