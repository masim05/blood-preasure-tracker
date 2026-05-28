package com.masim05.bloodpressure.mobile.core.model

data class MobileUser(
    val id: String,
    val email: String,
)

data class Session(
    val accessToken: String,
    val tokenType: String,
    val expiresAt: String,
    val user: MobileUser,
) {
    val authorizationHeader: String = "$tokenType $accessToken"
}

data class MeasurementImage(
    val uri: String,
    val mimeType: String,
    val sizeBytes: Long,
)

enum class ArmSide {
    Left,
    Right,
    Unknown,
}

enum class MeasurementStatus {
    Pending,
    Saved,
    Failed,
}

data class Measurement(
    val id: String,
    val status: MeasurementStatus,
    val systolic: Int,
    val diastolic: Int,
    val pulse: Int,
    val armSide: ArmSide,
    val measurementTime: String,
    val savedAt: String,
)

data class HistoryFilter(
    val from: String = "",
    val to: String = "",
    val page: Int = 1,
    val pageSize: Int = 20,
)

data class PasswordInput(
    val value: String,
    val usesPlatformMasking: Boolean = true,
)

data class HistoryTableRow(
    val measurementTimeColumn: String,
    val systolicColumn: String,
    val diastolicColumn: String,
    val pulseColumn: String,
    val armSideColumn: String,
    val statusColumn: String,
)

enum class ApiErrorSource {
    Api,
    Network,
    Timeout,
    Parse,
    Unexpected,
}

data class ApiError(
    val code: String?,
    val message: String,
    val source: ApiErrorSource,
)

sealed class AppResult<out T> {
    data class Success<T>(val value: T) : AppResult<T>()
    data class Failure(val error: ApiError) : AppResult<Nothing>()
}