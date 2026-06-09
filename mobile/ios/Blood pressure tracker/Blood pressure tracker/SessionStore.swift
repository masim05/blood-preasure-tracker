// SessionStore.swift
// Blood pressure tracker
// Session storage implementations mirroring Android's InMemorySessionStore / EncryptedSessionStore

import Foundation
import Security

// MARK: - In-memory (for tests)

class InMemorySessionStore: SessionStore {
    private var current: Session?

    func save(_ session: Session) { current = session }
    func load() -> Session? { current }
    func loadError() -> String? { nil }
    func clear() { current = nil }
}

// MARK: - Keychain-backed (production)

class UserDefaultsSessionStore: SessionStore {
    private let keychainService = "com.masim05.bloodpressure.session"
    private let keychainAccount = "session_token"
    private let metadataKey = "bpt_session_metadata"
    private let defaults: UserDefaults
    private var errorMessage: String?

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    func save(_ session: Session) {
        // Save sensitive token to Keychain
        let tokenData = session.accessToken.data(using: .utf8)!
        let query = keychainItemQuery()
        let addQuery = keychainAddQuery(tokenData: tokenData)
        
        // Delete existing item first
        SecItemDelete(query as CFDictionary)
        
        // Add new item
        var status = SecItemAdd(addQuery as CFDictionary, nil)
        if status == errSecDuplicateItem {
            let update: [String: Any] = [kSecValueData as String: tokenData]
            status = SecItemUpdate(query as CFDictionary, update as CFDictionary)
        }
        
        if status == errSecSuccess {
            // Save non-sensitive metadata to UserDefaults
            let metadata: [String: Any] = [
                "tokenType": session.tokenType,
                "expiresAt": session.expiresAt,
                "userId": session.user.id,
                "userEmail": session.user.email,
            ]
            guard let data = try? JSONSerialization.data(withJSONObject: metadata) else {
                clearKeychainToken()
                errorMessage = "Failed to save session securely."
                return
            }
            defaults.set(data, forKey: metadataKey)
            guard defaults.data(forKey: metadataKey) != nil else {
                clearKeychainToken()
                errorMessage = "Failed to save session securely."
                return
            }
            errorMessage = nil
        } else {
            errorMessage = "Failed to save session securely."
        }
    }

    func load() -> Session? {
        // Load token from Keychain
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: keychainAccount,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var dataTypeRef: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &dataTypeRef)
        
        guard status == errSecSuccess,
              let tokenData = dataTypeRef as? Data,
              let accessToken = String(data: tokenData, encoding: .utf8)
        else {
            defaults.removeObject(forKey: metadataKey)
            errorMessage = nil
            return nil
        }
        
        // Load metadata from UserDefaults
        guard let data = defaults.data(forKey: metadataKey),
              let metadata = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let tokenType = metadata["tokenType"] as? String,
              let expiresAt = metadata["expiresAt"] as? String,
              let userId = metadata["userId"] as? String,
              let userEmail = metadata["userEmail"] as? String
        else {
            clearKeychainToken()
            defaults.removeObject(forKey: metadataKey)
            errorMessage = "Saved session data is invalid. Please sign in again."
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
        // Remove from Keychain
        clearKeychainToken()
        
        // Remove metadata from UserDefaults
        defaults.removeObject(forKey: metadataKey)
        errorMessage = nil
    }

    private func keychainItemQuery() -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: keychainAccount
        ]
    }

    private func keychainAddQuery(tokenData: Data) -> [String: Any] {
        var query = keychainItemQuery()
        query[kSecValueData as String] = tokenData
        return query
    }

    private func clearKeychainToken() {
        SecItemDelete(keychainItemQuery() as CFDictionary)
    }
}
