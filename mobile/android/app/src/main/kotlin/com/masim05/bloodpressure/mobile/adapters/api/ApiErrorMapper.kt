package com.masim05.bloodpressure.mobile.adapters.api

import com.masim05.bloodpressure.mobile.core.model.ApiError
import com.masim05.bloodpressure.mobile.core.model.ApiErrorSource
import java.net.SocketTimeoutException
import java.net.UnknownHostException

object ApiErrorMapper {
    fun fromApiBody(body: String?, fallbackMessage: String): ApiError {
        val message = body?.let { extractJsonString(it, "message") }?.takeIf { it.isNotBlank() } ?: fallbackMessage
        val code = body?.let { extractJsonString(it, "error") }?.takeIf { it.isNotBlank() }
        return ApiError(code = code, message = message, source = ApiErrorSource.Api)
    }

    fun fromThrowable(error: Throwable, networkMessage: String, timeoutMessage: String, parseMessage: String): ApiError =
        when (error) {
            is SocketTimeoutException -> ApiError(null, timeoutMessage, ApiErrorSource.Timeout)
            is UnknownHostException -> ApiError(null, networkMessage, ApiErrorSource.Network)
            is IllegalArgumentException -> ApiError(null, parseMessage, ApiErrorSource.Parse)
            else -> ApiError(null, networkMessage, ApiErrorSource.Network)
        }

    private fun extractJsonString(body: String, field: String): String? {
        val pattern = Regex("\\\"$field\\\"\\s*:\\s*\\\"([^\\\"]*)\\\"")
        return pattern.find(body)?.groupValues?.get(1)?.replace("\\\\\"", "\"")
    }
}