package com.masim05.bloodpressure.mobile.ui.screens

import android.graphics.BitmapFactory
import android.graphics.Matrix
import androidx.exifinterface.media.ExifInterface
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.masim05.bloodpressure.mobile.R
import com.masim05.bloodpressure.mobile.core.model.AppResult
import com.masim05.bloodpressure.mobile.core.model.ArmSide
import com.masim05.bloodpressure.mobile.core.model.MeasurementDetail
import com.masim05.bloodpressure.mobile.core.model.MeasurementStatus
import com.masim05.bloodpressure.mobile.ui.TestTags
import java.io.ByteArrayInputStream
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

private val PageBg = Color(0xFFF2F2F7)
private val CardBorder = Color(0xFFE5E5E5)
private val InputBorder = Color(0xFFE0E0E0)
private val LabelColor = Color(0xFF999999)
private val PrimaryGreen = Color(0xFF1D9E75)

@OptIn(ExperimentalComposeUiApi::class, ExperimentalMaterial3Api::class)
@Composable
fun MeasurementDetailScreen(
    detail: MeasurementDetail?,
    isLoading: Boolean,
    isSaving: Boolean,
    errorText: String?,
    apiBaseUrl: String,
    loadMeasurementImage: (String) -> AppResult<ByteArray>,
    onRefresh: () -> Unit,
    onBack: () -> Unit,
    onSave: (MeasurementDetail) -> Unit,
) {
    PullToRefreshBox(
        isRefreshing = isLoading,
        onRefresh = onRefresh,
        modifier = Modifier
            .fillMaxSize()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(PageBg)
                .verticalScroll(rememberScrollState())
                .semantics { testTagsAsResourceId = true }
                .padding(16.dp)
                .testTag(TestTags.MeasurementDetailScreen),
        ) {
            Text(stringResource(R.string.detail_title), style = MaterialTheme.typography.headlineSmall)
            if (errorText != null) {
                Text(
                    modifier = Modifier
                        .padding(top = 12.dp)
                        .testTag(TestTags.MeasurementDetailError),
                    text = errorText,
                    color = MaterialTheme.colorScheme.error,
                )
            }
            if (shouldShowDetailLoadingPlaceholder(detail)) {
                Text(modifier = Modifier.padding(top = 16.dp), text = stringResource(R.string.status_loading))
                OutlinedButton(
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag(TestTags.MeasurementDetailBack),
                    onClick = onBack,
                ) { Text(stringResource(R.string.detail_back)) }
                return@Column
            }
            if (showDetailRefreshLoadingIndicator(isLoading, detail)) {
                Text(modifier = Modifier.padding(top = 16.dp), text = stringResource(R.string.status_loading))
            }

            val measurementDetail = detail ?: return@Column

            var systolic by remember(measurementDetail.id, measurementDetail.systolic) {
                mutableStateOf(measurementDetail.systolic?.toString().orEmpty())
            }
            var diastolic by remember(measurementDetail.id, measurementDetail.diastolic) {
                mutableStateOf(measurementDetail.diastolic?.toString().orEmpty())
            }
            var pulse by remember(measurementDetail.id, measurementDetail.pulse) {
                mutableStateOf(measurementDetail.pulse?.toString().orEmpty())
            }
            var armSide by remember(measurementDetail.id, measurementDetail.armSide) {
                mutableStateOf(measurementDetail.armSide)
            }

            Spacer(Modifier.height(12.dp))
            SectionLabel(stringResource(R.string.detail_image_content_description))
            Spacer(Modifier.height(6.dp))
            CardContainer(
                modifier = Modifier
                    .testTag(TestTags.MeasurementDetailImage),
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(260.dp)
                        .background(MaterialTheme.colorScheme.surfaceVariant),
                    contentAlignment = Alignment.Center,
                ) {
                    MeasurementImage(
                        imageUrl = measurementDetail.imageUrl,
                        apiBaseUrl = apiBaseUrl,
                        loadMeasurementImage = loadMeasurementImage,
                    )
                }
            }

            Spacer(Modifier.height(12.dp))
            SectionLabel(stringResource(R.string.detail_title))
            Spacer(Modifier.height(6.dp))
            CardContainer(
                modifier = Modifier
                    .fillMaxWidth(),
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
                ArmSideDropdown(
                    selectedArmSide = armSide,
                    onArmSideSelected = { armSide = it },
                )
                Text(stringResource(R.string.detail_status, stringResource(statusLabel(measurementDetail.status))))
                measurementDetail.recognitionError?.takeIf { it.isNotBlank() }?.let {
                    Text(text = stringResource(R.string.detail_recognition_error, it), color = MaterialTheme.colorScheme.error)
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    modifier = Modifier
                        .weight(1f)
                        .testTag(TestTags.MeasurementDetailBack),
                    border = androidx.compose.foundation.BorderStroke(0.5.dp, InputBorder),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = LabelColor),
                    onClick = onBack,
                ) { Text(stringResource(R.string.detail_back)) }
                Button(
                    modifier = Modifier
                        .weight(1f)
                        .testTag(TestTags.MeasurementDetailSave),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen, contentColor = Color.White),
                    enabled = !isSaving,
                    onClick = {
                        onSave(
                            measurementDetail.copy(
                                systolic = systolic.toIntOrNull() ?: measurementDetail.systolic,
                                diastolic = diastolic.toIntOrNull() ?: measurementDetail.diastolic,
                                pulse = pulse.toIntOrNull() ?: measurementDetail.pulse,
                                armSide = armSide,
                            ),
                        )
                    },
                ) { Text(stringResource(if (isSaving) R.string.status_loading else R.string.detail_save)) }
            }
        }
    }
}

@Composable
private fun SectionLabel(text: String) {
    Text(
        text = text,
        color = LabelColor,
        fontSize = 10.sp,
        fontWeight = FontWeight.Medium,
        letterSpacing = 0.6.sp,
    )
}

@Composable
private fun CardContainer(
    modifier: Modifier = Modifier,
    verticalArrangement: Arrangement.Vertical = Arrangement.Top,
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .border(0.5.dp, CardBorder, RoundedCornerShape(12.dp))
            .background(Color.White, RoundedCornerShape(12.dp))
            .padding(12.dp),
        verticalArrangement = verticalArrangement,
        content = content,
    )
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
            modifier = Modifier
                .fillMaxSize()
                .testTag(TestTags.MeasurementDetailImageLoaded),
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
            val rotationDegrees = extractExifRotationDegrees(imageResult.value)
            AppResult.Success(
                rotateBitmap(
                    BitmapFactory.decodeByteArray(imageResult.value, 0, imageResult.value.size),
                    rotationDegrees,
                )?.asImageBitmap(),
            )
        }
        is AppResult.Failure -> imageResult
    }
}

private fun rotateBitmap(bitmap: android.graphics.Bitmap?, rotationDegrees: Float): android.graphics.Bitmap? {
    if (bitmap == null || rotationDegrees == 0f) {
        return bitmap
    }
    return Matrix().let { matrix ->
        matrix.postRotate(rotationDegrees)
        android.graphics.Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    }
}

private fun extractExifRotationDegrees(imageBytes: ByteArray): Float {
    return runCatching {
        ByteArrayInputStream(imageBytes).use { input ->
            ExifInterface(input).rotationDegrees.toFloat()
        }
    }.getOrDefault(0f)
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ArmSideDropdown(
    selectedArmSide: ArmSide,
    onArmSideSelected: (ArmSide) -> Unit,
) {
    var expanded by remember { mutableStateOf(false) }
    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { expanded = !expanded },
    ) {
        OutlinedTextField(
            modifier = Modifier
                .fillMaxWidth()
                .menuAnchor()
                .testTag(TestTags.MeasurementDetailArmSide),
            value = stringResource(armLabel(selectedArmSide)),
            onValueChange = {},
            readOnly = true,
            label = { Text(stringResource(R.string.detail_arm_side_label)) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
        )
        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
        ) {
            listOf(ArmSide.Left, ArmSide.Right, ArmSide.Unknown).forEach { option ->
                DropdownMenuItem(
                    text = { Text(stringResource(armLabel(option))) },
                    onClick = {
                        onArmSideSelected(option)
                        expanded = false
                    },
                )
            }
        }
    }
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

internal fun shouldShowDetailLoadingPlaceholder(detail: MeasurementDetail?): Boolean {
    return detail == null
}

internal fun showDetailRefreshLoadingIndicator(isLoading: Boolean, detail: MeasurementDetail?): Boolean {
    return isLoading && detail != null
}
