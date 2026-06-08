package com.masim05.bloodpressure.mobile.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.FileUpload
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.masim05.bloodpressure.mobile.R
import com.masim05.bloodpressure.mobile.core.model.ArmSide
import com.masim05.bloodpressure.mobile.core.model.HistoryFilter
import com.masim05.bloodpressure.mobile.core.model.Measurement
import com.masim05.bloodpressure.mobile.ui.TestTags
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

private val PageBg = Color(0xFFF2F2F7)
private val CardBorder = Color(0xFFE5E5E5)
private val InputBorder = Color(0xFFE0E0E0)
private val LabelColor = Color(0xFF999999)
private val SecondaryText = Color(0xFF888888)
private val PrimaryGreen = Color(0xFF1D9E75)
private val Blue = Color(0xFF185FA5)
private val ElevatedRed = Color(0xFFE24B4A)
private val NormalGreen = Color(0xFF639922)

@OptIn(ExperimentalComposeUiApi::class, ExperimentalMaterial3Api::class)
@Composable
fun HistoryScreen(
    filter: HistoryFilter,
    measurements: List<Measurement>,
    lastUploadedMeasurementId: String?,
    isLoading: Boolean,
    errorText: String?,
    onRefresh: () -> Unit,
    onApplyFilter: (HistoryFilter) -> Unit,
    onClearFilter: () -> Unit,
    onExportCsv: () -> Unit,
    onMeasurementSelected: (Measurement) -> Unit,
) {
    var from by remember(filter) { mutableStateOf(filter.from) }
    var to by remember(filter) { mutableStateOf(filter.to) }

    PullToRefreshBox(
        isRefreshing = isLoading,
        onRefresh = onRefresh,
        modifier = Modifier
            .fillMaxSize()
            .testTag(TestTags.HistoryRefresh),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(PageBg)
                .semantics { testTagsAsResourceId = true }
                .padding(16.dp)
                .testTag(TestTags.HistoryScreen),
        ) {
            Text(stringResource(R.string.history_title), style = MaterialTheme.typography.headlineSmall)
            Spacer(Modifier.height(12.dp))

            SectionLabel(stringResource(R.string.history_date_range))
            Spacer(Modifier.height(6.dp))
            CardContainer {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    DateSelectorButton(
                        modifier = Modifier.weight(1f),
                        labelRes = R.string.history_from_hint,
                        selectedFormatRes = R.string.history_from_selected,
                        titleRes = R.string.date_picker_from_title,
                        value = from,
                        testTag = TestTags.HistoryFromDate,
                        onSelected = { from = it },
                    )
                    DateSelectorButton(
                        modifier = Modifier.weight(1f),
                        labelRes = R.string.history_to_hint,
                        selectedFormatRes = R.string.history_to_selected,
                        titleRes = R.string.date_picker_to_title,
                        value = to,
                        testTag = TestTags.HistoryToDate,
                        onSelected = { to = it },
                    )
                }
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                ) {
                    Button(
                        modifier = Modifier
                            .weight(1f)
                            .testTag("history_apply_filter"),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen, contentColor = Color.White),
                        onClick = { onApplyFilter(HistoryFilter(from = from, to = to)) },
                    ) {
                        Text(stringResource(R.string.history_apply_filter))
                    }
                    OutlinedButton(
                        modifier = Modifier
                            .weight(1f)
                            .testTag("history_clear_filter"),
                        shape = RoundedCornerShape(8.dp),
                        border = BorderStroke(0.5.dp, InputBorder),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = SecondaryText),
                        onClick = onClearFilter,
                    ) {
                        Text(stringResource(R.string.history_clear_filter))
                    }
                    OutlinedButton(
                        modifier = Modifier
                            .weight(1f)
                            .testTag(TestTags.HistoryExportCsv),
                        shape = RoundedCornerShape(8.dp),
                        border = BorderStroke(0.5.dp, InputBorder),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Blue),
                        onClick = onExportCsv,
                        enabled = measurements.isNotEmpty() && !isLoading,
                    ) {
                        androidx.compose.material3.Icon(Icons.Outlined.FileUpload, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(Modifier.size(4.dp))
                        Text(stringResource(R.string.history_export_csv))
                    }
                }
            }

            if (errorText != null) {
                Text(
                    modifier = Modifier
                        .padding(top = 12.dp)
                        .testTag(TestTags.HistoryError),
                    text = errorText,
                    color = MaterialTheme.colorScheme.error,
                )
            }

            Spacer(Modifier.height(12.dp))
            SectionLabel(stringResource(R.string.history_readings))
            Spacer(Modifier.height(6.dp))

            val statusRes = historyStatusTextRes(isLoading, measurements)
            if (statusRes != null) {
                CardContainer {
                    Text(
                        modifier = Modifier.padding(vertical = 10.dp),
                        text = stringResource(statusRes),
                        color = SecondaryText,
                    )
                }
            } else {
                CardContainer(modifier = Modifier.weight(1f, fill = false)) {
                    HistoryTable(measurements, lastUploadedMeasurementId, onMeasurementSelected)
                }
                if (showHistoryRefreshLoadingIndicator(isLoading, measurements)) {
                    Text(modifier = Modifier.padding(top = 8.dp), text = stringResource(R.string.status_loading))
                }
            }
        }
    }
}

@Composable
private fun CardContainer(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .border(0.5.dp, CardBorder, RoundedCornerShape(12.dp))
            .background(Color.White, RoundedCornerShape(12.dp))
            .padding(12.dp),
        content = content,
    )
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
private fun HistoryTable(
    measurements: List<Measurement>,
    lastUploadedMeasurementId: String?,
    onMeasurementSelected: (Measurement) -> Unit,
) {
    LazyColumn(
        modifier = Modifier
            .testTag(TestTags.HistoryTable),
    ) {
        item { HistoryHeader() }
        items(measurements) { measurement ->
            HistoryRow(
                measurement = measurement,
                isLastUploadedMeasurement = measurement.id == lastUploadedMeasurementId,
                onMeasurementSelected = onMeasurementSelected,
            )
        }
    }
}

@Composable
private fun HistoryHeader() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        HistoryCell(stringResource(R.string.history_column_time), 2f, true)
        HistoryCell(stringResource(R.string.history_column_systolic), 1f, true)
        HistoryCell(stringResource(R.string.history_column_diastolic), 1f, true)
        HistoryCell(stringResource(R.string.history_column_pulse), 1f, true)
        HistoryCell(stringResource(R.string.history_column_arm), 1f, true)
    }
}

@Composable
private fun HistoryRow(
    measurement: Measurement,
    isLastUploadedMeasurement: Boolean,
    onMeasurementSelected: (Measurement) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .then(if (isLastUploadedMeasurement) Modifier.testTag(TestTags.HistoryLastUploadedRow) else Modifier)
            .clickable { onMeasurementSelected(measurement) }
            .defaultMinSize(minHeight = 48.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
                .testTag(TestTags.HistoryRow),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            HistoryCell(formatHistoryTime(measurement.measurementTime.ifBlank { measurement.savedAt }), 2f)
            HistoryCell(measurement.systolic.toString(), 1f, color = if (measurement.systolic >= 130) ElevatedRed else NormalGreen, medium = true)
            HistoryCell(measurement.diastolic.toString(), 1f, color = Color(0xFF111111), medium = true)
            HistoryCell(measurement.pulse.toString(), 1f, color = SecondaryText)
            HistoryCell(stringResource(armShortLabel(measurement.armSide)), 1f, color = SecondaryText)
        }
        Box(
            Modifier
                .fillMaxWidth()
                .height(0.5.dp)
                .background(Color(0xFFF8F8F8)),
        )
    }
}

@Composable
private fun RowScope.HistoryCell(
    value: String,
    weight: Float,
    header: Boolean = false,
    color: Color = SecondaryText,
    medium: Boolean = false,
) {
    Text(
        modifier = Modifier.weight(weight),
        text = value,
        textAlign = TextAlign.Start,
        color = if (header) LabelColor else color,
        fontSize = if (header) 10.sp else if (medium) 12.sp else 11.sp,
        fontWeight = when {
            header -> FontWeight.Medium
            medium -> FontWeight.Medium
            else -> FontWeight.Normal
        },
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DateSelectorButton(
    modifier: Modifier,
    labelRes: Int,
    selectedFormatRes: Int,
    titleRes: Int,
    value: String,
    testTag: String,
    onSelected: (String) -> Unit,
) {
    var showDialog by remember { mutableStateOf(false) }
    val text = if (value.isBlank()) stringResource(labelRes) else stringResource(selectedFormatRes, value)
    OutlinedButton(
        modifier = modifier.testTag(testTag),
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(0.5.dp, InputBorder),
        onClick = { showDialog = true },
    ) {
        Text(text, color = SecondaryText, fontSize = 12.sp)
    }
    if (showDialog) {
        val pickerState = rememberDatePickerState(initialSelectedDateMillis = value.toDateMillis())
        DatePickerDialog(
            onDismissRequest = { showDialog = false },
            confirmButton = {
                TextButton(
                    modifier = Modifier.testTag("date_picker_confirm"),
                    onClick = {
                        pickerState.selectedDateMillis?.let { onSelected(it.toIsoDate()) }
                        showDialog = false
                    },
                ) { Text(stringResource(R.string.date_picker_confirm)) }
            },
            dismissButton = {
                TextButton(
                    modifier = Modifier.testTag("date_picker_cancel"),
                    onClick = { showDialog = false },
                ) { Text(stringResource(R.string.date_picker_cancel)) }
            },
        ) {
            Column(Modifier.padding(16.dp)) {
                Text(stringResource(titleRes), style = MaterialTheme.typography.titleLarge)
                DatePicker(state = pickerState)
            }
        }
    }
}

private fun String.toDateMillis(): Long? = runCatching {
    if (isBlank()) null else LocalDate.parse(this).atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli()
}.getOrNull()

private fun Long.toIsoDate(): String = Instant.ofEpochMilli(this).atZone(ZoneId.systemDefault()).toLocalDate().toString()

private val historyTimeFormatterInput: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")
private val historyTimeFormatterOutput: DateTimeFormatter = DateTimeFormatter.ofPattern("MM-dd HH:mm")

internal fun formatHistoryTime(
    value: String,
    deviceZoneId: ZoneId = ZoneId.systemDefault(),
): String {
    if (value.isBlank()) return value
    val isoInstant = runCatching {
        Instant.parse(value).atZone(deviceZoneId).format(historyTimeFormatterOutput)
    }.getOrNull()
    if (isoInstant != null) {
        return isoInstant
    }
    return runCatching { LocalDateTime.parse(value, historyTimeFormatterInput).format(historyTimeFormatterOutput) }
        .getOrDefault(value)
}

private fun armShortLabel(armSide: ArmSide): Int = when (armSide) {
    ArmSide.Left -> R.string.arm_short_left
    ArmSide.Right -> R.string.arm_short_right
    ArmSide.Unknown -> R.string.arm_short_unknown
}

internal fun showHistoryRefreshLoadingIndicator(isLoading: Boolean, measurements: List<Measurement>): Boolean {
    return isLoading && measurements.isNotEmpty()
}

internal fun historyStatusTextRes(isLoading: Boolean, measurements: List<Measurement>): Int? {
    return if (measurements.isEmpty()) {
        if (isLoading) R.string.status_loading else R.string.history_empty
    } else {
        null
    }
}
