package com.masim05.bloodpressure.mobile.adapters.session

import android.content.Context
import android.content.SharedPreferences
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import com.masim05.bloodpressure.mobile.core.model.MobileUser
import com.masim05.bloodpressure.mobile.core.model.Session
import com.masim05.bloodpressure.mobile.core.ports.SessionStore
import java.nio.charset.StandardCharsets
import java.security.KeyStore
import java.security.SecureRandom
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

class EncryptedSessionStore internal constructor(
    private val keyValueStore: KeyValueStore,
    private val encryptor: SessionEncryptor,
) : SessionStore {
    private var lastError: String? = null

    override fun save(session: Session) {
        val serialized = serialize(session.copy(persistedAtEpochMillis = System.currentTimeMillis()))
        val encrypted = encryptor.encrypt(serialized)
        keyValueStore.put(SESSION_KEY, encrypted)
        lastError = null
    }

    override fun load(): Session? {
        val encrypted = keyValueStore.get(SESSION_KEY) ?: return null
        return try {
            val decrypted = encryptor.decrypt(encrypted)
            val parsed = deserialize(decrypted)
            lastError = null
            parsed
        } catch (_: Exception) {
            keyValueStore.remove(SESSION_KEY)
            lastError = LOAD_ERROR_CORRUPTED
            null
        }
    }

    override fun loadError(): String? = lastError

    override fun clear() {
        keyValueStore.remove(SESSION_KEY)
        lastError = null
    }

    companion object {
        private const val PREFS_NAME = "auth_session_store"
        private const val SESSION_KEY = "encrypted_session"
        private const val LOAD_ERROR_CORRUPTED = "corrupted"

        fun create(context: Context): EncryptedSessionStore {
            val preferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            return EncryptedSessionStore(
                keyValueStore = SharedPreferencesStore(preferences),
                encryptor = AndroidKeystoreEncryptor(),
            )
        }

        private fun serialize(session: Session): String {
            val parts = listOf(
                session.accessToken,
                session.tokenType,
                session.expiresAt,
                session.user.id,
                session.user.email,
                (session.persistedAtEpochMillis ?: 0L).toString(),
            )
            return parts.joinToString(SEPARATOR) { fieldToToken(it) }
        }

        private fun deserialize(serialized: String): Session {
            val fields = serialized
                .split(SEPARATOR, ignoreCase = false, limit = 6)
                .map(::tokenToField)
            require(fields.size == 6)

            return Session(
                accessToken = fields[0],
                tokenType = fields[1],
                expiresAt = fields[2],
                user = MobileUser(id = fields[3], email = fields[4]),
                persistedAtEpochMillis = fields[5].toLongOrNull(),
            )
        }

        private fun fieldToToken(value: String): String =
            Base64.getEncoder().withoutPadding().encodeToString(value.toByteArray(StandardCharsets.UTF_8))

        private fun tokenToField(token: String): String =
            String(Base64.getDecoder().decode(token), StandardCharsets.UTF_8)

        private const val SEPARATOR = "|"
    }
}

internal interface SessionEncryptor {
    fun encrypt(plainText: String): String
    fun decrypt(cipherText: String): String
}

internal interface KeyValueStore {
    fun get(key: String): String?
    fun put(key: String, value: String)
    fun remove(key: String)
}

private class SharedPreferencesStore(
    private val preferences: SharedPreferences,
) : KeyValueStore {
    override fun get(key: String): String? = preferences.getString(key, null)

    override fun put(key: String, value: String) {
        preferences.edit().putString(key, value).commit()
    }

    override fun remove(key: String) {
        preferences.edit().remove(key).commit()
    }
}

private class AndroidKeystoreEncryptor : SessionEncryptor {
    override fun encrypt(plainText: String): String {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateSecretKey())
        val iv = cipher.iv
        val encrypted = cipher.doFinal(plainText.toByteArray(StandardCharsets.UTF_8))
        val payload = ByteArray(iv.size + encrypted.size)
        System.arraycopy(iv, 0, payload, 0, iv.size)
        System.arraycopy(encrypted, 0, payload, iv.size, encrypted.size)
        return Base64.getEncoder().withoutPadding().encodeToString(payload)
    }

    override fun decrypt(cipherText: String): String {
        val payload = Base64.getDecoder().decode(cipherText)
        require(payload.size > IV_SIZE)

        val iv = payload.copyOfRange(0, IV_SIZE)
        val encrypted = payload.copyOfRange(IV_SIZE, payload.size)

        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.DECRYPT_MODE, getOrCreateSecretKey(), GCMParameterSpec(TAG_LENGTH_BITS, iv))
        val plain = cipher.doFinal(encrypted)
        return String(plain, StandardCharsets.UTF_8)
    }

    private fun getOrCreateSecretKey(): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
        val existing = keyStore.getKey(KEY_ALIAS, null)
        if (existing is SecretKey) {
            return existing
        }

        val keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE)
        val keySpec = KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .build()

        keyGenerator.init(keySpec)
        return keyGenerator.generateKey()
    }

    companion object {
        private const val ANDROID_KEYSTORE = "AndroidKeyStore"
        private const val KEY_ALIAS = "bp_mobile_session_key"
        private const val TRANSFORMATION = "AES/GCM/NoPadding"
        private const val IV_SIZE = 12
        private const val TAG_LENGTH_BITS = 128
    }
}
