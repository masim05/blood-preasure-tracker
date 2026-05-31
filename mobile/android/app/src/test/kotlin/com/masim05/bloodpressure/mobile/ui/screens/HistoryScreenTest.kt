package com.masim05.bloodpressure.mobile.ui.screens

import org.junit.Assert.assertEquals
import org.junit.Test

class HistoryScreenTest {
    @Test
    fun formatsIsoTimestampForHistoryTable() {
        assertEquals("2026-05-31 17:31", formatHistoryTime("2026-05-31T17:31:42.000Z"))
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
