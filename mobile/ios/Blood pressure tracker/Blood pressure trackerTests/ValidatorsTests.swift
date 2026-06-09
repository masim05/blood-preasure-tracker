// ValidatorsTests.swift
// Blood pressure trackerTests
// Mirrors Android ValidatorsTest.kt

import Testing
@testable import Blood_pressure_tracker

struct ValidatorsTests {

    @Test func acceptsValidEmailPasswordImageAndFilter() {
        #expect(Validators.email("user@example.com") == .valid)
        #expect(Validators.password("password123") == .valid)
        #expect(Validators.image(MeasurementImage(uri: "file://image.jpg", mimeType: "image/jpeg", sizeBytes: 1024)) == .valid)
        #expect(Validators.historyFilter(HistoryFilter(from: "2026-05-01", to: "2026-05-31")) == .valid)
    }

    @Test func rejectsInvalidEmailPasswordAndImages() {
        assertInvalid(expected: .invalidEmail, actual: Validators.email("not-email"))
        assertInvalid(expected: .invalidPassword, actual: Validators.password("short"))
        assertInvalid(expected: .invalidImage, actual: Validators.image(MeasurementImage(uri: "file://image.gif", mimeType: "image/gif", sizeBytes: 1024)))
        assertInvalid(expected: .invalidImage, actual: Validators.image(MeasurementImage(uri: "file://empty.jpg", mimeType: "image/jpeg", sizeBytes: 0)))
        assertInvalid(expected: .invalidImage, actual: Validators.image(MeasurementImage(uri: "file://large.jpg", mimeType: "image/jpeg", sizeBytes: 10_485_761)))
    }

    @Test func rejectsInvalidHistoryDates() {
        assertInvalid(expected: .invalidDate, actual: Validators.historyFilter(HistoryFilter(from: "2026/05/01", to: "")))
        assertInvalid(expected: .invalidDate, actual: Validators.historyFilter(HistoryFilter(from: "", to: "2026/05/31")))
        assertInvalid(expected: .dateOrder, actual: Validators.historyFilter(HistoryFilter(from: "2026-05-31", to: "2026-05-01")))
    }

    private func assertInvalid(expected: ValidationError, actual: ValidationResult) {
        if case .invalid(let reason) = actual {
            #expect(reason == expected)
        } else {
            Issue.record("Expected .invalid(\(expected)) but got .valid")
        }
    }
}
