// SessionStore.swift
// Blood pressure tracker
// Session storage implementations mirroring Android's InMemorySessionStore / EncryptedSessionStore

import Foundation

// MARK: - In-memory (for tests)

class InMemorySessionStore: SessionStore {
    private var current: Session?

    func save(_ session: Session) { current = session }
    func load() -> Session? { current }
    func loadError() -> String? { nil }
    func clear() { current = nil }
}

// MARK: - UserDefaults-backed (production)

class UserDefaultsSessionStore: SessionStore {
    private let defaults: UserDefaults
    private let key = "bpt_session"
    private var errorMessage: String?

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    func save(_ session: Session) {
        let dict: [String: Any] = [
            "accessToken": session.accessToken,
            "tokenType": session.tokenType,
            "expiresAt": session.expiresAt,
            "userId": session.user.id,
            "userEmail": session.user.email,
        ]
        if let data = try? JSONSerialization.data(withJSONObject: dict) {
            defaults.set(data, forKey: key)
            errorMessage = nil
        }
    }

    func load() -> Session? {
        guard let data = defaults.data(forKey: key),
              let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let accessToken = dict["accessToken"] as? String,
              let tokenType = dict["tokenType"] as? String,
              let expiresAt = dict["expiresAt"] as? String,
              let userId = dict["userId"] as? String,
              let userEmail = dict["userEmail"] as? String
        else {
            if defaults.data(forKey: key) != nil {
                errorMessage = "Saved session data is invalid. Please sign in again."
            }
            return nil
        }
        errorMessage = nil
        return Session(
            accessToken: accessToken,
            tokenType: tokenType,
            expiresAt: expiresAt,
            user: MobileUser(id: userId, email: userEmail)
        )
    }

    func loadError() -> String? { errorMessage }

    func clear() {
        defaults.removeObject(forKey: key)
        errorMessage = nil
    }
}
