package com.masim05.bloodpressure.mobile.core.model

import com.masim05.bloodpressure.mobile.core.flow.Route
import com.masim05.bloodpressure.mobile.core.flow.ScreenState
import com.masim05.bloodpressure.mobile.core.model.AppScreen
import com.masim05.bloodpressure.mobile.core.model.AuthMode
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class DomainModelsTest {
    @Test
    fun exposesEnumEntriesForRoutingDomainErrorsAndMeasurementValues() {
        assertTrue(Route.entries.contains(Route.Auth))
        assertTrue(Route.entries.contains(Route.Camera))
        assertTrue(AppScreen.entries.contains(AppScreen.MeasurementDetail))
        assertTrue(AuthMode.entries.contains(AuthMode.NewAccount))
        assertTrue(ArmSide.entries.contains(ArmSide.Left))
        assertTrue(ApiErrorSource.entries.contains(ApiErrorSource.Api))
        assertTrue(MeasurementStatus.entries.contains(MeasurementStatus.Saved))
        assertTrue(MeasurementStatus.entries.contains(MeasurementStatus.Recognized))
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
        val detail = MeasurementDetail(
            id = "msr_1",
            status = MeasurementStatus.Recognized,
            systolic = 120,
            diastolic = 80,
            pulse = 68,
            armSide = ArmSide.Left,
            measurementTime = "2026-05-27T12:00:00.000Z",
            savedAt = null,
            imageUrl = "/api/v1/measurements/msr_1/image",
            recognitionError = null,
        )
        val cameraState = CameraScreenState(session, isUploading = true, visibleError = error, lastUploadId = "msr_1")
        val state = ScreenState(
            route = Route.History,
            session = session,
            error = error,
            measurements = listOf(measurement),
            measurementDetail = detail,
            filter = filter,
        )

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
        assertEquals("Bearer", session.tokenType)
        assertEquals("2026-12-31T00:00:00.000Z", session.expiresAt)
        assertEquals(user, session.user)
        assertEquals(1, filter.page)
        assertEquals(20, filter.pageSize)
        assertTrue(passwordInput.usesPlatformMasking)
        assertEquals("password123", passwordInput.value)
        assertEquals("/api/v1/measurements/msr_1/image", detail.imageUrl)
        assertEquals(MeasurementStatus.Recognized, detail.status)
        assertEquals(120, detail.systolic)
        assertEquals(80, detail.diastolic)
        assertEquals(68, detail.pulse)
        assertEquals(ArmSide.Left, detail.armSide)
        assertEquals("2026-05-27T12:00:00.000Z", detail.measurementTime)
        assertEquals(null, detail.savedAt)
        assertEquals(null, detail.recognitionError)
        assertEquals(MeasurementStatus.Saved, detail.copy(status = MeasurementStatus.Saved).status)
        assertTrue(detail.toString().contains("msr_1"))
        assertEquals("msr_1", cameraState.lastUploadId)
        assertEquals(session, cameraState.session)
        assertTrue(cameraState.isUploading)
        assertEquals("2026-05-27", row.measurementTimeColumn)
        assertEquals("120", row.systolicColumn)
        assertEquals("80", row.diastolicColumn)
        assertEquals("68", row.pulseColumn)
        assertEquals("left", row.armSideColumn)
        assertEquals("saved", row.statusColumn)
        assertEquals(filter, state.filter)
        assertEquals(AuthMode.Login, state.authMode)
        assertEquals(listOf(measurement), state.measurements)
        assertEquals(detail, state.measurementDetail)
        assertEquals(state, state.copy())
        assertNotEquals(state, state.copy(route = Route.Camera))
        assertNotEquals(cameraState, cameraState.copy(isUploading = false))
        assertTrue(cameraState.toString().contains("msr_1"))
        assertEquals(error, cameraState.visibleError)
        val defaultCameraState = CameraScreenState(session)
        assertEquals(session, defaultCameraState.session)
        assertEquals(false, defaultCameraState.isUploading)
        assertEquals(null, defaultCameraState.visibleError)
        assertEquals(null, defaultCameraState.lastUploadId)
        assertEquals(session, session.copy())
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