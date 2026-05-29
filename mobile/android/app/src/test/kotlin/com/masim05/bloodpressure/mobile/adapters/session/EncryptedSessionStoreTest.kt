package com.masim05.bloodpressure.mobile.adapters.session

import com.masim05.bloodpressure.mobile.core.model.MobileUser
import com.masim05.bloodpressure.mobile.core.model.Session
import java.security.GeneralSecurityException
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class EncryptedSessionStoreTest {
    @Test
    fun storesLoadsAndClearsSessionUsingEncryptedPayload() {
        val backend = InMemoryKeyValueStore()
        val store = EncryptedSessionStore(backend, ReverseEncryptor())
        val session = session("user@example.com")

        store.save(session)

        val encryptedPayload = backend.get("encrypted_session")
        assertNotNull(encryptedPayload)
        assertEquals(null, store.loadError())

        val restored = store.load()
        assertEquals("user@example.com", restored?.user?.email)
        assertEquals("Bearer token", restored?.authorizationHeader)

        store.clear()

        assertNull(store.load())
        assertNull(store.loadError())
    }

    @Test
    fun clearsCorruptedPayloadAndExposesLoadError() {
        val backend = InMemoryKeyValueStore().apply { put("encrypted_session", "corrupted") }
        val store = EncryptedSessionStore(backend, ReverseEncryptor())

        assertNull(store.load())
        assertEquals("corrupted", store.loadError())
        assertNull(backend.get("encrypted_session"))
    }

    @Test
    fun clearsLoadErrorAfterSuccessfulSave() {
        val backend = InMemoryKeyValueStore().apply { put("encrypted_session", "corrupted") }
        val store = EncryptedSessionStore(backend, ReverseEncryptor())

        assertNull(store.load())
        assertEquals("corrupted", store.loadError())

        store.save(session("recovered@example.com"))

        assertEquals(null, store.loadError())
        assertEquals("recovered@example.com", store.load()?.user?.email)
    }

    @Test
    fun clearsCorruptedPayloadWhenDecryptThrowsCheckedException() {
        val backend = InMemoryKeyValueStore().apply { put("encrypted_session", "ciphertext") }
        val store = EncryptedSessionStore(backend, CheckedFailureEncryptor())

        assertNull(store.load())
        assertEquals("corrupted", store.loadError())
        assertNull(backend.get("encrypted_session"))
    }

    private class ReverseEncryptor : SessionEncryptor {
        override fun encrypt(plainText: String): String = plainText.reversed()
        override fun decrypt(cipherText: String): String {
            require(cipherText != "corrupted")
            return cipherText.reversed()
        }
    }

    private class CheckedFailureEncryptor : SessionEncryptor {
        override fun encrypt(plainText: String): String = plainText

        override fun decrypt(cipherText: String): String {
            throw GeneralSecurityException("decrypt failed")
        }
    }

    private class InMemoryKeyValueStore : KeyValueStore {
        private val values = mutableMapOf<String, String>()

        override fun get(key: String): String? = values[key]

        override fun put(key: String, value: String) {
            values[key] = value
        }

        override fun remove(key: String) {
            values.remove(key)
        }
    }

    companion object {
        private fun session(email: String) = Session(
            accessToken = "token",
            tokenType = "Bearer",
            expiresAt = "2026-12-31T00:00:00.000Z",
            user = MobileUser(id = "usr_1", email = email),
        )
    }
}
