package com.masim05.bloodpressure.mobile

import android.content.ActivityNotFoundException
import android.content.Intent
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.History
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.navigation.NavDestination
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.navigation
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.masim05.bloodpressure.mobile.adapters.api.HttpApiClient
import com.masim05.bloodpressure.mobile.adapters.camera.CameraXCameraGateway
import com.masim05.bloodpressure.mobile.adapters.session.EncryptedSessionStore
import com.masim05.bloodpressure.mobile.core.flow.AuthFlow
import com.masim05.bloodpressure.mobile.core.flow.CaptureFlow
import com.masim05.bloodpressure.mobile.core.flow.HistoryFlow
import com.masim05.bloodpressure.mobile.core.flow.MeasurementDetailFlow
import com.masim05.bloodpressure.mobile.core.flow.Route
import com.masim05.bloodpressure.mobile.core.flow.ScreenState
import com.masim05.bloodpressure.mobile.core.model.ApiError
import com.masim05.bloodpressure.mobile.core.model.ApiErrorSource
import com.masim05.bloodpressure.mobile.core.model.AppResult
import com.masim05.bloodpressure.mobile.core.model.AuthMode
import com.masim05.bloodpressure.mobile.core.model.HistoryFilter
import com.masim05.bloodpressure.mobile.core.model.Measurement
import com.masim05.bloodpressure.mobile.core.model.MeasurementDetail
import com.masim05.bloodpressure.mobile.core.model.Session
import com.masim05.bloodpressure.mobile.core.ports.SessionStore
import com.masim05.bloodpressure.mobile.core.validation.ValidationError
import com.masim05.bloodpressure.mobile.ui.TestTags
import com.masim05.bloodpressure.mobile.ui.screens.AuthScreen
import com.masim05.bloodpressure.mobile.ui.screens.CameraScreen
import com.masim05.bloodpressure.mobile.ui.screens.HistoryScreen
import com.masim05.bloodpressure.mobile.ui.screens.MeasurementDetailScreen
import com.masim05.bloodpressure.mobile.ui.screens.ProfileScreen
import com.masim05.bloodpressure.mobile.ui.theme.AppTheme
import java.time.Instant

class MainActivity : ComponentActivity() {
    private val sessionStore by lazy { EncryptedSessionStore.create(this) }
    private val cameraGateway = CameraXCameraGateway()
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
    private val captureFlow by lazy { CaptureFlow(sessionStore, cameraGateway, apiClient) }
    private val historyFlow by lazy { HistoryFlow(sessionStore, apiClient) }
    private val measurementDetailFlow by lazy { MeasurementDetailFlow(sessionStore, apiClient) }
    private var uiState by mutableStateOf(MobileUiState())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        uiState = restoredStartupState()
        setContent {
            AppTheme {
                val navController = rememberNavController()
                val backStackEntry by navController.currentBackStackEntryAsState()
                val currentDestination = backStackEntry?.destination
                val mainTab = remember(uiState.route) { topLevelMainTab(uiState.route) }

                LaunchedEffect(uiState.route, uiState.selectedMeasurementId) {
                    syncNavigationState(navController, uiState.route, uiState.selectedMeasurementId)
                }

                Scaffold(
                    bottomBar = {
                        if (showBottomNavigation(currentDestination)) {
                            MainBottomNavigation(
                                selectedTab = mainTab,
                                onCaptureSelected = ::openCamera,
                                onHistorySelected = { openHistory(uiState.filter) },
                                onProfileSelected = ::openProfile,
                            )
                        }
                    },
                ) { innerPadding ->
                    NavHost(
                        navController = navController,
                        startDestination = startGraphFor(uiState.route),
                        modifier = Modifier.padding(innerPadding),
                    ) {
                        navigation(startDestination = AuthDestination.Login.route, route = RootGraph.Auth.route) {
                            composable(AuthDestination.Login.route) {
                                AuthScreen(
                                    mode = uiState.authMode,
                                    isSubmitting = uiState.isSubmitting,
                                    errorText = uiState.errorText,
                                    onModeChange = { uiState = uiState.copy(authMode = it, errorText = null) },
                                    onSubmit = ::submitAuth,
                                )
                            }
                        }

                        navigation(startDestination = MainDestination.Capture.route, route = RootGraph.Main.route) {
                            composable(MainDestination.Capture.route) {
                                CameraScreen(
                                    isUploading = uiState.isUploading,
                                    errorText = uiState.errorText,
                                    onUpload = ::captureAndUpload,
                                    onCaptureReady = { image ->
                                        cameraGateway.publishCapture(image)
                                        captureAndUpload()
                                    },
                                    onCaptureFailure = { message ->
                                        cameraGateway.publishFailure(message)
                                        uiState = uiState.copy(errorText = message)
                                    },
                                    onHistory = { openHistory(HistoryFilter()) },
                                )
                            }

                            composable(MainDestination.History.route) {
                                HistoryScreen(
                                    filter = uiState.filter,
                                    measurements = uiState.measurements,
                                    isLoading = uiState.isHistoryLoading,
                                    errorText = uiState.errorText,
                                    onRefresh = ::refreshHistory,
                                    onApplyFilter = ::openHistory,
                                    onClearFilter = { openHistory(HistoryFilter()) },
                                    onExportCsv = { exportHistoryCsv(uiState.measurements) },
                                    onMeasurementSelected = { openMeasurementDetail(it.id) },
                                )
                            }

                            composable(MainDestination.Profile.route) {
                                ProfileScreen(onLogout = ::logout)
                            }

                            composable(MainDestination.MeasurementDetail.route) {
                                MeasurementDetailScreen(
                                    detail = uiState.measurementDetail,
                                    isLoading = uiState.isDetailLoading,
                                    isSaving = uiState.isDetailSaving,
                                    errorText = uiState.errorText,
                                    apiBaseUrl = BuildConfig.API_BASE_URL,
                                    loadMeasurementImage = ::loadMeasurementImage,
                                    onRefresh = ::refreshMeasurementDetail,
                                    onBack = ::closeMeasurementDetail,
                                    onSave = ::saveMeasurementDetail,
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    private fun restoredStartupState(): MobileUiState {
        val restoredSession = sessionStore.load()
        if (restoredSession != null && restoredSession.isActive()) {
            return MobileUiState(route = Route.Camera)
        }

        if (restoredSession != null && !restoredSession.isActive()) {
            sessionStore.clear()
            return MobileUiState(
                route = Route.Auth,
                authMode = AuthMode.Login,
                errorText = getString(R.string.error_restore_session),
            )
        }

        val restoreError = sessionStore.loadError()
        return if (restoreError != null) {
            MobileUiState(
                route = Route.Auth,
                authMode = AuthMode.Login,
                errorText = getString(R.string.error_restore_session),
            )
        } else {
            MobileUiState(route = Route.Auth, authMode = AuthMode.Login)
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

    private fun openCamera() {
        val state = captureFlow.enterCamera()
        state.logErrors("camera_enter")
        uiState = uiState.copy(route = state.route, isUploading = false, errorText = state.visibleMessage())
    }

    private fun openProfile() {
        if (captureFlow.enterCamera().route == Route.Auth) {
            uiState = MobileUiState(route = Route.Auth, authMode = AuthMode.Login)
            return
        }
        uiState = uiState.copy(route = Route.Profile, errorText = null)
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
            detailAuthorizationHeader = sessionStore.load()?.authorizationHeader,
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

    private fun closeMeasurementDetail() {
        uiState = uiState.copy(route = Route.History, selectedMeasurementId = null, errorText = null)
    }

    private fun refreshHistory() {
        if (captureFlow.history().route == Route.Auth) {
            uiState = MobileUiState(route = Route.Auth, authMode = AuthMode.Login)
            return
        }
        val filter = uiState.filter
        val currentMeasurements = uiState.measurements
        uiState = uiState.copy(
            route = Route.History,
            filter = filter,
            isUploading = false,
            isHistoryLoading = true,
            errorText = null,
        )
        runInBackground {
            val state = historyFlow.load(filter)
            state.logErrors("history_refresh")
            runOnUiThread {
                uiState = uiState.copy(
                    route = state.route,
                    filter = state.filter,
                    measurements = refreshedHistoryMeasurements(currentMeasurements, state),
                    isHistoryLoading = false,
                    errorText = state.visibleMessage(),
                )
            }
        }
    }

    private fun refreshMeasurementDetail() {
        val measurementId = refreshMeasurementDetailId(uiState.selectedMeasurementId) ?: return
        val currentDetail = uiState.measurementDetail
        uiState = uiState.copy(
            route = Route.MeasurementDetail,
            selectedMeasurementId = measurementId,
            isDetailLoading = true,
            isDetailSaving = false,
            detailAuthorizationHeader = sessionStore.load()?.authorizationHeader,
            errorText = null,
        )
        runInBackground {
            val state = measurementDetailFlow.load(measurementId)
            state.logErrors("detail_refresh")
            runOnUiThread {
                if (state.route == Route.Auth) {
                    uiState = MobileUiState(route = Route.Auth, authMode = AuthMode.Login)
                } else {
                    uiState = uiState.copy(
                        route = Route.MeasurementDetail,
                        measurementDetail = refreshedMeasurementDetail(currentDetail, state),
                        isDetailLoading = false,
                        errorText = state.visibleMessage(),
                    )
                }
            }
        }
    }

    private fun exportHistoryCsv(measurements: List<Measurement>) {
        if (measurements.isEmpty()) return
        val sendIntent = Intent(Intent.ACTION_SEND).apply {
            type = "text/csv"
            putExtra(Intent.EXTRA_TEXT, measurementsToCsv(measurements))
        }
        if (sendIntent.resolveActivity(packageManager) == null) {
            uiState = uiState.copy(errorText = getString(R.string.history_export_csv_unavailable))
            return
        }
        try {
            startActivity(Intent.createChooser(sendIntent, getString(R.string.history_export_csv_chooser)))
        } catch (_: ActivityNotFoundException) {
            uiState = uiState.copy(errorText = getString(R.string.history_export_csv_unavailable))
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

    private fun logout() {
        sessionStore.clear()
        uiState = MobileUiState(route = Route.Auth, authMode = AuthMode.Login)
    }

    private fun loadMeasurementImage(imageUrl: String): AppResult<ByteArray> {
        val authorizationHeader = uiState.detailAuthorizationHeader ?: return AppResult.Failure(
            ApiError(
                code = "missing_authorization",
                message = getString(R.string.error_unexpected),
                source = ApiErrorSource.Unexpected,
            ),
        )
        return apiClient.fetchMeasurementImage(imageUrl, authorizationHeader)
    }

    private fun ScreenState.visibleMessage(): String? {
        validationError?.let { return getString(it.messageRes()) }
        val currentError = error ?: return null
        return when (currentError.code) {
            "camera_not_ready" -> getString(R.string.camera_capture_failed)
            else -> currentError.message
        }
    }

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
                "operation=$operation route=$route apiBaseUrl=${BuildConfig.API_BASE_URL} source=${it.source} code=${it.code ?: "none"} message=${it.message}",
            )
        }
        validationError?.let {
            Log.e(
                LOG_TAG,
                "operation=$operation route=$route apiBaseUrl=${BuildConfig.API_BASE_URL} validation=$it messageRes=${it.messageRes()}",
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

private enum class RootGraph(val route: String) {
    Auth("auth_graph"),
    Main("main_graph"),
}

private enum class AuthDestination(val route: String) {
    Login("auth/login"),
}

private enum class MainDestination(val route: String) {
    Capture("main/capture"),
    History("main/history"),
    MeasurementDetail("main/history/detail"),
    Profile("main/profile"),
}

internal enum class MainTab {
    Capture,
    History,
    Profile,
}

@Composable
private fun MainBottomNavigation(
    selectedTab: MainTab,
    onCaptureSelected: () -> Unit,
    onHistorySelected: () -> Unit,
    onProfileSelected: () -> Unit,
) {
    NavigationBar(modifier = Modifier.testTag(TestTags.BottomNav)) {
        NavigationBarItem(
            selected = selectedTab == MainTab.Capture,
            onClick = onCaptureSelected,
            icon = { androidx.compose.material3.Icon(Icons.Filled.CameraAlt, contentDescription = null) },
            label = { Text(stringResource(R.string.nav_capture)) },
            modifier = Modifier.testTag(TestTags.BottomNavCapture),
        )
        NavigationBarItem(
            selected = selectedTab == MainTab.History,
            onClick = onHistorySelected,
            icon = { androidx.compose.material3.Icon(Icons.Filled.History, contentDescription = null) },
            label = { Text(stringResource(R.string.nav_history)) },
            modifier = Modifier.testTag(TestTags.BottomNavHistory),
        )
        NavigationBarItem(
            selected = selectedTab == MainTab.Profile,
            onClick = onProfileSelected,
            icon = { androidx.compose.material3.Icon(Icons.Filled.AccountCircle, contentDescription = null) },
            label = { Text(stringResource(R.string.nav_profile)) },
            modifier = Modifier.testTag(TestTags.BottomNavProfile),
        )
    }
}

private fun startGraphFor(route: Route): String {
    return if (route == Route.Auth) RootGraph.Auth.route else RootGraph.Main.route
}

private fun showBottomNavigation(currentDestination: NavDestination?): Boolean {
    if (currentDestination == null) return false
    val isMainGraphDestination = currentDestination.hierarchy.any { it.route == RootGraph.Main.route }
    val isDetailDestination = currentDestination.route == MainDestination.MeasurementDetail.route
    return isMainGraphDestination && !isDetailDestination
}

private fun syncNavigationState(
    navController: NavHostController,
    route: Route,
    selectedMeasurementId: String?,
) {
    when (route) {
        Route.Auth -> navController.navigate(AuthDestination.Login.route) {
            popUpTo(navController.graph.findStartDestination().id) { inclusive = true }
            launchSingleTop = true
        }
        Route.Camera, Route.Guide -> navController.navigate(MainDestination.Capture.route) {
            popUpTo(navController.graph.findStartDestination().id) { inclusive = true }
            launchSingleTop = true
        }
        Route.History -> {
            if (navController.currentDestination?.route == MainDestination.MeasurementDetail.route) {
                navController.popBackStack()
            } else {
                navController.navigate(MainDestination.History.route) {
                    launchSingleTop = true
                }
            }
        }
        Route.MeasurementDetail -> {
            if (selectedMeasurementId.isNullOrBlank()) return
            navController.navigate(MainDestination.MeasurementDetail.route) {
                launchSingleTop = true
            }
        }
        Route.Profile -> navController.navigate(MainDestination.Profile.route) {
            launchSingleTop = true
        }
    }
}

internal fun topLevelMainTab(route: Route): MainTab {
    return when (route) {
        Route.History, Route.MeasurementDetail -> MainTab.History
        Route.Profile -> MainTab.Profile
        else -> MainTab.Capture
    }
}

internal fun restoredSession(sessionStore: SessionStore, now: Instant = Instant.now()): Session? {
    val session = sessionStore.load() ?: return null
    if (!session.isValidAt(now)) {
        sessionStore.clear()
        return null
    }
    return session
}

internal fun initialRoute(session: Session?): Route {
    return if (session == null) Route.Auth else Route.Camera
}

private fun Session.isValidAt(now: Instant): Boolean {
    return runCatching { Instant.parse(expiresAt).isAfter(now) }.getOrDefault(false)
}

internal fun refreshMeasurementDetailId(selectedMeasurementId: String?): String? {
    return selectedMeasurementId?.takeIf { it.isNotBlank() }
}

internal fun refreshedHistoryMeasurements(currentMeasurements: List<Measurement>, state: ScreenState): List<Measurement> {
    return if (state.error != null) currentMeasurements else state.measurements
}

internal fun refreshedMeasurementDetail(currentDetail: MeasurementDetail?, state: ScreenState): MeasurementDetail? {
    return state.measurementDetail ?: currentDetail
}

internal fun measurementsToCsv(measurements: List<Measurement>): String {
    val header = "time,systolic,diastolic,pulse,arm"
    if (measurements.isEmpty()) return header
    val rows = measurements.joinToString(separator = "\n") { measurement ->
        listOf(
            measurement.measurementTime.ifBlank { measurement.savedAt },
            measurement.systolic.toString(),
            measurement.diastolic.toString(),
            measurement.pulse.toString(),
            measurement.armSide.name.lowercase(),
        ).joinToString(separator = ",") { csvEscape(it) }
    }
    return "$header\n$rows"
}

private fun csvEscape(value: String): String {
    if (value.none { it == ',' || it == '"' || it == '\n' || it == '\r' }) {
        return value
    }
    return "\"${value.replace("\"", "\"\"")}\""
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
    val detailAuthorizationHeader: String? = null,
)