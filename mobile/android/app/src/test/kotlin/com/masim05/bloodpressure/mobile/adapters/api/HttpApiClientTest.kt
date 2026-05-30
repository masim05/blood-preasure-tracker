package com.masim05.bloodpressure.mobile.adapters.api

import com.masim05.bloodpressure.mobile.core.model.AppResult
import com.masim05.bloodpressure.mobile.core.model.ArmSide
import com.masim05.bloodpressure.mobile.core.model.HistoryFilter
import com.masim05.bloodpressure.mobile.core.model.MeasurementDetail
import com.masim05.bloodpressure.mobile.core.model.MeasurementImage
import com.masim05.bloodpressure.mobile.core.model.MeasurementStatus
import com.masim05.bloodpressure.mobile.core.model.MobileUser
import com.masim05.bloodpressure.mobile.core.model.Session
import java.net.ServerSocket
import java.nio.charset.StandardCharsets
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class HttpApiClientTest {
    private lateinit var client: HttpApiClient
    private lateinit var server: TestHttpServer

    @Before
    fun setUp() {
        server = TestHttpServer()
        client = HttpApiClient(
            baseUrl = "http://127.0.0.1:${server.port}",
            fallbackApiMessage = "Unexpected API error",
            networkMessage = "Network error",
            timeoutMessage = "Timeout",
            parseMessage = "Parse error",
        )
    }

    @After
    fun tearDown() {
        server.close()
    }

    @Test
    fun `signIn posts credentials and parses session`() {
        server.enqueue(
            201,
            """
                {"accessToken":"token-1","tokenType":"Bearer","expiresAt":"2026-05-27T12:00:00.000Z","user":{"id":"usr_1","email":"user@example.com"}}
            """.trimIndent(),
        )

        val result = client.signIn("user@example.com", "password123")
        val session = (result as AppResult.Success).value

        assertEquals("token-1", session.accessToken)
        assertEquals("usr_1", session.user.id)
        assertTrue(server.request.body.contains("\"email\":\"user@example.com\""))
    }

    @Test
    fun `signIn defaults token type and maps malformed success to parse error`() {
        server.enqueue(
            201,
            """
            {"accessToken":"token-1","expiresAt":"2026-05-27T12:00:00.000Z","user":{"id":"usr_1","email":"user@example.com"}}
            """.trimIndent(),
        )

        val result = client.signIn("quoted\\user@example.com", "pass\"word123")
        val session = (result as AppResult.Success).value

        assertEquals("Bearer", session.tokenType)
        assertTrue(server.request.body.contains("quoted\\\\user@example.com"))
        assertTrue(server.request.body.contains("pass\\\"word123"))

        server.close()
        server = TestHttpServer()
        client = HttpApiClient("http://127.0.0.1:${server.port}", "Unexpected API error", "Network error", "Timeout", "Parse error")
        server.enqueue(201, "{}")

        val malformed = client.signIn("user@example.com", "password123") as AppResult.Failure

        assertEquals("Parse error", malformed.error.message)
    }

    @Test
    fun `logIn surfaces API message on unauthorized response`() {
        server.enqueue(401, "{\"error\":\"unauthorized\",\"message\":\"Invalid credentials\"}")

        val result = client.logIn("user@example.com", "password123")
        val failure = result as AppResult.Failure

        assertEquals("unauthorized", failure.error.code)
        assertEquals("Invalid credentials", failure.error.message)
    }

    @Test
    fun `logIn parses successful session`() {
        server.enqueue(
            201,
            """
                {"accessToken":"token-2","tokenType":"Bearer","expiresAt":"2026-05-27T12:00:00.000Z","user":{"id":"usr_2","email":"known@example.com"}}
            """.trimIndent(),
        )

        val result = client.logIn("known@example.com", "password123")
        val session = (result as AppResult.Success).value

        assertEquals("token-2", session.accessToken)
        assertEquals("known@example.com", session.user.email)
        assertTrue(server.request.body.contains("\"password\":\"password123\""))
    }

    @Test
    fun `auth maps closed connection to network error`() {
        server.close()

        val result = client.logIn("known@example.com", "password123") as AppResult.Failure

        assertEquals("Network error", result.error.message)
    }

    @Test
    fun `list sends authorization and filter query then parses saved rows`() {
        server.enqueue(
            200,
            """
                {"items":[{"id":"msr_1","status":"saved","systolic":120,"diastolic":80,"pulse":68,"armSide":"left","measurementTime":"2026-05-27T12:00:00.000Z","savedAt":"2026-05-27T12:05:00.000Z"}],"page":1,"pageSize":20,"total":1}
            """.trimIndent(),
        )

        val result = client.list(session(), HistoryFilter(from = "2026-05-01", to = "2026-05-31"))
        val measurements = (result as AppResult.Success).value

        assertEquals("Bearer token-1", server.request.authorization)
        assertTrue(server.request.query.contains("from=2026-05-01"))
        assertTrue(server.request.query.contains("to=2026-05-31"))
        assertEquals(MeasurementStatus.Saved, measurements.single().status)
        assertEquals(ArmSide.Left, measurements.single().armSide)
    }

    @Test
    fun `upload sends multipart image with authorization`() {
        server.enqueue(201, "{\"id\":\"msr_1\",\"status\":\"pending\",\"measurementTime\":\"2026-05-27T12:00:00.000Z\"}")
        val imageFile = tempImageFile("measurement.png", "png-bytes")

        val result = client.upload(session(), MeasurementImage(imageFile.toURI().toString(), "image/png", imageFile.length()))
        val id = (result as AppResult.Success).value

        assertEquals("msr_1", id)
        assertEquals("Bearer token-1", server.request.authorization)
        assertTrue(server.request.contentType.startsWith("multipart/form-data"))
        assertTrue(server.request.body.contains("filename=\"${imageFile.name}\""))
        assertTrue(server.request.body.contains("png-bytes"))
    }

    @Test
    fun `upload surfaces API validation failure`() {
        server.enqueue(400, "{\"error\":\"validation_error\",\"message\":\"Image is required\"}")
        val imageFile = tempImageFile("measurement.png", "png-bytes")

        val result = client.upload(session(), MeasurementImage(imageFile.toURI().toString(), "image/png", imageFile.length()))
        val failure = result as AppResult.Failure

        assertEquals("validation_error", failure.error.code)
        assertEquals("Image is required", failure.error.message)
    }

    @Test
    fun `upload falls back when API error body has no message`() {
        server.enqueue(500, "{\"error\":\"server_error\"}")
        val imageFile = tempImageFile("measurement.png", "png-bytes")

        val result = client.upload(session(), MeasurementImage(imageFile.toURI().toString(), "image/png", imageFile.length()))
        val failure = result as AppResult.Failure

        assertEquals("server_error", failure.error.code)
        assertEquals("Unexpected API error", failure.error.message)
    }

    @Test
    fun `upload supports absolute file path URIs`() {
        server.enqueue(201, "{\"id\":\"msr_1\"}")
        val imageFile = tempImageFile("measurement.png", "path-bytes")

        val result = client.upload(session(), MeasurementImage(imageFile.absolutePath, "image/png", imageFile.length()))
        val id = (result as AppResult.Success).value

        assertEquals("msr_1", id)
        assertTrue(server.request.body.contains("filename=\"${imageFile.name}\""))
        assertTrue(server.request.body.contains("path-bytes"))
    }

    @Test
    fun `upload maps unsupported URI scheme to parse error`() {
        val result = client.upload(session(), MeasurementImage("generated://measurement.png", "image/png", 68))
        val failure = result as AppResult.Failure

        assertEquals("Parse error", failure.error.message)
    }

    @Test
    fun `list supports empty filters and pending or failed rows`() {
        server.enqueue(
            200,
            """
            {"items":[{"id":"msr_1","status":"failed","armSide":"right"},{"id":"msr_2","status":"pending"}],"page":1,"pageSize":20,"total":2}
            """.trimIndent(),
        )

        val result = client.list(session(), HistoryFilter())
        val measurements = (result as AppResult.Success).value

        assertEquals("page=1&pageSize=20", server.request.query)
        assertEquals(MeasurementStatus.Failed, measurements.first().status)
        assertEquals(ArmSide.Right, measurements.first().armSide)
        assertEquals(MeasurementStatus.Pending, measurements.last().status)
        assertEquals(ArmSide.Unknown, measurements.last().armSide)
        assertEquals(0, measurements.last().systolic)
    }

    @Test
    fun `list surfaces API failure`() {
        server.enqueue(401, "{\"error\":\"unauthorized\",\"message\":\"Missing bearer token\"}")

        val result = client.list(session(), HistoryFilter())
        val failure = result as AppResult.Failure

        assertEquals("unauthorized", failure.error.code)
        assertEquals("Missing bearer token", failure.error.message)
    }

    @Test
    fun `get measurement detail sends authorization and parses recognized values`() {
        server.enqueue(
            200,
            """
            {"id":"msr_1","status":"recognized","systolic":120,"diastolic":80,"pulse":68,"armSide":"left","measurementTime":"2026-05-27T12:00:00.000Z","imageUrl":"/api/v1/measurements/msr_1/image"}
            """.trimIndent(),
        )

        val result = client.get(session(), "msr_1")
        val detail = (result as AppResult.Success).value

        assertEquals("Bearer token-1", server.request.authorization)
        assertEquals("/api/v1/measurements/msr_1", server.request.path)
        assertEquals(MeasurementStatus.Recognized, detail.status)
        assertEquals(120, detail.systolic)
        assertEquals("/api/v1/measurements/msr_1/image", detail.imageUrl)
    }

    @Test
    fun `save measurement detail posts save endpoint and preserves image url`() {
        server.enqueue(
            201,
            """
            {"id":"msr_1","status":"saved","systolic":121,"diastolic":81,"pulse":69,"armSide":"right","measurementTime":"2026-05-27T12:00:00.000Z","savedAt":"2026-05-27T12:05:00.000Z"}
            """.trimIndent(),
        )

        val result = client.save(
            session(),
            MeasurementDetail(
                id = "msr_1",
                status = MeasurementStatus.Recognized,
                systolic = 121,
                diastolic = 81,
                pulse = 69,
                armSide = ArmSide.Right,
                measurementTime = "2026-05-27T12:00:00.000Z",
                savedAt = null,
                imageUrl = "/api/v1/measurements/msr_1/image",
                recognitionError = null,
            ),
        )
        val detail = (result as AppResult.Success).value

        assertEquals("/api/v1/measurements/msr_1/save", server.request.path)
        assertEquals(MeasurementStatus.Saved, detail.status)
        assertEquals(ArmSide.Right, detail.armSide)
        assertEquals("/api/v1/measurements/msr_1/image", detail.imageUrl)
    }

    @Test
    fun `measurement detail supports pending recognizing failed and API failures`() {
        server.enqueue(
            200,
            """
            {"id":"msr_2","status":"recognizing","measurementTime":"2026-05-27T12:00:00.000Z","imageUrl":"/image"}
            """.trimIndent(),
        )
        val recognizing = (client.get(session(), "msr_2") as AppResult.Success).value
        assertEquals(MeasurementStatus.Recognizing, recognizing.status)
        assertEquals(ArmSide.Unknown, recognizing.armSide)
        assertEquals(null, recognizing.systolic)

        server.close()
        server = TestHttpServer()
        client = HttpApiClient("http://127.0.0.1:${server.port}", "Unexpected API error", "Network error", "Timeout", "Parse error")
        server.enqueue(404, "{\"error\":\"not_found\",\"message\":\"Measurement not found\"}")
        val getFailure = client.get(session(), "missing") as AppResult.Failure
        assertEquals("Measurement not found", getFailure.error.message)

        server.close()
        server = TestHttpServer()
        client = HttpApiClient("http://127.0.0.1:${server.port}", "Unexpected API error", "Network error", "Timeout", "Parse error")
        server.enqueue(409, "{\"error\":\"conflict\",\"message\":\"Measurement must be recognized before it can be saved\"}")
        val saveFailure = client.save(session(), detailForSave()) as AppResult.Failure
        assertEquals("conflict", saveFailure.error.code)
    }

    @Test
    fun `measurement detail maps closed connections to network errors`() {
        server.close()

        val getFailure = client.get(session(), "msr_1") as AppResult.Failure
        val saveFailure = client.save(session(), detailForSave()) as AppResult.Failure

        assertEquals("Network error", getFailure.error.message)
        assertEquals("Network error", saveFailure.error.message)
    }

    @Test
    fun `measurement detail maps malformed success to parse error`() {
        server.enqueue(200, "{}")

        val result = client.get(session(), "msr_1") as AppResult.Failure

        assertEquals("Parse error", result.error.message)
    }

    private fun session(): Session = Session(
        accessToken = "token-1",
        tokenType = "Bearer",
        expiresAt = "2026-05-27T12:00:00.000Z",
        user = MobileUser("usr_1", "user@example.com"),
    )

    private fun detailForSave(): MeasurementDetail = MeasurementDetail(
        id = "msr_1",
        status = MeasurementStatus.Recognized,
        systolic = 121,
        diastolic = 81,
        pulse = 69,
        armSide = ArmSide.Right,
        measurementTime = "2026-05-27T12:00:00.000Z",
        savedAt = null,
        imageUrl = "/api/v1/measurements/msr_1/image",
        recognitionError = null,
    )

    private fun tempImageFile(name: String, content: String): java.io.File {
        val file = kotlin.io.path.createTempFile(prefix = "http-api-client-", suffix = name).toFile()
        file.writeText(content, StandardCharsets.UTF_8)
        file.deleteOnExit()
        return file
    }

    private data class RecordedRequest(
        val path: String,
        val body: String,
        val authorization: String,
        val contentType: String,
        val query: String,
    )

    private class TestHttpServer : AutoCloseable {
        private val socket = ServerSocket(0)
        private val latch = CountDownLatch(1)
        private var status = 200
        private var body = "{}"
        lateinit var request: RecordedRequest
            private set

        val port: Int = socket.localPort

        fun enqueue(status: Int, body: String) {
            this.status = status
            this.body = body
            Thread {
                socket.accept().use { connection ->
                    val input = connection.getInputStream()
                    val headerBytes = mutableListOf<Byte>()
                    while (!headerBytes.endsWithHeaderTerminator()) {
                        headerBytes += input.read().toByte()
                    }
                    val headerText = headerBytes.toByteArray().toString(Charsets.ISO_8859_1)
                    val headerLines = headerText.split("\r\n")
                    val requestLine = headerLines.first()
                    val headers = mutableMapOf<String, String>()
                    var contentLength = 0
                    headerLines.drop(1).forEach { line ->
                        val separator = line.indexOf(':')
                        if (separator > 0) {
                            val name = line.substring(0, separator)
                            val value = line.substring(separator + 1).trim()
                            headers[name] = value
                            if (name.equals("Content-Length", ignoreCase = true)) contentLength = value.toInt()
                        }
                    }
                    val requestBody = ByteArray(contentLength).let { bytes ->
                        var offset = 0
                        while (offset < contentLength) {
                            val read = input.read(bytes, offset, contentLength - offset)
                            if (read < 0) break
                            offset += read
                        }
                        bytes.copyOf(offset).toString(Charsets.ISO_8859_1)
                    }
                    request = RecordedRequest(
                        path = requestLine.substringAfter(' ').substringBefore('?').substringBefore(' '),
                        body = requestBody,
                        authorization = headers["Authorization"].orEmpty(),
                        contentType = headers["Content-Type"].orEmpty(),
                        query = requestLine.substringAfter('?').substringBefore(' '),
                    )
                    val responseBytes = body.toByteArray()
                    connection.getOutputStream().use { output ->
                        output.write("HTTP/1.1 $status OK\r\nContent-Length: ${responseBytes.size}\r\nConnection: close\r\n\r\n".toByteArray())
                        output.write(responseBytes)
                    }
                    latch.countDown()
                }
            }.start()
        }

        private fun MutableList<Byte>.endsWithHeaderTerminator(): Boolean =
            size >= 4 && this[size - 4] == '\r'.code.toByte() && this[size - 3] == '\n'.code.toByte() &&
                this[size - 2] == '\r'.code.toByte() && this[size - 1] == '\n'.code.toByte()

        override fun close() {
            latch.await(1, TimeUnit.SECONDS)
            socket.close()
        }
    }
}
