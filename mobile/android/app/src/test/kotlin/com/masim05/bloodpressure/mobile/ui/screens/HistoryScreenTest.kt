package com.masim05.bloodpressure.mobile.ui.screens

import com.masim05.bloodpressure.mobile.R
import com.masim05.bloodpressure.mobile.core.model.ArmSide
import com.masim05.bloodpressure.mobile.core.model.Measurement
import com.masim05.bloodpressure.mobile.core.model.MeasurementStatus
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Test
import java.time.ZoneOffset

class HistoryScreenTest {
    @Test
    fun formatsIsoTimestampForHistoryTableInDeviceTimezone() {
        assertEquals("2026-05-31 19:31", formatHistoryTime("2026-05-31T17:31:42.000Z", ZoneOffset.ofHours(2)))
    }

    @Test
    fun keepsAlreadyFormattedTimestamp() {
        assertEquals("2026-05-31 17:31", formatHistoryTime("2026-05-31 17:31"))
    }

    @Test
    fun keepsUnknownTimestampValuesUnchanged() {
        assertEquals("invalid-time", formatHistoryTime("invalid-time"))
    }

    @Test
    fun refreshLoadingIndicatorShowsWithoutHidingExistingRows() {
        val measurements = listOf(sampleMeasurement())

        assertTrue(showHistoryRefreshLoadingIndicator(isLoading = true, measurements = measurements))
        assertNull(historyStatusTextRes(isLoading = true, measurements = measurements))
    }

    @Test
    fun historyStatusUsesLoadingOnlyWhenNoRowsYet() {
        assertEquals(R.string.status_loading, historyStatusTextRes(isLoading = true, measurements = emptyList()))
        assertEquals(R.string.history_empty, historyStatusTextRes(isLoading = false, measurements = emptyList()))
    }

    @Test
    fun refreshLoadingIndicatorHiddenWhenNotRefreshing() {
        assertFalse(showHistoryRefreshLoadingIndicator(isLoading = false, measurements = listOf(sampleMeasurement())))
    }

    private fun sampleMeasurement() = Measurement(
        id = "msr_1",
        status = MeasurementStatus.Saved,
        systolic = 120,
        diastolic = 80,
        pulse = 70,
        armSide = ArmSide.Left,
        measurementTime = "2026-05-31T17:31:42.000Z",
        savedAt = "2026-05-31T17:31:42.000Z",
    )
}
