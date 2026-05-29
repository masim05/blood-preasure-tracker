package com.masim05.bloodpressure.mobile

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.masim05.bloodpressure.mobile.adapters.api.HttpApiClient
import com.masim05.bloodpressure.mobile.adapters.camera.GeneratedCameraGateway
import com.masim05.bloodpressure.mobile.adapters.session.InMemorySessionStore
import com.masim05.bloodpressure.mobile.core.flow.AuthFlow
import com.masim05.bloodpressure.mobile.core.flow.CaptureFlow
import com.masim05.bloodpressure.mobile.core.flow.GuideFlow
import com.masim05.bloodpressure.mobile.core.flow.HistoryFlow
import com.masim05.bloodpressure.mobile.core.flow.MeasurementDetailFlow
import com.masim05.bloodpressure.mobile.core.flow.Route
import com.masim05.bloodpressure.mobile.core.flow.ScreenState
import com.masim05.bloodpressure.mobile.core.model.AuthMode
import com.masim05.bloodpressure.mobile.core.model.HistoryFilter
import com.masim05.bloodpressure.mobile.core.model.Measurement
import com.masim05.bloodpressure.mobile.core.model.MeasurementDetail
import com.masim05.bloodpressure.mobile.core.validation.ValidationError
import com.masim05.bloodpressure.mobile.ui.screens.AuthScreen
import com.masim05.bloodpressure.mobile.ui.screens.CameraScreen
import com.masim05.bloodpressure.mobile.ui.screens.GuideScreen
import com.masim05.bloodpressure.mobile.ui.screens.HistoryScreen
import com.masim05.bloodpressure.mobile.ui.screens.MeasurementDetailScreen
import com.masim05.bloodpressure.mobile.ui.theme.AppTheme

class MainActivity : ComponentActivity() {
    private val sessionStore = InMemorySessionStore()
    private val apiClient by lazy {
        HttpApiClient(
            baseUrl = BuildConfig.API_BASE_URL,
            fallbackApiMessage = getString(R.string.error_unexpected),
            networkMessage = getString(R.string.error_network),
            timeoutMessage = getString(R.string.error_timeout),
            parseMessage = getString(R.string.error_parse),
        )
    }
    private val authFlow by lazy { AuthFlow(apiClient, sessionStore) }
    private val guideFlow = GuideFlow(sessionStore)
    private val captureFlow by lazy { CaptureFlow(sessionStore, GeneratedCameraGateway(), apiClient) }
    private val historyFlow by lazy { HistoryFlow(sessionStore, apiClient) }
    private val measurementDetailFlow by lazy { MeasurementDetailFlow(sessionStore, apiClient) }
    private var uiState by mutableStateOf(MobileUiState())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AppTheme {
                when (uiState.route) {
                    Route.Auth -> AuthScreen(
                        mode = uiState.authMode,
                        isSubmitting = uiState.isSubmitting,
                        errorText = uiState.errorText,
                        onModeChange = { uiState = uiState.copy(authMode = it, errorText = null) },
                        onSubmit = ::submitAuth,
                    )
                    Route.Guide -> GuideScreen(onNext = ::continueFromGuide)
                    Route.Camera -> CameraScreen(
                        isUploading = uiState.isUploading,
                        errorText = uiState.errorText,
                        onUpload = ::captureAndUpload,
                        onHistory = { openHistory(HistoryFilter()) },
                    )
                    Route.History -> HistoryScreen(
                        filter = uiState.filter,
                        measurements = uiState.measurements,
                        isLoading = uiState.isHistoryLoading,
                        errorText = uiState.errorText,
                        onApplyFilter = ::openHistory,
                        onClearFilter = { openHistory(HistoryFilter()) },
                        onMeasurementSelected = { openMeasurementDetail(it.id) },
                    )
                    Route.MeasurementDetail -> MeasurementDetailScreen(
                        detail = uiState.measurementDetail,
                        isLoading = uiState.isDetailLoading,
                        isSaving = uiState.isDetailSaving,
                        errorText = uiState.errorText,
                        onBack = { openHistory(uiState.filter) },
                        onSave = ::saveMeasurementDetail,
                    )
                }
            }
        }
    }

    private fun submitAuth(mode: AuthMode, email: String, password: String) {
        uiState = uiState.copy(authMode = mode, isSubmitting = true, errorText = null)
        runInBackground {
            val state = when (mode) {
                AuthMode.Login -> authFlow.logIn(email, password)
                AuthMode.NewAccount -> authFlow.signIn(email, password)
            }
            state.logErrors("auth_submit")
            runOnUiThread {
                uiState = uiState.copy(
                    route = state.route,
                    authMode = state.authMode,
                    isSubmitting = false,
                    errorText = state.visibleMessage(),
                )
            }
        }
    }

    private fun continueFromGuide() {
        val state = guideFlow.continueToCamera()
        state.logErrors("guide_continue")
        uiState = uiState.copy(route = state.route, errorText = state.visibleMessage())
    }

    private fun openCamera() {
        val state = captureFlow.enterCamera()
        state.logErrors("camera_enter")
        uiState = uiState.copy(route = state.route, isUploading = false, errorText = state.visibleMessage())
    }

    private fun captureAndUpload() {
        uiState = uiState.copy(isUploading = true, errorText = null)
        runInBackground {
            val state = captureFlow.captureAndUpload()
            state.logErrors("camera_upload")
            runOnUiThread {
                if (state.route == Route.History) {
                    openHistory(HistoryFilter())
                } else {
                    uiState = uiState.copy(route = state.route, isUploading = false, errorText = state.visibleMessage())
                }
            }
        }
    }

    private fun openHistory(filter: HistoryFilter) {
        if (captureFlow.history().route == Route.Auth) {
            uiState = MobileUiState(route = Route.Auth, authMode = AuthMode.Login)
            return
        }
        uiState = uiState.copy(
            route = Route.History,
            filter = filter,
            measurements = emptyList(),
            isUploading = false,
            isHistoryLoading = true,
            errorText = null,
        )
        runInBackground {
            val state = historyFlow.load(filter)
            state.logErrors("history_load")
            runOnUiThread {
                uiState = uiState.copy(
                    route = state.route,
                    filter = state.filter,
                    measurements = state.measurements,
                    isHistoryLoading = false,
                    errorText = state.visibleMessage(),
                )
            }
        }
    }

    private fun openMeasurementDetail(measurementId: String) {
        uiState = uiState.copy(
            route = Route.MeasurementDetail,
            selectedMeasurementId = measurementId,
            measurementDetail = null,
            isDetailLoading = true,
            isDetailSaving = false,
            errorText = null,
        )
        runInBackground {
            val state = measurementDetailFlow.load(measurementId)
            state.logErrors("detail_load")
            runOnUiThread {
                if (state.route == Route.Auth) {
                    uiState = MobileUiState(route = Route.Auth, authMode = AuthMode.Login)
                } else {
                    uiState = uiState.copy(
                        route = Route.MeasurementDetail,
                        measurementDetail = state.measurementDetail,
                        isDetailLoading = false,
                        errorText = state.visibleMessage(),
                    )
                }
            }
        }
    }

    private fun saveMeasurementDetail(detail: MeasurementDetail) {
        uiState = uiState.copy(isDetailSaving = true, errorText = null)
        runInBackground {
            val state = measurementDetailFlow.save(detail)
            state.logErrors("detail_save")
            runOnUiThread {
                if (state.route == Route.Auth) {
                    uiState = MobileUiState(route = Route.Auth, authMode = AuthMode.Login)
                } else {
                    uiState = uiState.copy(
                        route = Route.MeasurementDetail,
                        measurementDetail = state.measurementDetail ?: detail,
                        isDetailSaving = false,
                        errorText = state.visibleMessage() ?: getString(R.string.detail_save_success),
                    )
                }
            }
        }
    }

    private fun ScreenState.visibleMessage(): String? = validationError?.let { getString(it.messageRes()) } ?: error?.message

    private fun ValidationError.messageRes(): Int = when (this) {
        ValidationError.InvalidEmail -> R.string.error_invalid_email
        ValidationError.InvalidPassword -> R.string.error_invalid_password
        ValidationError.InvalidImage -> R.string.error_unexpected
        ValidationError.InvalidDate -> R.string.error_invalid_date
        ValidationError.DateOrder -> R.string.error_date_order
    }

    private fun ScreenState.logErrors(operation: String) {
        error?.let {
            Log.e(
                LOG_TAG,
                "operation=$operation route=$route source=${it.source} code=${it.code ?: "none"} message=${it.message}",
            )
        }
        validationError?.let {
            Log.e(
                LOG_TAG,
                "operation=$operation route=$route validation=$it messageRes=${it.messageRes()}",
            )
        }
    }

    private fun runInBackground(work: () -> Unit) {
        Thread {
            try {
                work()
            } catch (error: Throwable) {
                Log.e(LOG_TAG, "operation=background_uncaught", error)
            }
        }.start()
    }

    companion object {
        private const val LOG_TAG = "BPMobile"
    }
}

private data class MobileUiState(
    val route: Route = Route.Auth,
    val authMode: AuthMode = AuthMode.Login,
    val isSubmitting: Boolean = false,
    val isUploading: Boolean = false,
    val isHistoryLoading: Boolean = false,
    val errorText: String? = null,
    val filter: HistoryFilter = HistoryFilter(),
    val measurements: List<Measurement> = emptyList(),
    val selectedMeasurementId: String? = null,
    val measurementDetail: MeasurementDetail? = null,
    val isDetailLoading: Boolean = false,
    val isDetailSaving: Boolean = false,
)