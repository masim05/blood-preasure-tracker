package com.masim05.bloodpressure.mobile.core.ports

import com.masim05.bloodpressure.mobile.core.model.AppResult
import com.masim05.bloodpressure.mobile.core.model.HistoryFilter
import com.masim05.bloodpressure.mobile.core.model.Measurement
import com.masim05.bloodpressure.mobile.core.model.MeasurementDetail
import com.masim05.bloodpressure.mobile.core.model.MeasurementImage
import com.masim05.bloodpressure.mobile.core.model.Session

interface AuthGateway {
    fun signIn(email: String, password: String): AppResult<Session>
    fun logIn(email: String, password: String): AppResult<Session>
}

interface SessionStore {
    fun save(session: Session)
    fun load(): Session?
    fun loadError(): String?
    fun clear()
}

interface MeasurementUploadGateway {
    fun upload(session: Session, image: MeasurementImage): AppResult<String>
}

interface HistoryGateway {
    fun list(session: Session, filter: HistoryFilter): AppResult<List<Measurement>>
}

interface MeasurementDetailGateway {
    fun get(session: Session, measurementId: String): AppResult<MeasurementDetail>
    fun save(session: Session, detail: MeasurementDetail): AppResult<MeasurementDetail>
}

interface CameraGateway {
    fun isReady(): Boolean
    fun openCamera(): AppResult<MeasurementImage>
}