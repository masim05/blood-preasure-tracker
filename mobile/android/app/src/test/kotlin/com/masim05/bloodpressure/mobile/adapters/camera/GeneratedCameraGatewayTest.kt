package com.masim05.bloodpressure.mobile.adapters.camera

import com.masim05.bloodpressure.mobile.core.model.AppResult
import org.junit.Assert.assertEquals
import org.junit.Test

class GeneratedCameraGatewayTest {
    @Test
    fun returnsUploadablePngMetadata() {
        val result = GeneratedCameraGateway().openCamera() as AppResult.Success

        assertEquals("generated://measurement.png", result.value.uri)
        assertEquals("image/png", result.value.mimeType)
        assertEquals(68, result.value.sizeBytes)
    }
}
