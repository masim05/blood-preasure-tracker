package com.masim05.bloodpressure.mobile

import com.masim05.bloodpressure.mobile.core.flow.Route
import com.masim05.bloodpressure.mobile.core.model.MobileUser
import com.masim05.bloodpressure.mobile.core.model.Session
import com.masim05.bloodpressure.mobile.core.ports.SessionStore
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import java.time.Instant

class MainActivityTest {
    @Test
    fun initialRouteUsesCameraWhenSessionExists() {
        assertEquals(Route.Camera, initialRoute(session("user@example.com")))
    }

    @Test
    fun initialRouteUsesAuthWhenSessionMissing() {
        assertEquals(Route.Auth, initialRoute(null))
    }

    @Test
    fun restoredSessionKeepsUnexpiredSession() {
        val store = MemoryStore(session("user@example.com", "2026-12-31T00:00:00Z"))

        val restored = restoredSession(store, Instant.parse("2026-05-29T14:00:00Z"))

        assertEquals(Route.Camera, initialRoute(restored))
        assertEquals("user@example.com", restored?.user?.email)
    }

    @Test
    fun restoredSessionClearsExpiredSession() {
        val store = MemoryStore(session("user@example.com", "2026-05-01T00:00:00Z"))

        val restored = restoredSession(store, Instant.parse("2026-05-29T14:00:00Z"))

        assertNull(restored)
        assertNull(store.load())
        assertEquals(Route.Auth, initialRoute(restored))
    }

    private fun session(email: String, expiresAt: String = "2026-12-31T00:00:00.000Z") = Session(
        accessToken = "token",
        tokenType = "Bearer",
        expiresAt = expiresAt,
        user = MobileUser(id = "usr_1", email = email),
    )

    private class MemoryStore(private var session: Session? = null) : SessionStore {
        override fun save(session: Session) { this.session = session }
        override fun load(): Session? = session
        override fun clear() { session = null }
    }
}