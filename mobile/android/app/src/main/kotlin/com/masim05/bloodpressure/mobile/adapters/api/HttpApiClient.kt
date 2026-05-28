package com.masim05.bloodpressure.mobile.adapters.api

import com.masim05.bloodpressure.mobile.core.model.AppResult
import com.masim05.bloodpressure.mobile.core.model.ArmSide
import com.masim05.bloodpressure.mobile.core.model.HistoryFilter
import com.masim05.bloodpressure.mobile.core.model.Measurement
import com.masim05.bloodpressure.mobile.core.model.MeasurementDetail
import com.masim05.bloodpressure.mobile.core.model.MeasurementImage
import com.masim05.bloodpressure.mobile.core.model.MeasurementStatus
import com.masim05.bloodpressure.mobile.core.model.MobileUser
import com.masim05.bloodpressure.mobile.core.model.Session
import com.masim05.bloodpressure.mobile.core.ports.AuthGateway
import com.masim05.bloodpressure.mobile.core.ports.HistoryGateway
import com.masim05.bloodpressure.mobile.core.ports.MeasurementDetailGateway
import com.masim05.bloodpressure.mobile.core.ports.MeasurementUploadGateway
import java.io.ByteArrayOutputStream
import java.net.HttpURLConnection
import java.net.URI
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.util.Base64

class HttpApiClient(
    private val baseUrl: String,
    private val fallbackApiMessage: String,
    private val networkMessage: String,
    private val timeoutMessage: String,
    private val parseMessage: String,
) : AuthGateway, HistoryGateway, MeasurementUploadGateway, MeasurementDetailGateway {
    override fun signIn(email: String, password: String): AppResult<Session> = authenticate("/api/v1/signin", email, password)

    override fun logIn(email: String, password: String): AppResult<Session> = authenticate("/api/v1/login", email, password)

    override fun upload(session: Session, image: MeasurementImage): AppResult<String> = runCatching {
        val boundary = "----BloodPressureTrackerBoundary"
        val pngBytes = Base64.getDecoder().decode(ONE_PIXEL_PNG_BASE64)
        val body = ByteArrayOutputStream().apply {
            write("--$boundary\r\n".toByteArray())
            write("Content-Disposition: form-data; name=\"image\"; filename=\"measurement.png\"\r\n".toByteArray())
            write("Content-Type: ${image.mimeType}\r\n\r\n".toByteArray())
            write(pngBytes)
            write("\r\n--$boundary--\r\n".toByteArray())
        }.toByteArray()
        val response = request(
            path = "/api/v1/measurements",
            method = "POST",
            body = body,
            contentType = "multipart/form-data; boundary=$boundary",
            authorization = session.authorizationHeader,
        )
        if (response.status in 200..299) {
            AppResult.Success(extractJsonString(response.body, "id") ?: "")
        } else {
            AppResult.Failure(ApiErrorMapper.fromApiBody(response.body, fallbackApiMessage))
        }
    }.getOrElse { AppResult.Failure(ApiErrorMapper.fromThrowable(it, networkMessage, timeoutMessage, parseMessage)) }

    override fun list(session: Session, filter: HistoryFilter): AppResult<List<Measurement>> = runCatching {
        val query = buildList {
            add("page=${filter.page}")
            add("pageSize=${filter.pageSize}")
            if (filter.from.isNotBlank()) add("from=${url(filter.from)}T00%3A00%3A00.000Z")
            if (filter.to.isNotBlank()) add("to=${url(filter.to)}T23%3A59%3A59.999Z")
        }.joinToString("&")
        val response = request("/api/v1/measurements?$query", "GET", authorization = session.authorizationHeader)
        if (response.status in 200..299) {
            AppResult.Success(parseMeasurements(response.body))
        } else {
            AppResult.Failure(ApiErrorMapper.fromApiBody(response.body, fallbackApiMessage))
        }
    }.getOrElse { AppResult.Failure(ApiErrorMapper.fromThrowable(it, networkMessage, timeoutMessage, parseMessage)) }

    override fun get(session: Session, measurementId: String): AppResult<MeasurementDetail> = runCatching {
        val response = request("/api/v1/measurements/${urlPath(measurementId)}", "GET", authorization = session.authorizationHeader)
        if (response.status in 200..299) {
            AppResult.Success(parseMeasurementDetail(response.body))
        } else {
            AppResult.Failure(ApiErrorMapper.fromApiBody(response.body, fallbackApiMessage))
        }
    }.getOrElse { AppResult.Failure(ApiErrorMapper.fromThrowable(it, networkMessage, timeoutMessage, parseMessage)) }

    override fun save(session: Session, detail: MeasurementDetail): AppResult<MeasurementDetail> = runCatching {
        val response = request("/api/v1/measurements/${urlPath(detail.id)}/save", "POST", authorization = session.authorizationHeader)
        if (response.status in 200..299) {
            val saved = parseMeasurementDetail(response.body)
            AppResult.Success(saved.copy(imageUrl = saved.imageUrl.ifBlank { detail.imageUrl }))
        } else {
            AppResult.Failure(ApiErrorMapper.fromApiBody(response.body, fallbackApiMessage))
        }
    }.getOrElse { AppResult.Failure(ApiErrorMapper.fromThrowable(it, networkMessage, timeoutMessage, parseMessage)) }

    private fun authenticate(path: String, email: String, password: String): AppResult<Session> = runCatching {
        val json = "{\"email\":\"${escape(email)}\",\"password\":\"${escape(password)}\"}"
        val response = request(path, "POST", json.toByteArray(), "application/json")
        if (response.status in 200..299) {
            AppResult.Success(parseSession(response.body))
        } else {
            AppResult.Failure(ApiErrorMapper.fromApiBody(response.body, fallbackApiMessage))
        }
    }.getOrElse { AppResult.Failure(ApiErrorMapper.fromThrowable(it, networkMessage, timeoutMessage, parseMessage)) }

    private fun request(
        path: String,
        method: String,
        body: ByteArray? = null,
        contentType: String? = null,
        authorization: String? = null,
    ): HttpResponse {
        val connection = URI.create(baseUrl + path).toURL().openConnection() as HttpURLConnection
        connection.requestMethod = method
        connection.connectTimeout = 5_000
        connection.readTimeout = 10_000
        authorization?.let { connection.setRequestProperty("Authorization", it) }
        contentType?.let { connection.setRequestProperty("Content-Type", it) }
        if (body != null) {
            connection.doOutput = true
            connection.outputStream.use { it.write(body) }
        }
        val status = connection.responseCode
        val stream = if (status in 200..299) connection.inputStream else connection.errorStream
        return HttpResponse(status, stream?.bufferedReader()?.use { it.readText() }.orEmpty())
    }

    private fun parseSession(body: String): Session = Session(
        accessToken = requireNotNull(extractJsonString(body, "accessToken")),
        tokenType = extractJsonString(body, "tokenType") ?: "Bearer",
        expiresAt = requireNotNull(extractJsonString(body, "expiresAt")),
        user = MobileUser(
            id = requireNotNull(extractJsonString(body, "id")),
            email = requireNotNull(extractJsonString(body, "email")),
        ),
    )

    private fun parseMeasurements(body: String): List<Measurement> {
        val items = Regex("\\{[^{}]*\\\"id\\\"[^{}]*\\}").findAll(body).map { it.value }.toList()
        return items.mapNotNull { item ->
            val status = extractJsonString(item, "status") ?: return@mapNotNull null
            Measurement(
                id = extractJsonString(item, "id") ?: return@mapNotNull null,
                status = parseStatus(status),
                systolic = extractJsonInt(item, "systolic") ?: 0,
                diastolic = extractJsonInt(item, "diastolic") ?: 0,
                pulse = extractJsonInt(item, "pulse") ?: 0,
                armSide = when (extractJsonString(item, "armSide")) {
                    "left" -> ArmSide.Left
                    "right" -> ArmSide.Right
                    else -> ArmSide.Unknown
                },
                measurementTime = extractJsonString(item, "measurementTime") ?: "",
                savedAt = extractJsonString(item, "savedAt") ?: "",
            )
        }
    }

    private fun parseMeasurementDetail(body: String): MeasurementDetail = MeasurementDetail(
        id = requireNotNull(extractJsonString(body, "id")),
        status = parseStatus(extractJsonString(body, "status")),
        systolic = extractJsonInt(body, "systolic"),
        diastolic = extractJsonInt(body, "diastolic"),
        pulse = extractJsonInt(body, "pulse"),
        armSide = parseArmSide(extractJsonString(body, "armSide")),
        measurementTime = extractJsonString(body, "measurementTime") ?: "",
        savedAt = extractJsonString(body, "savedAt"),
        imageUrl = extractJsonString(body, "imageUrl") ?: "",
        recognitionError = extractJsonString(body, "recognitionError"),
    )

    private fun parseStatus(status: String?): MeasurementStatus = when (status) {
        "recognizing" -> MeasurementStatus.Recognizing
        "recognized" -> MeasurementStatus.Recognized
        "saved" -> MeasurementStatus.Saved
        "failed" -> MeasurementStatus.Failed
        else -> MeasurementStatus.Pending
    }

    private fun parseArmSide(value: String?): ArmSide = when (value) {
        "left" -> ArmSide.Left
        "right" -> ArmSide.Right
        else -> ArmSide.Unknown
    }

    private fun extractJsonString(body: String, field: String): String? =
        Regex("\\\"$field\\\"\\s*:\\s*\\\"([^\\\"]*)\\\"").find(body)?.groupValues?.get(1)

    private fun extractJsonInt(body: String, field: String): Int? =
        Regex("\\\"$field\\\"\\s*:\\s*(\\d+)").find(body)?.groupValues?.get(1)?.toInt()

    private fun escape(value: String): String = value.replace("\\", "\\\\").replace("\"", "\\\"")
    private fun url(value: String): String = URLEncoder.encode(value, StandardCharsets.UTF_8.name())
    private fun urlPath(value: String): String = URLEncoder.encode(value, StandardCharsets.UTF_8.name()).replace("+", "%20")

    private data class HttpResponse(val status: Int, val body: String)

    companion object {
        private const val ONE_PIXEL_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII="
    }
}