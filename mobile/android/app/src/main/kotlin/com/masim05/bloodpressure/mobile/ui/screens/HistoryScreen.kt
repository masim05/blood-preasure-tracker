package com.masim05.bloodpressure.mobile.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.masim05.bloodpressure.mobile.R
import com.masim05.bloodpressure.mobile.core.model.ArmSide
import com.masim05.bloodpressure.mobile.core.model.HistoryFilter
import com.masim05.bloodpressure.mobile.core.model.Measurement
import com.masim05.bloodpressure.mobile.core.model.MeasurementStatus
import com.masim05.bloodpressure.mobile.ui.TestTags
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

@OptIn(ExperimentalComposeUiApi::class)
@Composable
fun HistoryScreen(
    filter: HistoryFilter,
    measurements: List<Measurement>,
    isLoading: Boolean,
    errorText: String?,
    onApplyFilter: (HistoryFilter) -> Unit,
    onClearFilter: () -> Unit,
    onBack: () -> Unit,
) {
    var from by remember(filter) { mutableStateOf(filter.from) }
    var to by remember(filter) { mutableStateOf(filter.to) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .semantics { testTagsAsResourceId = true }
            .padding(16.dp)
            .testTag(TestTags.HistoryScreen),
    ) {
        Text(stringResource(R.string.history_title), style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(12.dp))
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
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 8.dp)) {
            Button(
                modifier = Modifier.testTag("history_apply_filter"),
                onClick = { onApplyFilter(HistoryFilter(from = from, to = to)) },
            ) {
                Text(stringResource(R.string.history_apply_filter))
            }
            OutlinedButton(
                modifier = Modifier.testTag("history_clear_filter"),
                onClick = onClearFilter,
            ) {
                Text(stringResource(R.string.history_clear_filter))
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
        if (isLoading) {
            Text(modifier = Modifier.padding(top = 16.dp), text = stringResource(R.string.status_loading))
        } else if (measurements.isEmpty()) {
            Text(modifier = Modifier.padding(top = 16.dp), text = stringResource(R.string.history_empty))
        } else {
            HistoryTable(measurements)
        }
        Spacer(Modifier.height(12.dp))
        OutlinedButton(
            modifier = Modifier
                .fillMaxWidth()
                .testTag("history_return"),
            onClick = onBack,
        ) {
            Text(stringResource(R.string.history_return))
        }
    }
}

@Composable
private fun HistoryTable(measurements: List<Measurement>) {
    LazyColumn(
        modifier = Modifier
            .padding(top = 16.dp)
            .testTag(TestTags.HistoryTable),
    ) {
        item { HistoryHeader() }
        items(measurements) { measurement -> HistoryRow(measurement) }
    }
}

@Composable
private fun HistoryHeader() {
    Row(modifier = Modifier.fillMaxWidth()) {
        HistoryCell(stringResource(R.string.history_column_time), 2f, true)
        HistoryCell(stringResource(R.string.history_column_systolic), 1f, true)
        HistoryCell(stringResource(R.string.history_column_diastolic), 1f, true)
        HistoryCell(stringResource(R.string.history_column_pulse), 1f, true)
        HistoryCell(stringResource(R.string.history_column_arm), 1f, true)
        HistoryCell(stringResource(R.string.history_column_status), 1f, true)
    }
}

@Composable
private fun HistoryRow(measurement: Measurement) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 8.dp)
            .testTag(TestTags.HistoryRow),
    ) {
        HistoryCell(measurement.measurementTime.ifBlank { measurement.savedAt }, 2f)
        HistoryCell(measurement.systolic.toString(), 1f)
        HistoryCell(measurement.diastolic.toString(), 1f)
        HistoryCell(measurement.pulse.toString(), 1f)
        HistoryCell(stringResource(armLabel(measurement.armSide)), 1f)
        HistoryCell(stringResource(statusLabel(measurement.status)), 1f)
    }
}

@Composable
private fun RowScope.HistoryCell(value: String, weight: Float, header: Boolean = false) {
    Text(
        modifier = Modifier.weight(weight),
        text = value,
        style = MaterialTheme.typography.bodySmall,
        fontWeight = if (header) FontWeight.Bold else FontWeight.Normal,
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
        onClick = { showDialog = true },
    ) { Text(text) }
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
    if (isBlank()) null else LocalDate.parse(this).atStartOfDay().toInstant(ZoneOffset.UTC).toEpochMilli()
}.getOrNull()

private fun Long.toIsoDate(): String = Instant.ofEpochMilli(this).atZone(ZoneOffset.UTC).toLocalDate().toString()

private fun armLabel(armSide: ArmSide): Int = when (armSide) {
    ArmSide.Left -> R.string.arm_left
    ArmSide.Right -> R.string.arm_right
    ArmSide.Unknown -> R.string.arm_unknown
}

private fun statusLabel(status: MeasurementStatus): Int = when (status) {
    MeasurementStatus.Saved -> R.string.measurement_status_saved
    MeasurementStatus.Pending -> R.string.measurement_status_pending
    MeasurementStatus.Failed -> R.string.measurement_status_failed
}