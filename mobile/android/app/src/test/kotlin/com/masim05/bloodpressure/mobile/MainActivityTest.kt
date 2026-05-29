package com.masim05.bloodpressure.mobile

import com.masim05.bloodpressure.mobile.core.flow.Route
import com.masim05.bloodpressure.mobile.core.model.MobileUser
import com.masim05.bloodpressure.mobile.core.model.Session
import org.junit.Assert.assertEquals
import org.junit.Test

class MainActivityTest {
    @Test
    fun initialRouteUsesCameraWhenSessionExists() {
        assertEquals(Route.Camera, initialRoute(session("user@example.com")))
    }

    @Test
    fun initialRouteUsesAuthWhenSessionMissing() {
        assertEquals(Route.Auth, initialRoute(null))
    }

    private fun session(email: String) = Session(
        accessToken = "token",
        tokenType = "Bearer",
        expiresAt = "2026-12-31T00:00:00.000Z",
        user = MobileUser(id = "usr_1", email = email),
    )
}