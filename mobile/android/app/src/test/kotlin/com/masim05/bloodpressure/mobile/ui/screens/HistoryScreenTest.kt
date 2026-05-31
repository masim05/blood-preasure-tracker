package com.masim05.bloodpressure.mobile.ui.screens

import org.junit.Assert.assertEquals
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
}
