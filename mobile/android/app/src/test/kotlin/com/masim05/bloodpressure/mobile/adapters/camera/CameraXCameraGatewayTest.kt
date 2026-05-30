package com.masim05.bloodpressure.mobile.adapters.camera

import com.masim05.bloodpressure.mobile.core.model.AppResult
import com.masim05.bloodpressure.mobile.core.model.MeasurementImage
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class CameraXCameraGatewayTest {
    @Test
    fun returnsPublishedCaptureAndConsumesIt() {
        val gateway = CameraXCameraGateway()
        val image = MeasurementImage(
            uri = "content://capture/1",
            mimeType = "image/jpeg",
            sizeBytes = 42,
        )

        gateway.publishCapture(image)

        assertTrue(gateway.isReady())

        val first = gateway.openCamera()
        val second = gateway.openCamera()

        assertTrue(first is AppResult.Success)
        assertEquals("content://capture/1", (first as AppResult.Success).value.uri)
        assertTrue(second is AppResult.Failure)
        assertTrue(!gateway.isReady())
    }

    @Test
    fun returnsPublishedFailureAsCameraResult() {
        val gateway = CameraXCameraGateway()

        gateway.publishFailure("Camera capture failed")

        val result = gateway.openCamera()

        assertTrue(result is AppResult.Failure)
        assertEquals("Camera capture failed", (result as AppResult.Failure).error.message)
    }
}
