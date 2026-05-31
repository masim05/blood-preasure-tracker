package com.masim05.bloodpressure.mobile

import com.masim05.bloodpressure.mobile.core.flow.Route
import com.masim05.bloodpressure.mobile.core.model.ArmSide
import com.masim05.bloodpressure.mobile.core.model.Measurement
import com.masim05.bloodpressure.mobile.core.model.MeasurementStatus
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

    @Test
    fun measurementsToCsvReturnsHeaderWhenNoRows() {
        assertEquals("time,systolic,diastolic,pulse,arm", measurementsToCsv(emptyList()))
    }

    @Test
    fun measurementsToCsvExportsWithoutStatusAndEscapesValues() {
        val csv = measurementsToCsv(
            listOf(
                measurement(
                    measurementTime = "",
                    savedAt = "2026-05-27T12:05:00.000Z",
                    armSide = ArmSide.Left,
                ),
                measurement(
                    measurementTime = "2026-05-28, \"morning\"",
                    savedAt = "2026-05-28T08:10:00.000Z",
                    armSide = ArmSide.Unknown,
                ),
            ),
        )

        assertEquals(
            "time,systolic,diastolic,pulse,arm\n" +
                "2026-05-27T12:05:00.000Z,120,80,68,left\n" +
                "\"2026-05-28, \"\"morning\"\"\",120,80,68,unknown",
            csv,
        )
    }

    private fun session(email: String, expiresAt: String = "2026-12-31T00:00:00.000Z") = Session(
        accessToken = "token",
        tokenType = "Bearer",
        expiresAt = expiresAt,
        user = MobileUser(id = "usr_1", email = email),
    )

    private fun measurement(
        measurementTime: String,
        savedAt: String,
        armSide: ArmSide,
    ) = Measurement(
        id = "msr_1",
        status = MeasurementStatus.Saved,
        systolic = 120,
        diastolic = 80,
        pulse = 68,
        armSide = armSide,
        measurementTime = measurementTime,
        savedAt = savedAt,
    )

    private class MemoryStore(private var session: Session? = null) : SessionStore {
        override fun save(session: Session) { this.session = session }
        override fun load(): Session? = session
        override fun loadError(): String? = null
        override fun clear() { session = null }
    }
}