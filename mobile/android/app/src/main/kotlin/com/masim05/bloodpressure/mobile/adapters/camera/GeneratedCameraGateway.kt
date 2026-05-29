package com.masim05.bloodpressure.mobile.adapters.camera

import com.masim05.bloodpressure.mobile.core.model.AppResult
import com.masim05.bloodpressure.mobile.core.model.MeasurementImage
import com.masim05.bloodpressure.mobile.core.ports.CameraGateway

class GeneratedCameraGateway : CameraGateway {
    override fun isReady(): Boolean = true

    override fun openCamera(): AppResult<MeasurementImage> = AppResult.Success(
        MeasurementImage(
            uri = "generated://measurement.png",
            mimeType = "image/png",
            sizeBytes = 68,
        ),
    )
}