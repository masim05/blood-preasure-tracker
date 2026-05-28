package com.masim05.bloodpressure.mobile.core.flow

import com.masim05.bloodpressure.mobile.core.model.ApiError
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
    SignIn,
    Login,
    Guide,
    MeasurementActions,
    Capture,
    History,
}

data class ScreenState(
    val route: Route,
    val session: Session? = null,
    val error: ApiError? = null,
    val validationError: ValidationError? = null,
    val measurements: List<Measurement> = emptyList(),
    val filter: HistoryFilter = HistoryFilter(),
)

class AuthFlow(
    private val authGateway: AuthGateway,
    private val sessionStore: SessionStore,
) {
    fun signIn(email: String, password: String): ScreenState = authenticate(
        email = email,
        password = password,
        routeOnSuccess = Route.Guide,
    ) { authGateway.signIn(email.trim(), password) }

    fun logIn(email: String, password: String): ScreenState = authenticate(
        email = email,
        password = password,
        routeOnSuccess = Route.MeasurementActions,
    ) { authGateway.logIn(email.trim(), password) }

    private fun authenticate(
        email: String,
        password: String,
        routeOnSuccess: Route,
        request: () -> AppResult<Session>,
    ): ScreenState {
        Validators.email(email).let { if (it is ValidationResult.Invalid) return ScreenState(Route.SignIn, validationError = it.reason) }
        Validators.password(password).let { if (it is ValidationResult.Invalid) return ScreenState(Route.SignIn, validationError = it.reason) }
        return when (val result = request()) {
            is AppResult.Success -> {
                sessionStore.save(result.value)
                ScreenState(routeOnSuccess, session = result.value)
            }
            is AppResult.Failure -> ScreenState(Route.SignIn, error = result.error)
        }
    }
}

class GuideFlow(private val sessionStore: SessionStore) {
    fun enterGuide(): ScreenState = sessionStore.load()?.let { ScreenState(Route.Guide, session = it) } ?: ScreenState(Route.SignIn)
    fun continueToActions(): ScreenState = sessionStore.load()?.let { ScreenState(Route.MeasurementActions, session = it) } ?: ScreenState(Route.SignIn)
}

class MeasurementActionFlow(private val sessionStore: SessionStore) {
    fun enter(): ScreenState = sessionStore.load()?.let { ScreenState(Route.MeasurementActions, session = it) } ?: ScreenState(Route.SignIn)
    fun capture(): ScreenState = sessionStore.load()?.let { ScreenState(Route.Capture, session = it) } ?: ScreenState(Route.SignIn)
    fun history(): ScreenState = sessionStore.load()?.let { ScreenState(Route.History, session = it) } ?: ScreenState(Route.SignIn)
}

class CaptureFlow(
    private val sessionStore: SessionStore,
    private val cameraGateway: CameraGateway,
    private val uploadGateway: MeasurementUploadGateway,
) {
    fun captureAndUpload(): ScreenState {
        val session = sessionStore.load() ?: return ScreenState(Route.SignIn)
        return when (val camera = cameraGateway.openCamera()) {
            is AppResult.Failure -> ScreenState(Route.Capture, session = session, error = camera.error)
            is AppResult.Success -> upload(session, camera.value)
        }
    }

    private fun upload(session: Session, image: MeasurementImage): ScreenState {
        Validators.image(image).let { if (it is ValidationResult.Invalid) return ScreenState(Route.Capture, session = session, validationError = it.reason) }
        return when (val upload = uploadGateway.upload(session, image)) {
            is AppResult.Success -> ScreenState(Route.MeasurementActions, session = session)
            is AppResult.Failure -> ScreenState(Route.Capture, session = session, error = upload.error)
        }
    }
}

class HistoryFlow(
    private val sessionStore: SessionStore,
    private val historyGateway: HistoryGateway,
) {
    fun load(filter: HistoryFilter): ScreenState {
        val session = sessionStore.load() ?: return ScreenState(Route.SignIn)
        Validators.historyFilter(filter).let { if (it is ValidationResult.Invalid) return ScreenState(Route.History, session = session, validationError = it.reason, filter = filter) }
        return when (val history = historyGateway.list(session, filter)) {
            is AppResult.Success -> ScreenState(Route.History, session = session, measurements = history.value, filter = filter)
            is AppResult.Failure -> ScreenState(Route.History, session = session, error = history.error, filter = filter)
        }
    }

    fun rowOpensDetail(): ValidationResult = Validators.measurementDetailAllowed()
}