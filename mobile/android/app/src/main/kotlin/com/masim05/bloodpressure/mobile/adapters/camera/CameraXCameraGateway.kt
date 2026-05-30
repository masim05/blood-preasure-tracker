package com.masim05.bloodpressure.mobile.adapters.camera

import com.masim05.bloodpressure.mobile.core.model.ApiError
import com.masim05.bloodpressure.mobile.core.model.ApiErrorSource
import com.masim05.bloodpressure.mobile.core.model.AppResult
import com.masim05.bloodpressure.mobile.core.model.MeasurementImage
import com.masim05.bloodpressure.mobile.core.ports.CameraGateway

class CameraXCameraGateway : CameraGateway {
    private var nextCapture: AppResult<MeasurementImage>? = null

    override fun isReady(): Boolean = nextCapture != null

    fun publishCapture(image: MeasurementImage) {
        nextCapture = AppResult.Success(image)
    }

    fun publishFailure(message: String) {
        nextCapture = AppResult.Failure(
            ApiError(
                code = "camera_capture_failed",
                message = message,
                source = ApiErrorSource.Unexpected,
            ),
        )
    }

    override fun openCamera(): AppResult<MeasurementImage> {
        val capture = nextCapture
        nextCapture = null
        return capture ?: AppResult.Failure(
            ApiError(
                code = "camera_not_ready",
                message = "Camera is not ready for capture.",
                source = ApiErrorSource.Unexpected,
            ),
        )
    }
}
