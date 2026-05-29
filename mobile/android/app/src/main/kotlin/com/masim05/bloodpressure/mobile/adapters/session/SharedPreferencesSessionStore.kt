package com.masim05.bloodpressure.mobile.adapters.session

import android.content.Context
import com.masim05.bloodpressure.mobile.core.model.MobileUser
import com.masim05.bloodpressure.mobile.core.model.Session
import com.masim05.bloodpressure.mobile.core.ports.SessionStore

class SharedPreferencesSessionStore(context: Context) : SessionStore {
    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    override fun save(session: Session) {
        prefs.edit()
            .putString(KEY_ACCESS_TOKEN, session.accessToken)
            .putString(KEY_TOKEN_TYPE, session.tokenType)
            .putString(KEY_EXPIRES_AT, session.expiresAt)
            .putString(KEY_USER_ID, session.user.id)
            .putString(KEY_USER_EMAIL, session.user.email)
            .apply()
    }

    override fun load(): Session? {
        val accessToken = prefs.getString(KEY_ACCESS_TOKEN, null) ?: return null
        val tokenType = prefs.getString(KEY_TOKEN_TYPE, null) ?: return null
        val expiresAt = prefs.getString(KEY_EXPIRES_AT, null) ?: return null
        val userId = prefs.getString(KEY_USER_ID, null) ?: return null
        val userEmail = prefs.getString(KEY_USER_EMAIL, null) ?: return null
        return Session(
            accessToken = accessToken,
            tokenType = tokenType,
            expiresAt = expiresAt,
            user = MobileUser(id = userId, email = userEmail),
        )
    }

    override fun loadError(): String? = null

    override fun clear() {
        prefs.edit().clear().apply()
    }

    private companion object {
        const val PREFS_NAME = "session_store"
        const val KEY_ACCESS_TOKEN = "access_token"
        const val KEY_TOKEN_TYPE = "token_type"
        const val KEY_EXPIRES_AT = "expires_at"
        const val KEY_USER_ID = "user_id"
        const val KEY_USER_EMAIL = "user_email"
    }
}
