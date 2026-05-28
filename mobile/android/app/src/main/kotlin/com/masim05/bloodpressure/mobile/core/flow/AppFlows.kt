package com.masim05.bloodpressure.mobile.core.flow

import com.masim05.bloodpressure.mobile.core.model.ApiError
import com.masim05.bloodpressure.mobile.core.model.AuthMode
import com.masim05.bloodpressure.mobile.core.model.AppResult
import com.masim05.bloodpressure.mobile.core.model.HistoryFilter
import com.masim05.bloodpressure.mobile.core.model.Measurement
import com.masim05.bloodpressure.mobile.core.model.MeasurementImage
import com.masim05.bloodpressure.mobile.core.model.Session
import com.masim05.bloodpressure.mobile.core.ports.AuthGateway
import com.masim05.bloodpressure.mobile.core.ports.CameraGateway
import com.masim05.bloodpressure.mobile.core.ports.HistoryGateway
import com.masim05.bloodpressure.mobile.core.ports.MeasurementUploadGateway
import com.masim05.bloodpressure.mobile.core.ports.SessionStore
import com.masim05.bloodpressure.mobile.core.validation.ValidationError
import com.masim05.bloodpressure.mobile.core.validation.ValidationResult
import com.masim05.bloodpressure.mobile.core.validation.Validators

enum class Route {
    Auth,
    Guide,
    Camera,
    History,
    MeasurementDetail,
}

data class ScreenState(
    val route: Route,
    val authMode: AuthMode = AuthMode.Login,
    val session: Session? = null,
    val error: ApiError? = null,
    val validationError: ValidationError? = null,
    val measurements: List<Measurement> = emptyList(),
    val filter: HistoryFilter = HistoryFilter(),
    val lastUploadId: String? = null,
)

class AuthFlow(
    private val authGateway: AuthGateway,
    private val sessionStore: SessionStore,
) {
    fun signIn(email: String, password: String): ScreenState = authenticate(
        email = email,
        password = password,
        routeOnSuccess = Route.Guide,
        authMode = AuthMode.NewAccount,
    ) { authGateway.signIn(email.trim(), password) }

    fun logIn(email: String, password: String): ScreenState = authenticate(
        email = email,
        password = password,
        routeOnSuccess = Route.Camera,
        authMode = AuthMode.Login,
    ) { authGateway.logIn(email.trim(), password) }

    private fun authenticate(
        email: String,
        password: String,
        routeOnSuccess: Route,
        authMode: AuthMode,
        request: () -> AppResult<Session>,
    ): ScreenState {
        Validators.email(email).let { if (it is ValidationResult.Invalid) return ScreenState(Route.Auth, authMode = authMode, validationError = it.reason) }
        Validators.password(password).let { if (it is ValidationResult.Invalid) return ScreenState(Route.Auth, authMode = authMode, validationError = it.reason) }
        return when (val result = request()) {
            is AppResult.Success -> {
                sessionStore.save(result.value)
                ScreenState(routeOnSuccess, session = result.value)
            }
            is AppResult.Failure -> ScreenState(Route.Auth, authMode = authMode, error = result.error)
        }
    }
}

class GuideFlow(private val sessionStore: SessionStore) {
    fun enterGuide(): ScreenState = sessionStore.load()?.let { ScreenState(Route.Guide, session = it) } ?: ScreenState(Route.Auth)
    fun continueToCamera(): ScreenState = sessionStore.load()?.let { ScreenState(Route.Camera, session = it) } ?: ScreenState(Route.Auth)
}

class CaptureFlow(
    private val sessionStore: SessionStore,
    private val cameraGateway: CameraGateway,
    private val uploadGateway: MeasurementUploadGateway,
) {
    fun enterCamera(): ScreenState = sessionStore.load()?.let { ScreenState(Route.Camera, session = it) } ?: ScreenState(Route.Auth)

    fun history(): ScreenState = sessionStore.load()?.let { ScreenState(Route.History, session = it) } ?: ScreenState(Route.Auth)

    fun captureAndUpload(): ScreenState {
        val session = sessionStore.load() ?: return ScreenState(Route.Auth)
        return when (val camera = cameraGateway.openCamera()) {
            is AppResult.Failure -> ScreenState(Route.Camera, session = session, error = camera.error)
            is AppResult.Success -> upload(session, camera.value)
        }
    }

    private fun upload(session: Session, image: MeasurementImage): ScreenState {
        Validators.image(image).let { if (it is ValidationResult.Invalid) return ScreenState(Route.Camera, session = session, validationError = it.reason) }
        return when (val upload = uploadGateway.upload(session, image)) {
            is AppResult.Success -> ScreenState(Route.History, session = session, lastUploadId = upload.value)
            is AppResult.Failure -> ScreenState(Route.Camera, session = session, error = upload.error)
        }
    }
}

class HistoryFlow(
    private val sessionStore: SessionStore,
    private val historyGateway: HistoryGateway,
) {
    fun load(filter: HistoryFilter): ScreenState {
        val session = sessionStore.load() ?: return ScreenState(Route.Auth)
        Validators.historyFilter(filter).let { if (it is ValidationResult.Invalid) return ScreenState(Route.History, session = session, validationError = it.reason, filter = filter) }
        return when (val history = historyGateway.list(session, filter)) {
            is AppResult.Success -> ScreenState(Route.History, session = session, measurements = history.value, filter = filter)
            is AppResult.Failure -> ScreenState(Route.History, session = session, error = history.error, filter = filter)
        }
    }

    fun rowOpensDetail(): ValidationResult = Validators.measurementDetailAllowed()
}