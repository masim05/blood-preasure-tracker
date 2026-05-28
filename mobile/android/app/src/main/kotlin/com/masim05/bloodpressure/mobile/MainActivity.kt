package com.masim05.bloodpressure.mobile

import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import com.masim05.bloodpressure.mobile.adapters.api.HttpApiClient
import com.masim05.bloodpressure.mobile.adapters.camera.GeneratedCameraGateway
import com.masim05.bloodpressure.mobile.adapters.session.InMemorySessionStore
import com.masim05.bloodpressure.mobile.core.flow.AuthFlow
import com.masim05.bloodpressure.mobile.core.flow.CaptureFlow
import com.masim05.bloodpressure.mobile.core.flow.GuideFlow
import com.masim05.bloodpressure.mobile.core.flow.HistoryFlow
import com.masim05.bloodpressure.mobile.core.flow.MeasurementActionFlow
import com.masim05.bloodpressure.mobile.core.model.ArmSide
import com.masim05.bloodpressure.mobile.core.model.HistoryFilter
import com.masim05.bloodpressure.mobile.core.model.Measurement
import com.masim05.bloodpressure.mobile.core.model.MeasurementStatus
import com.masim05.bloodpressure.mobile.core.validation.ValidationError

class MainActivity : Activity() {
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
    private val actionFlow = MeasurementActionFlow(sessionStore)
    private val captureFlow by lazy { CaptureFlow(sessionStore, GeneratedCameraGateway(), apiClient) }
    private val historyFlow by lazy { HistoryFlow(sessionStore, apiClient) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        showSignIn()
    }

    private fun showSignIn() {
        val error = errorView()
        val email = editText(R.id.signin_email, R.string.signin_email_hint, R.string.a11y_signin_email)
        val password = editText(R.id.signin_password, R.string.signin_password_hint, R.string.a11y_signin_password)
        val submit = button(R.id.signin_submit, R.string.signin_submit) {
            val emailValue = email.text.toString()
            val passwordValue = password.text.toString()
            error.setText(R.string.status_loading)
            runInBackground {
                val state = authFlow.signIn(emailValue, passwordValue)
                runOnUiThread {
                    state.validationError?.let { error.setText(messageFor(it)) }
                    state.error?.let { error.text = it.message }
                    if (state.validationError == null && state.error == null) showGuide()
                }
            }
        }
        val login = button(R.id.signin_to_login, R.string.signin_to_login) { showLogin() }
        setContent(screen(R.string.signin_title, error, email, password, submit, login))
    }

    private fun showLogin() {
        val error = errorView()
        val email = editText(R.id.login_email, R.string.signin_email_hint, R.string.a11y_login_email)
        val password = editText(R.id.login_password, R.string.signin_password_hint, R.string.a11y_login_password)
        val submit = button(R.id.login_submit, R.string.login_submit) {
            val emailValue = email.text.toString()
            val passwordValue = password.text.toString()
            error.setText(R.string.status_loading)
            runInBackground {
                val state = authFlow.logIn(emailValue, passwordValue)
                runOnUiThread {
                    state.validationError?.let { error.setText(messageFor(it)) }
                    state.error?.let { error.text = it.message }
                    if (state.validationError == null && state.error == null) showActions()
                }
            }
        }
        val signin = button(R.id.login_to_signin, R.string.login_to_signin) { showSignIn() }
        setContent(screen(R.string.login_title, error, email, password, submit, signin))
    }

    private fun showGuide() {
        val state = guideFlow.enterGuide()
        if (state.session == null) {
            showSignIn()
            return
        }
        val copy = body(R.string.guide_copy)
        val next = button(R.id.guide_continue, R.string.guide_continue) {
            guideFlow.continueToActions()
            showActions()
        }
        setContent(screen(R.string.guide_title, errorView(), copy, next))
    }

    private fun showActions() {
        if (actionFlow.enter().session == null) {
            showSignIn()
            return
        }
        val capture = button(R.id.actions_capture, R.string.actions_capture) { showCapture() }
        val history = button(R.id.actions_history, R.string.actions_history) { showHistory() }
        setContent(screen(R.string.actions_title, errorView(), capture, history))
    }

    private fun showCapture() {
        if (actionFlow.capture().session == null) {
            showSignIn()
            return
        }
        val error = errorView()
        val copy = body(R.string.capture_copy)
        val openCamera = button(R.id.capture_open_camera, R.string.capture_open_camera) {
            error.setText(R.string.status_loading)
            runInBackground {
                val state = captureFlow.captureAndUpload()
                runOnUiThread {
                    state.validationError?.let { error.setText(messageFor(it)) }
                    state.error?.let { error.text = it.message }
                    if (state.validationError == null && state.error == null) {
                        error.setText(R.string.status_upload_complete)
                    }
                }
            }
        }
        val back = button(R.id.capture_back, R.string.capture_back) { showActions() }
        setContent(screen(R.string.capture_title, error, copy, openCamera, back))
    }

    private fun showHistory(filter: HistoryFilter = HistoryFilter()) {
        val error = errorView()
        val from = editText(R.id.history_from, R.string.history_from_hint, R.string.a11y_history_from)
        val to = editText(R.id.history_to, R.string.history_to_hint, R.string.a11y_history_to)
        from.setText(filter.from)
        to.setText(filter.to)
        val columns = body(R.string.history_columns)
        val rows = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        rows.addView(body(R.string.status_loading))
        val apply = button(R.id.history_apply_filter, R.string.history_apply_filter) {
            showHistory(HistoryFilter(from.text.toString(), to.text.toString()))
        }
        val clear = button(R.id.history_clear_filter, R.string.history_clear_filter) { showHistory() }
        val back = button(R.id.history_return, R.string.history_return) { showActions() }
        setContent(screen(R.string.history_title, error, from, to, apply, clear, columns, rows, back))
        runInBackground {
            val state = historyFlow.load(filter)
            runOnUiThread {
                rows.removeAllViews()
                state.validationError?.let { error.setText(messageFor(it)) }
                state.error?.let { error.text = it.message }
                if (state.measurements.isEmpty()) {
                    rows.addView(body(R.string.history_empty))
                } else {
                    state.measurements.forEach { rows.addView(TextView(this).apply { text = formatMeasurement(it) }) }
                }
            }
        }
    }

    private fun setContent(content: LinearLayout) {
        setContentView(ScrollView(this).apply { addView(content) })
    }

    private fun screen(titleRes: Int, vararg children: android.view.View): LinearLayout {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.rgb(248, 250, 252))
            setPadding(32.dp, 32.dp, 32.dp, 32.dp)
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
        }

        val title = TextView(this).apply {
            id = R.id.screen_title
            setText(titleRes)
            setTextColor(Color.rgb(15, 23, 42))
            textSize = 28f
            gravity = Gravity.CENTER
        }
        root.addView(title)
        children.forEach { root.addView(it) }
        return root
    }

    private fun editText(idValue: Int, hintRes: Int, descriptionRes: Int): EditText = EditText(this).apply {
        id = idValue
        hint = getString(hintRes)
        contentDescription = getString(descriptionRes)
        importantForAutofill = View.IMPORTANT_FOR_AUTOFILL_NO
        setSingleLine(true)
        layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
            setMargins(0, 16.dp, 0, 0)
        }
    }

    private fun button(idValue: Int, textRes: Int, onClick: () -> Unit): Button = Button(this).apply {
        id = idValue
        setText(textRes)
        setOnClickListener { onClick() }
    }

    private fun body(textRes: Int): TextView = TextView(this).apply {
        setText(textRes)
        setTextColor(Color.rgb(71, 85, 105))
        textSize = 18f
        gravity = Gravity.CENTER
        setPadding(0, 16.dp, 0, 0)
    }

    private fun errorView(): TextView = TextView(this).apply {
        id = R.id.error_region
        contentDescription = getString(R.string.error_region_label)
        setTextColor(Color.rgb(185, 28, 28))
        textSize = 16f
        gravity = Gravity.CENTER
        setPadding(0, 16.dp, 0, 0)
    }

    private fun messageFor(error: ValidationError): Int = when (error) {
        ValidationError.InvalidEmail -> R.string.error_invalid_email
        ValidationError.InvalidPassword -> R.string.error_invalid_password
        ValidationError.InvalidImage -> R.string.error_unexpected
        ValidationError.InvalidDate -> R.string.error_invalid_date
        ValidationError.DateOrder -> R.string.error_date_order
        ValidationError.DeferredDetail -> R.string.error_unexpected
    }

    private fun body(text: String): TextView = TextView(this).apply {
        this.text = text
        setTextColor(Color.rgb(71, 85, 105))
        textSize = 18f
        gravity = Gravity.CENTER
        setPadding(0, 16.dp, 0, 0)
    }

    private fun formatMeasurement(measurement: Measurement): String = getString(
        R.string.history_row_format,
        measurement.measurementTime.ifBlank { measurement.savedAt },
        measurement.systolic,
        measurement.diastolic,
        measurement.pulse,
        getString(
            when (measurement.armSide) {
                ArmSide.Left -> R.string.arm_left
                ArmSide.Right -> R.string.arm_right
                ArmSide.Unknown -> R.string.arm_unknown
            },
        ),
        getString(
            when (measurement.status) {
                MeasurementStatus.Saved -> R.string.measurement_status_saved
                MeasurementStatus.Pending -> R.string.measurement_status_pending
                MeasurementStatus.Failed -> R.string.measurement_status_failed
            },
        ),
    )

    private fun runInBackground(work: () -> Unit) {
        Thread(work).start()
    }

    private val Int.dp: Int
        get() = (this * resources.displayMetrics.density).toInt()
}
