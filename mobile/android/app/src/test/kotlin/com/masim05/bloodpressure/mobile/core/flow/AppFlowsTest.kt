package com.masim05.bloodpressure.mobile.core.flow

import com.masim05.bloodpressure.mobile.core.model.ApiError
import com.masim05.bloodpressure.mobile.core.model.ApiErrorSource
import com.masim05.bloodpressure.mobile.core.model.AppResult
import com.masim05.bloodpressure.mobile.core.model.ArmSide
import com.masim05.bloodpressure.mobile.core.model.HistoryFilter
import com.masim05.bloodpressure.mobile.core.model.Measurement
import com.masim05.bloodpressure.mobile.core.model.MeasurementImage
import com.masim05.bloodpressure.mobile.core.model.MeasurementStatus
import com.masim05.bloodpressure.mobile.core.model.MobileUser
import com.masim05.bloodpressure.mobile.core.model.Session
import com.masim05.bloodpressure.mobile.core.ports.AuthGateway
import com.masim05.bloodpressure.mobile.core.ports.CameraGateway
import com.masim05.bloodpressure.mobile.core.ports.HistoryGateway
import com.masim05.bloodpressure.mobile.core.ports.MeasurementUploadGateway
import com.masim05.bloodpressure.mobile.core.ports.SessionStore
import com.masim05.bloodpressure.mobile.core.validation.ValidationError
import com.masim05.bloodpressure.mobile.core.validation.ValidationResult
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class AppFlowsTest {
    @Test
    fun signInStoresSessionAndRoutesToGuide() {
        val store = MemoryStore()
        val flow = AuthFlow(AuthSuccess(), store)

        val state = flow.signIn("new@example.com", "password123")

        assertEquals(Route.Guide, state.route)
        assertNotNull(store.load())
        assertEquals("Bearer token", store.load()?.authorizationHeader)
    }

    @Test
    fun loginStoresSessionAndRoutesToMeasurementActions() {
        val state = AuthFlow(AuthSuccess(), MemoryStore()).logIn("known@example.com", "password123")

        assertEquals(Route.MeasurementActions, state.route)
        assertEquals("known@example.com", state.session?.user?.email)
    }

    @Test
    fun authValidationAndApiErrorsRemainVisibleOnCurrentScreen() {
        val invalid = AuthFlow(AuthSuccess(), MemoryStore()).signIn("bad", "password123")
        assertEquals(ValidationError.InvalidEmail, invalid.validationError)

        val invalidPassword = AuthFlow(AuthSuccess(), MemoryStore()).logIn("user@example.com", "short")
        assertEquals(ValidationError.InvalidPassword, invalidPassword.validationError)

        val failed = AuthFlow(AuthFailure(), MemoryStore()).logIn("user@example.com", "password123")
        assertEquals(Route.SignIn, failed.route)
        assertEquals("api message", failed.error?.message)
    }

    @Test
    fun guideAndActionsRequireSession() {
        val store = MemoryStore()
        assertEquals(Route.SignIn, GuideFlow(store).enterGuide().route)
        assertEquals(Route.SignIn, GuideFlow(store).continueToActions().route)
        assertEquals(Route.SignIn, MeasurementActionFlow(store).enter().route)
        assertEquals(Route.SignIn, MeasurementActionFlow(store).capture().route)
        assertEquals(Route.SignIn, MeasurementActionFlow(store).history().route)

        store.save(session("user@example.com"))

        assertNotNull(GuideFlow(store).enterGuide().session)
        assertEquals(Route.MeasurementActions, GuideFlow(store).continueToActions().route)
        assertNotNull(MeasurementActionFlow(store).enter().session)
        assertEquals(Route.Capture, MeasurementActionFlow(store).capture().route)
        assertEquals(Route.History, MeasurementActionFlow(store).history().route)
    }

    @Test
    fun captureValidatesImageAndShowsUploadErrors() {
        val store = MemoryStore().apply { save(session("user@example.com")) }

        val invalid = CaptureFlow(store, CameraSuccess(MeasurementImage("uri", "image/gif", 1)), UploadSuccess()).captureAndUpload()
        assertEquals(ValidationError.InvalidImage, invalid.validationError)

        val uploadFailure = CaptureFlow(store, CameraSuccess(MeasurementImage("uri", "image/png", 1)), UploadFailure()).captureAndUpload()
        assertEquals("api message", uploadFailure.error?.message)

        val success = CaptureFlow(store, CameraSuccess(MeasurementImage("uri", "image/png", 1)), UploadSuccess()).captureAndUpload()
        assertEquals(Route.MeasurementActions, success.route)
    }

    @Test
    fun captureShowsCameraErrorsAndRequiresSession() {
        val noSession = CaptureFlow(MemoryStore(), CameraFailure(), UploadSuccess()).captureAndUpload()
        assertEquals(Route.SignIn, noSession.route)

        val store = MemoryStore().apply { save(session("user@example.com")) }
        val cameraFailure = CaptureFlow(store, CameraFailure(), UploadSuccess()).captureAndUpload()
        assertEquals("api message", cameraFailure.error?.message)
    }

    @Test
    fun historyLoadsFiltersRejectsInvalidDatesAndDefersRows() {
        val store = MemoryStore().apply { save(session("user@example.com")) }
        val flow = HistoryFlow(store, HistorySuccess())

        val loaded = flow.load(HistoryFilter("2026-05-01", "2026-05-31"))
        assertEquals(Route.History, loaded.route)
        assertEquals(1, loaded.measurements.size)
        assertEquals("2026-05-01", loaded.filter.from)

        val invalid = flow.load(HistoryFilter("2026-05-31", "2026-05-01"))
        assertEquals(ValidationError.DateOrder, invalid.validationError)

        assertTrue(flow.rowOpensDetail() is ValidationResult.Invalid)
    }

    @Test
    fun historyRequiresSessionAndDisplaysApiErrors() {
        assertEquals(Route.SignIn, HistoryFlow(MemoryStore(), HistorySuccess()).load(HistoryFilter()).route)

        val store = MemoryStore().apply { save(session("user@example.com")) }
        val failure = HistoryFlow(store, HistoryFailure()).load(HistoryFilter())
        assertEquals("api message", failure.error?.message)
    }

    private class MemoryStore : SessionStore {
        private var session: Session? = null
        override fun save(session: Session) { this.session = session }
        override fun load(): Session? = session
        override fun clear() { session = null }
    }

    private class AuthSuccess : AuthGateway {
        override fun signIn(email: String, password: String): AppResult<Session> = AppResult.Success(session(email))
        override fun logIn(email: String, password: String): AppResult<Session> = AppResult.Success(session(email))
    }

    private class AuthFailure : AuthGateway {
        override fun signIn(email: String, password: String): AppResult<Session> = AppResult.Failure(apiError())
        override fun logIn(email: String, password: String): AppResult<Session> = AppResult.Failure(apiError())
    }

    private class CameraSuccess(private val image: MeasurementImage) : CameraGateway {
        override fun openCamera(): AppResult<MeasurementImage> = AppResult.Success(image)
    }

    private class CameraFailure : CameraGateway {
        override fun openCamera(): AppResult<MeasurementImage> = AppResult.Failure(apiError())
    }

    private class UploadSuccess : MeasurementUploadGateway {
        override fun upload(session: Session, image: MeasurementImage): AppResult<String> = AppResult.Success("msr_1")
    }

    private class UploadFailure : MeasurementUploadGateway {
        override fun upload(session: Session, image: MeasurementImage): AppResult<String> = AppResult.Failure(apiError())
    }

    private class HistorySuccess : HistoryGateway {
        override fun list(session: Session, filter: HistoryFilter): AppResult<List<Measurement>> = AppResult.Success(listOf(measurement()))
    }

    private class HistoryFailure : HistoryGateway {
        override fun list(session: Session, filter: HistoryFilter): AppResult<List<Measurement>> = AppResult.Failure(apiError())
    }

    companion object {
        private fun session(email: String) = Session("token", "Bearer", "2026-12-31T00:00:00.000Z", MobileUser("usr_1", email))
        private fun apiError() = ApiError("code", "api message", ApiErrorSource.Api)
        private fun measurement() = Measurement("msr_1", MeasurementStatus.Saved, 120, 80, 68, ArmSide.Left, "2026-05-27T12:00:00.000Z", "2026-05-27T12:05:00.000Z")
    }
}