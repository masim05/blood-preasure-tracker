// ApiErrorMapper.swift
// Blood pressure tracker
// Maps raw errors to ApiError, mirroring Android's ApiErrorMapper.kt

import Foundation

enum ApiErrorMapper {
    static func fromApiBody(_ body: String?, fallback: String) -> ApiError {
        let message = body.flatMap { extractJsonString(from: $0, field: "message") }
            .flatMap { $0.isEmpty ? nil : $0 }
            ?? fallback
        let code = body.flatMap { extractJsonString(from: $0, field: "error") }
            .flatMap { $0.isEmpty ? nil : $0 }
        return ApiError(code: code, message: message, source: .api)
    }

    static func fromError(
        _ error: Error,
        networkMessage: String,
        timeoutMessage: String,
        parseMessage: String
    ) -> ApiError {
        if let urlError = error as? URLError {
            switch urlError.code {
            case .timedOut:
                return ApiError(code: nil, message: timeoutMessage, source: .timeout)
            case .cannotFindHost, .cannotConnectToHost, .networkConnectionLost,
                 .notConnectedToInternet, .dnsLookupFailed:
                return ApiError(code: nil, message: networkMessage, source: .network)
            default:
                return ApiError(code: nil, message: networkMessage, source: .network)
            }
        }
        if (error as NSError).domain == NSCocoaErrorDomain {
            return ApiError(code: nil, message: parseMessage, source: .parse)
        }
        return ApiError(code: nil, message: networkMessage, source: .network)
    }

    // MARK: - Private

    private static func extractJsonString(from body: String, field: String) -> String? {
        let escapedField = NSRegularExpression.escapedPattern(for: field)
        guard let pattern = try? NSRegularExpression(
            pattern: #"\"#  + escapedField + #""\s*:\s*"((?:\\.|[^"])*)""#
        ) else { return nil }
        let range = NSRange(body.startIndex..., in: body)
        guard let match = pattern.firstMatch(in: body, range: range),
              let valueRange = Range(match.range(at: 1), in: body) else { return nil }
        let raw = String(body[valueRange])
        return raw.replacingOccurrences(of: "\\\"", with: "\"")
    }
}
