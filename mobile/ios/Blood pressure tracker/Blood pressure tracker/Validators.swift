// Validators.swift
// Blood pressure tracker
// Input validation mirroring Android's Validators.kt

import Foundation

// MARK: - Validation types

enum ValidationResult: Equatable {
    case valid
    case invalid(ValidationError)
}

enum ValidationError: Equatable {
    case invalidEmail
    case invalidPassword
    case invalidImage
    case invalidDate
    case dateOrder
}

// MARK: - Validators

enum Validators {
    private static let emailPattern: NSRegularExpression = {
        try! NSRegularExpression(pattern: #"^[^@\s]+@[^@\s]+\.[^@\s]+$"#)
    }()

    private static let datePattern: NSRegularExpression = {
        try! NSRegularExpression(pattern: #"^\d{4}-\d{2}-\d{2}$"#)
    }()

    static func email(_ value: String) -> ValidationResult {
        let trimmed = value.trimmingCharacters(in: .whitespaces)
        let range = NSRange(trimmed.startIndex..., in: trimmed)
        return emailPattern.firstMatch(in: trimmed, range: range) != nil
            ? .valid
            : .invalid(.invalidEmail)
    }

    static func password(_ value: String) -> ValidationResult {
        value.count >= 8 ? .valid : .invalid(.invalidPassword)
    }

    static func image(_ image: MeasurementImage) -> ValidationResult {
        let validMimeTypes: Set<String> = ["image/jpeg", "image/png"]
        if image.sizeBytes >= 1 && image.sizeBytes <= 10_485_760 && validMimeTypes.contains(image.mimeType) {
            return .valid
        }
        return .invalid(.invalidImage)
    }

    static func historyFilter(_ filter: HistoryFilter) -> ValidationResult {
        if !filter.from.isEmpty {
            let range = NSRange(filter.from.startIndex..., in: filter.from)
            if datePattern.firstMatch(in: filter.from, range: range) == nil {
                return .invalid(.invalidDate)
            }
        }
        if !filter.to.isEmpty {
            let range = NSRange(filter.to.startIndex..., in: filter.to)
            if datePattern.firstMatch(in: filter.to, range: range) == nil {
                return .invalid(.invalidDate)
            }
        }
        if !filter.from.isEmpty && !filter.to.isEmpty && filter.from > filter.to {
            return .invalid(.dateOrder)
        }
        return .valid
    }
}
