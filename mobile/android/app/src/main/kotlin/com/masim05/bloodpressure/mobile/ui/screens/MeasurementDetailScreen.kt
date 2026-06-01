package com.masim05.bloodpressure.mobile.ui.screens

import android.graphics.BitmapFactory
import androidx.compose.foundation.background
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.masim05.bloodpressure.mobile.R
import com.masim05.bloodpressure.mobile.core.model.AppResult
import com.masim05.bloodpressure.mobile.core.model.ArmSide
import com.masim05.bloodpressure.mobile.core.model.MeasurementDetail
import com.masim05.bloodpressure.mobile.core.model.MeasurementStatus
import com.masim05.bloodpressure.mobile.ui.TestTags
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@OptIn(ExperimentalComposeUiApi::class)
@Composable
fun MeasurementDetailScreen(
    detail: MeasurementDetail?,
    isLoading: Boolean,
    isSaving: Boolean,
    errorText: String?,
    apiBaseUrl: String,
    loadMeasurementImage: (String) -> AppResult<ByteArray>,
    onBack: () -> Unit,
    onSave: (MeasurementDetail) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .semantics { testTagsAsResourceId = true }
            .padding(16.dp)
            .testTag(TestTags.MeasurementDetailScreen),
    ) {
        Text(stringResource(R.string.detail_title), style = MaterialTheme.typography.headlineMedium)
        if (errorText != null) {
            Text(
                modifier = Modifier
                    .padding(top = 12.dp)
                    .testTag(TestTags.MeasurementDetailError),
                text = errorText,
                color = MaterialTheme.colorScheme.error,
            )
        }
        if (isLoading || detail == null) {
            Text(modifier = Modifier.padding(top = 16.dp), text = stringResource(R.string.status_loading))
            Spacer(Modifier.weight(1f))
            OutlinedButton(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag(TestTags.MeasurementDetailBack),
                onClick = onBack,
            ) { Text(stringResource(R.string.detail_back)) }
            return@Column
        }

        var systolic by remember(detail.id, detail.systolic) { mutableStateOf(detail.systolic?.toString().orEmpty()) }
        var diastolic by remember(detail.id, detail.diastolic) { mutableStateOf(detail.diastolic?.toString().orEmpty()) }
        var pulse by remember(detail.id, detail.pulse) { mutableStateOf(detail.pulse?.toString().orEmpty()) }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(3f)
                .padding(top = 16.dp)
                .background(MaterialTheme.colorScheme.surfaceVariant)
                .testTag(TestTags.MeasurementDetailImage),
            contentAlignment = Alignment.Center,
        ) {
            MeasurementImage(
                imageUrl = detail.imageUrl,
                apiBaseUrl = apiBaseUrl,
                loadMeasurementImage = loadMeasurementImage,
            )
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                NumberField(
                    modifier = Modifier.weight(1f),
                    value = systolic,
                    label = stringResource(R.string.detail_systolic),
                    testTag = TestTags.MeasurementDetailSystolic,
                    onValueChange = { systolic = it },
                )
                NumberField(
                    modifier = Modifier.weight(1f),
                    value = diastolic,
                    label = stringResource(R.string.detail_diastolic),
                    testTag = TestTags.MeasurementDetailDiastolic,
                    onValueChange = { diastolic = it },
                )
                NumberField(
                    modifier = Modifier.weight(1f),
                    value = pulse,
                    label = stringResource(R.string.detail_pulse),
                    testTag = TestTags.MeasurementDetailPulse,
                    onValueChange = { pulse = it },
                )
            }
            Text(stringResource(R.string.detail_arm_side, stringResource(armLabel(detail.armSide))))
            Text(stringResource(R.string.detail_status, stringResource(statusLabel(detail.status))))
            detail.recognitionError?.takeIf { it.isNotBlank() }?.let {
                Text(text = stringResource(R.string.detail_recognition_error, it), color = MaterialTheme.colorScheme.error)
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(
                modifier = Modifier
                    .weight(1f)
                    .testTag(TestTags.MeasurementDetailBack),
                onClick = onBack,
            ) { Text(stringResource(R.string.detail_back)) }
            Button(
                modifier = Modifier
                    .weight(1f)
                    .testTag(TestTags.MeasurementDetailSave),
                enabled = !isSaving,
                onClick = {
                    onSave(
                        detail.copy(
                            systolic = systolic.toIntOrNull() ?: detail.systolic,
                            diastolic = diastolic.toIntOrNull() ?: detail.diastolic,
                            pulse = pulse.toIntOrNull() ?: detail.pulse,
                        ),
                    )
                },
            ) { Text(stringResource(if (isSaving) R.string.status_loading else R.string.detail_save)) }
        }
    }
}

@Composable
private fun MeasurementImage(
    imageUrl: String,
    apiBaseUrl: String,
    loadMeasurementImage: (String) -> AppResult<ByteArray>,
) {
    val resolvedImageUrl = resolveMeasurementImageUrl(imageUrl, apiBaseUrl)
    var bitmap by remember(resolvedImageUrl) { mutableStateOf<ImageBitmap?>(null) }
    var imageErrorText by remember(resolvedImageUrl) { mutableStateOf<String?>(null) }
    var isLoading by remember(resolvedImageUrl) { mutableStateOf(resolvedImageUrl != null) }

    LaunchedEffect(resolvedImageUrl) {
        if (resolvedImageUrl == null) {
            bitmap = null
            imageErrorText = null
            isLoading = false
            return@LaunchedEffect
        }

        isLoading = true
        imageErrorText = null
        val result = loadMeasurementBitmap(resolvedImageUrl, loadMeasurementImage)
        when (result) {
            is AppResult.Success -> {
                bitmap = result.value
                imageErrorText = null
            }
            is AppResult.Failure -> {
                bitmap = null
                imageErrorText = result.error.message
            }
        }
        isLoading = false
    }

    val loadedBitmap = bitmap
    if (loadedBitmap != null) {
        Image(
            bitmap = loadedBitmap,
            contentDescription = stringResource(R.string.detail_image_content_description),
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Fit,
        )
    } else if (isLoading) {
        Text(
            text = stringResource(R.string.status_loading),
            style = MaterialTheme.typography.bodyMedium,
        )
    } else if (imageErrorText != null) {
        Text(
            text = imageErrorText ?: "",
            color = MaterialTheme.colorScheme.error,
            style = MaterialTheme.typography.bodyMedium,
        )
    } else {
        Text(
            text = stringResource(R.string.detail_image_unavailable),
            style = MaterialTheme.typography.bodyMedium,
        )
    }
}

private suspend fun loadMeasurementBitmap(
    resolvedImageUrl: String,
    loadMeasurementImage: (String) -> AppResult<ByteArray>,
): AppResult<ImageBitmap?> = withContext(Dispatchers.IO) {
    when (val imageResult = loadMeasurementImage(resolvedImageUrl)) {
        is AppResult.Success -> {
            AppResult.Success(
                BitmapFactory.decodeByteArray(imageResult.value, 0, imageResult.value.size)?.asImageBitmap(),
            )
        }
        is AppResult.Failure -> imageResult
    }
}

@Composable
private fun NumberField(
    modifier: Modifier,
    value: String,
    label: String,
    testTag: String,
    onValueChange: (String) -> Unit,
) {
    OutlinedTextField(
        modifier = modifier.testTag(testTag),
        value = value,
        onValueChange = onValueChange,
        singleLine = true,
        label = { Text(label) },
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
    )
}

private fun armLabel(armSide: ArmSide): Int = when (armSide) {
    ArmSide.Left -> R.string.arm_left
    ArmSide.Right -> R.string.arm_right
    ArmSide.Unknown -> R.string.arm_unknown
}

private fun statusLabel(status: MeasurementStatus): Int = when (status) {
    MeasurementStatus.Pending -> R.string.measurement_status_pending
    MeasurementStatus.Recognizing -> R.string.measurement_status_recognizing
    MeasurementStatus.Recognized -> R.string.measurement_status_recognized
    MeasurementStatus.Saved -> R.string.measurement_status_saved
    MeasurementStatus.Failed -> R.string.measurement_status_failed
}

internal fun resolveMeasurementImageUrl(imageUrl: String, apiBaseUrl: String): String? {
    val trimmed = imageUrl.trim()
    if (trimmed.isBlank()) {
        return null
    }
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed
    }
    val normalizedBase = apiBaseUrl.trimEnd('/')
    val normalizedPath = if (trimmed.startsWith('/')) trimmed else "/$trimmed"
    return "$normalizedBase$normalizedPath"
}
