// SessionStoreTests.swift
// Blood pressure trackerTests
// Mirrors Android InMemorySessionStoreTest.kt

import Testing
@testable import Blood_pressure_tracker

struct SessionStoreTests {

    @Test func storesLoadsAndClearsSession() {
        let store = InMemorySessionStore()
        #expect(store.load() == nil)
        #expect(store.loadError() == nil)

        let session = Session(
            accessToken: "token",
            tokenType: "Bearer",
            expiresAt: "2026-12-31T00:00:00.000Z",
            user: MobileUser(id: "usr_1", email: "user@example.com")
        )
        store.save(session)

        #expect(store.load() == session)

        store.clear()

        #expect(store.load() == nil)
        #expect(store.loadError() == nil)
    }
}
