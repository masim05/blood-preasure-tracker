package com.masim05.bloodpressure.mobile.ui.screens

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
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
}
