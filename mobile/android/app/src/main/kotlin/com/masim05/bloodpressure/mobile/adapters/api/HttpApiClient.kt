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
import java.io.File
import java.net.HttpURLConnection
import java.net.URI
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

class HttpApiClient(
    private val baseUrl: String,
    private val fallbackApiMessage: String,
    private val networkMessage: String,
    private val timeoutMessage: String,
    private val parseMessage: String,
) : AuthGateway, HistoryGateway, MeasurementUploadGateway, MeasurementDetailGateway {
    fun fetchMeasurementImage(imageUrl: String, authorization: String): AppResult<ByteArray> = runCatching {
        val response = requestBytes(url = imageUrl, method = "GET", authorization = authorization, accept = "image/*")
        if (response.status in 200..299) {
            AppResult.Success(response.body)
        } else {
            AppResult.Failure(ApiErrorMapper.fromApiBody(response.body.toString(StandardCharsets.UTF_8), fallbackApiMessage))
        }
    }.getOrElse { AppResult.Failure(ApiErrorMapper.fromThrowable(it, networkMessage, timeoutMessage, parseMessage)) }

    override fun signIn(email: String, password: String): AppResult<Session> = authenticate("/api/v1/signin", email, password)

    override fun logIn(email: String, password: String): AppResult<Session> = authenticate("/api/v1/login", email, password)

    override fun upload(session: Session, image: MeasurementImage): AppResult<String> = runCatching {
        val boundary = "----BloodPressureTrackerBoundary"
        val imageBytes = readImageBytes(image)
        val filename = resolveFilename(image.uri)
        val body = ByteArrayOutputStream().apply {
            write("--$boundary\r\n".toByteArray())
            write("Content-Disposition: form-data; name=\"image\"; filename=\"$filename\"\r\n".toByteArray())
            write("Content-Type: ${image.mimeType}\r\n\r\n".toByteArray())
            write(imageBytes)
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
        val response = request(
            path = "/api/v1/measurements/${urlPath(detail.id)}/save",
            method = "POST",
            body = saveMeasurementBody(detail).toByteArray(StandardCharsets.UTF_8),
            contentType = "application/json",
            authorization = session.authorizationHeader,
        )
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
        return try {
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
            HttpResponse(status, stream?.bufferedReader()?.use { it.readText() }.orEmpty())
        } finally {
            connection.disconnect()
        }
    }

    private fun requestBytes(
        url: String,
        method: String,
        authorization: String? = null,
        accept: String? = null,
    ): HttpBytesResponse {
        val connection = URI.create(url).toURL().openConnection() as HttpURLConnection
        return try {
            connection.requestMethod = method
            connection.connectTimeout = 5_000
            connection.readTimeout = 10_000
            authorization?.let { connection.setRequestProperty("Authorization", it) }
            accept?.let { connection.setRequestProperty("Accept", it) }
            val status = connection.responseCode
            val stream = if (status in 200..299) connection.inputStream else connection.errorStream
            HttpBytesResponse(status, stream?.use { it.readBytes() } ?: ByteArray(0))
        } finally {
            connection.disconnect()
        }
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
    private fun saveMeasurementBody(detail: MeasurementDetail): String = buildList {
        detail.systolic?.let { add("\"systolic\":$it") }
        detail.diastolic?.let { add("\"diastolic\":$it") }
        detail.pulse?.let { add("\"pulse\":$it") }
    }.joinToString(separator = ",", prefix = "{", postfix = "}")

    private fun readImageBytes(image: MeasurementImage): ByteArray {
        val imageUri = URI.create(image.uri)
        if (imageUri.scheme == null || imageUri.scheme == "file") {
            val file = if (imageUri.scheme == null) {
                File(image.uri)
            } else {
                File(imageUri)
            }
            require(file.exists() && file.isFile) { "Image file is unavailable" }
            return file.readBytes()
        }
        throw IllegalArgumentException("Unsupported image URI scheme: ${imageUri.scheme}")
    }

    private fun resolveFilename(uri: String): String {
        val parsed = URI.create(uri)
        val fromPath = parsed.path?.substringAfterLast('/')?.takeIf { it.isNotBlank() }
        if (fromPath != null) {
            return fromPath
        }
        return "measurement"
    }

    private data class HttpResponse(val status: Int, val body: String)
    private data class HttpBytesResponse(val status: Int, val body: ByteArray)
}