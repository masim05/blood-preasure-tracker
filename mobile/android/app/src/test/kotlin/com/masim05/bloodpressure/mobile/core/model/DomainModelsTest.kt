package com.masim05.bloodpressure.mobile.core.model

import com.masim05.bloodpressure.mobile.core.flow.Route
import com.masim05.bloodpressure.mobile.core.flow.ScreenState
import com.masim05.bloodpressure.mobile.core.validation.ValidationError
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class DomainModelsTest {
    @Test
    fun exposesEnumEntriesForRoutingDomainErrorsAndMeasurementValues() {
        assertTrue(Route.entries.contains(Route.SignIn))
        assertTrue(ArmSide.entries.contains(ArmSide.Left))
        assertTrue(ApiErrorSource.entries.contains(ApiErrorSource.Api))
        assertTrue(MeasurementStatus.entries.contains(MeasurementStatus.Saved))
        assertTrue(ValidationError.entries.contains(ValidationError.DeferredDetail))
    }

    @Test
    fun supportsSessionAndStateValueSemantics() {
        val user = MobileUser("usr_1", "user@example.com")
        val session = Session("token", "Bearer", "2026-12-31T00:00:00.000Z", user)
        val error = ApiError("code", "message", ApiErrorSource.Api)
        val measurement = Measurement("msr_1", MeasurementStatus.Saved, 120, 80, 68, ArmSide.Left, "2026-05-27T12:00:00.000Z", "2026-05-27T12:05:00.000Z")
        val filter = HistoryFilter("2026-05-01", "2026-05-31")
        val passwordInput = PasswordInput("password123")
        val row = HistoryTableRow("2026-05-27", "120", "80", "68", "left", "saved")
        val state = ScreenState(Route.History, session, error, null, listOf(measurement), filter)

        assertEquals("Bearer token", session.authorizationHeader)
        assertEquals("usr_1", user.id)
        assertEquals("user@example.com", user.email)
        assertEquals("code", error.code)
        assertEquals(ApiErrorSource.Api, error.source)
        assertEquals("msr_1", measurement.id)
        assertEquals(120, measurement.systolic)
        assertEquals(80, measurement.diastolic)
        assertEquals(68, measurement.pulse)
        assertEquals(ArmSide.Left, measurement.armSide)
        assertEquals("2026-05-27T12:00:00.000Z", measurement.measurementTime)
        assertEquals("2026-05-27T12:05:00.000Z", measurement.savedAt)
        assertEquals(1, filter.page)
        assertEquals(20, filter.pageSize)
        assertTrue(passwordInput.usesPlatformMasking)
        assertEquals("password123", passwordInput.value)
        assertEquals("2026-05-27", row.measurementTimeColumn)
        assertEquals("120", row.systolicColumn)
        assertEquals("80", row.diastolicColumn)
        assertEquals("68", row.pulseColumn)
        assertEquals("left", row.armSideColumn)
        assertEquals("saved", row.statusColumn)
        assertEquals(filter, state.filter)
        assertEquals(listOf(measurement), state.measurements)
        assertEquals(state, state.copy())
        assertNotEquals(state, state.copy(route = Route.Capture))
    }

    @Test
    fun supportsImageAndResultValueSemantics() {
        val image = MeasurementImage("uri", "image/png", 12)
        val success = AppResult.Success(image)
        val failure = AppResult.Failure(ApiError(null, "message", ApiErrorSource.Network))

        assertEquals("uri", image.uri)
        assertEquals("image/png", image.mimeType)
        assertEquals(12, image.sizeBytes)
        assertEquals(image, success.value)
        assertEquals("message", failure.error.message)
        assertTrue(success.toString().contains("MeasurementImage"))
        assertTrue(failure.toString().contains("message"))
    }
}