package com.masim05.bloodpressure.mobile

import com.masim05.bloodpressure.mobile.core.flow.ScreenState
import com.masim05.bloodpressure.mobile.core.flow.Route
import com.masim05.bloodpressure.mobile.core.model.ApiError
import com.masim05.bloodpressure.mobile.core.model.ApiErrorSource
import com.masim05.bloodpressure.mobile.core.model.ArmSide
import com.masim05.bloodpressure.mobile.core.model.Measurement
import com.masim05.bloodpressure.mobile.core.model.MeasurementDetail
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

    @Test
    fun refreshMeasurementDetailIdReturnsNullForBlankValue() {
        assertNull(refreshMeasurementDetailId("   "))
    }

    @Test
    fun refreshMeasurementDetailIdReturnsMeasurementIdWhenPresent() {
        assertEquals("msr_1", refreshMeasurementDetailId("msr_1"))
    }

    @Test
    fun refreshedHistoryMeasurementsKeepsCurrentItemsOnRefreshError() {
        val currentMeasurements = listOf(measurement("2026-05-27T12:05:00.000Z", "2026-05-27T12:05:00.000Z", ArmSide.Left))
        val state = ScreenState(
            route = Route.History,
            error = ApiError(
                code = "history_failed",
                message = "history failed",
                source = ApiErrorSource.Network,
            ),
        )

        assertEquals(currentMeasurements, refreshedHistoryMeasurements(currentMeasurements, state))
    }

    @Test
    fun refreshedMeasurementDetailKeepsCurrentDetailWhenRefreshFails() {
        val currentDetail = measurementDetail(id = "msr_current", systolic = 121)
        val state = ScreenState(
            route = Route.MeasurementDetail,
            error = ApiError(
                code = "detail_failed",
                message = "detail failed",
                source = ApiErrorSource.Network,
            ),
        )

        assertEquals(currentDetail, refreshedMeasurementDetail(currentDetail, state))
    }

    @Test
    fun topLevelMainTabMapsDetailToHistoryTab() {
        assertEquals(MainTab.History, topLevelMainTab(Route.MeasurementDetail))
    }

    @Test
    fun topLevelMainTabMapsProfileRouteToProfileTab() {
        assertEquals(MainTab.Profile, topLevelMainTab(Route.Profile))
    }

    @Test
    fun topLevelMainTabForDestinationRouteUsesDestinationWhenPresent() {
        assertEquals(
            MainTab.History,
            topLevelMainTabForDestinationRoute(
                "main/history/detail",
                Route.Profile,
            ),
        )
    }

    @Test
    fun topLevelMainTabForDestinationRouteFallsBackToUiRoute() {
        assertEquals(
            MainTab.Profile,
            topLevelMainTabForDestinationRoute(
                destinationRoute = null,
                fallbackRoute = Route.Profile,
            ),
        )
    }

    @Test
    fun topLevelMainTabForDestinationRouteMapsGuideToCaptureTab() {
        assertEquals(
            MainTab.Capture,
            topLevelMainTabForDestinationRoute(
                destinationRoute = MainDestination.Guide.route,
                fallbackRoute = Route.Profile,
            ),
        )
    }

    @Test
    fun readPreferredLanguageCodeFallsBackToSystemForUnknownCode() {
        assertEquals(SYSTEM_LANGUAGE_CODE, readPreferredLanguageCode("xx"))
    }

    @Test
    fun readPreferredLanguageCodeAcceptsSupportedCode() {
        assertEquals("fr", readPreferredLanguageCode("fr"))
    }

    @Test
    fun shouldShowPrivacyPolicyGateReturnsTrueWhenNotAccepted() {
        assertEquals(true, shouldShowPrivacyPolicyGate(false))
    }

    @Test
    fun shouldShowPrivacyPolicyGateReturnsFalseWhenAccepted() {
        assertEquals(false, shouldShowPrivacyPolicyGate(true))
    }

    @Test
    fun supportedLanguageOptionsExposeExpectedCodes() {
        assertEquals(
            listOf("system", "es", "fr", "pt", "it", "sv", "ru", "zh", "ko", "ja", "th", "vi"),
            supportedLanguageOptions.map { it.code },
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

    private fun measurementDetail(id: String, systolic: Int) = MeasurementDetail(
        id = id,
        status = MeasurementStatus.Saved,
        systolic = systolic,
        diastolic = 80,
        pulse = 68,
        armSide = ArmSide.Left,
        measurementTime = "2026-05-27T12:05:00.000Z",
        savedAt = "2026-05-27T12:05:00.000Z",
        imageUrl = "/api/v1/measurements/$id/image",
        recognitionError = null,
    )

    private class MemoryStore(private var session: Session? = null) : SessionStore {
        override fun save(session: Session) { this.session = session }
        override fun load(): Session? = session
        override fun loadError(): String? = null
        override fun clear() { session = null }
    }
}