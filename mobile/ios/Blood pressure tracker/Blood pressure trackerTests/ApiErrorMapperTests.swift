// ApiErrorMapperTests.swift
// Blood pressure trackerTests
// Mirrors Android ApiErrorMapperTest.kt

import Testing
import Foundation
@testable import Blood_pressure_tracker

struct ApiErrorMapperTests {

    @Test func mapsApiMessageAndCodeFromErrorBody() {
        let error = ApiErrorMapper.fromApiBody(
            "{\"error\":\"duplicate_email\",\"message\":\"Email is already taken\"}",
            fallback: "fallback"
        )

        #expect(error.code == "duplicate_email")
        #expect(error.message == "Email is already taken")
        #expect(error.source == .api)
    }

    @Test func usesFallbackWhenApiBodyIsMalformedOrEmpty() {
        #expect(ApiErrorMapper.fromApiBody("{}", fallback: "fallback").message == "fallback")
        #expect(ApiErrorMapper.fromApiBody(nil, fallback: "fallback").message == "fallback")
        #expect(ApiErrorMapper.fromApiBody("{\"error\":\"\",\"message\":\"\"}", fallback: "fallback").message == "fallback")
    }

    @Test func unescapesApiMessagesFromJsonBodies() {
        let error = ApiErrorMapper.fromApiBody(
            "{\"error\":\"validation\",\"message\":\"Email \\\"bad\\\"\"}",
            fallback: "fallback"
        )

        #expect(error.message == "Email \"bad\"")
    }

    @Test func mapsErrorFallbacks() {
        let timeout = URLError(.timedOut)
        let network = URLError(.cannotFindHost)
        let parse = NSError(domain: NSCocoaErrorDomain, code: NSFileReadUnknownError)
        let generic = NSError(domain: "SomeOtherDomain", code: 0)

        #expect(ApiErrorMapper.fromError(timeout, networkMessage: "network", timeoutMessage: "timeout", parseMessage: "parse").source == .timeout)
        #expect(ApiErrorMapper.fromError(network, networkMessage: "network", timeoutMessage: "timeout", parseMessage: "parse").source == .network)
        #expect(ApiErrorMapper.fromError(parse, networkMessage: "network", timeoutMessage: "timeout", parseMessage: "parse").source == .parse)
        #expect(ApiErrorMapper.fromError(generic, networkMessage: "network", timeoutMessage: "timeout", parseMessage: "parse").message == "network")
    }
}
