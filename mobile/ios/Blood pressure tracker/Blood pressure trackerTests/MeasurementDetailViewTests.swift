// MeasurementDetailViewTests.swift
// Blood pressure trackerTests
// Mirrors Android MeasurementDetailScreenTest.kt

import Testing
@testable import Blood_pressure_tracker

struct MeasurementDetailViewTests {

    @Test func resolvesBlankImageUrlAsUnavailable() {
        #expect(resolveMeasurementImageUrl("   ", apiBaseUrl: "http://10.0.2.2:3000") == nil)
    }

    @Test func keepsAbsoluteImageUrlUnchanged() {
        #expect(
            resolveMeasurementImageUrl("https://cdn.example.com/image.jpg", apiBaseUrl: "http://10.0.2.2:3000")
            == "https://cdn.example.com/image.jpg"
        )
    }

    @Test func resolvesRelativeImageUrlAgainstApiBaseUrl() {
        #expect(
            resolveMeasurementImageUrl("/api/v1/measurements/msr_1/image", apiBaseUrl: "http://10.0.2.2:3000/")
            == "http://10.0.2.2:3000/api/v1/measurements/msr_1/image"
        )
    }

    @Test func refreshKeepsEditableDetailVisibleWhileLoading() {
        let detail = sampleDetail()

        #expect(shouldShowDetailLoadingPlaceholder(detail) == false)
        #expect(showDetailRefreshLoadingIndicator(isLoading: true, detail: detail) == true)
    }

    @Test func showsPlaceholderWhenDetailMissing() {
        #expect(shouldShowDetailLoadingPlaceholder(nil) == true)
        #expect(showDetailRefreshLoadingIndicator(isLoading: true, detail: nil) == false)
    }

    private func sampleDetail() -> MeasurementDetail {
        MeasurementDetail(
            id: "msr_1",
            status: .saved,
            systolic: 120,
            diastolic: 80,
            pulse: 68,
            armSide: .left,
            measurementTime: "2026-05-28T08:10:00.000Z",
            savedAt: "2026-05-28T08:10:00.000Z",
            imageUrl: "/api/v1/measurements/msr_1/image",
            recognitionError: nil
        )
    }
}
