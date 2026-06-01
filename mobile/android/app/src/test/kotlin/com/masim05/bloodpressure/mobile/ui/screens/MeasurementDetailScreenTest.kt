package com.masim05.bloodpressure.mobile.ui.screens

import com.masim05.bloodpressure.mobile.core.model.ArmSide
import com.masim05.bloodpressure.mobile.core.model.MeasurementDetail
import com.masim05.bloodpressure.mobile.core.model.MeasurementStatus
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class MeasurementDetailScreenTest {
    @Test
    fun resolvesBlankImageUrlAsUnavailable() {
        assertNull(resolveMeasurementImageUrl("   ", "http://10.0.2.2:3000"))
    }

    @Test
    fun keepsAbsoluteImageUrlUnchanged() {
        assertEquals(
            "https://cdn.example.com/image.jpg",
            resolveMeasurementImageUrl("https://cdn.example.com/image.jpg", "http://10.0.2.2:3000"),
        )
    }

    @Test
    fun resolvesRelativeImageUrlAgainstApiBaseUrl() {
        assertEquals(
            "http://10.0.2.2:3000/api/v1/measurements/msr_1/image",
            resolveMeasurementImageUrl("/api/v1/measurements/msr_1/image", "http://10.0.2.2:3000/"),
        )
    }

    @Test
    fun refreshKeepsEditableDetailVisibleWhileLoading() {
        val detail = sampleDetail()

        assertFalse(shouldShowDetailLoadingPlaceholder(detail))
        assertTrue(showDetailRefreshLoadingIndicator(isLoading = true, detail = detail))
    }

    @Test
    fun showsPlaceholderWhenDetailMissing() {
        assertTrue(shouldShowDetailLoadingPlaceholder(null))
        assertFalse(showDetailRefreshLoadingIndicator(isLoading = true, detail = null))
    }

    private fun sampleDetail() = MeasurementDetail(
        id = "msr_1",
        status = MeasurementStatus.Saved,
        systolic = 120,
        diastolic = 80,
        pulse = 68,
        armSide = ArmSide.Left,
        measurementTime = "2026-05-28T08:10:00.000Z",
        savedAt = "2026-05-28T08:10:00.000Z",
        imageUrl = "/api/v1/measurements/msr_1/image",
        recognitionError = null,
    )
}
