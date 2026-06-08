// HttpApiClientTests.swift
// Blood pressure trackerTests
// Mirrors Android HttpApiClientTest.kt
// Uses a POSIX socket-based TestHTTPServer to serve canned responses.

import Testing
import Foundation
@testable import Blood_pressure_tracker

// MARK: - TestHTTPServer

private class TestHTTPServer {
    private let serverSocket: Int32
    let port: Int
    private var responseQueue: [(status: Int, body: Data, contentType: String)] = []
    private var recordedRequests: [RecordedRequest] = []
    private let queueLock = NSLock()
    private let requestsLock = NSLock()
    private let serverSemaphore = DispatchSemaphore(value: 0)
    private var isClosed = false

    struct RecordedRequest {
        let path: String
        let body: String
        let authorization: String
        let contentType: String
        let query: String
    }

    var request: RecordedRequest {
        requestsLock.lock()
        defer { requestsLock.unlock() }
        return recordedRequests.last!
    }

    var requests: [RecordedRequest] {
        requestsLock.lock()
        defer { requestsLock.unlock() }
        return recordedRequests
    }

    init() throws {
        var addr = sockaddr_in()
        addr.sin_family = sa_family_t(AF_INET)
        addr.sin_addr.s_addr = INADDR_ANY.bigEndian
        addr.sin_port = 0

        let sock = socket(AF_INET, SOCK_STREAM, 0)
        guard sock >= 0 else { throw TestServerError.socketFailed }

        var optVal: Int32 = 1
        setsockopt(sock, SOL_SOCKET, SO_REUSEADDR, &optVal, socklen_t(MemoryLayout<Int32>.size))

        let bindResult = withUnsafePointer(to: &addr) {
            $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
                bind(sock, $0, socklen_t(MemoryLayout<sockaddr_in>.size))
            }
        }
        guard bindResult == 0 else { Darwin.close(sock); throw TestServerError.bindFailed }
        guard listen(sock, 10) == 0 else { Darwin.close(sock); throw TestServerError.listenFailed }

        var boundAddr = sockaddr_in()
        var addrLen = socklen_t(MemoryLayout<sockaddr_in>.size)
        withUnsafeMutablePointer(to: &boundAddr) {
            $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
                getsockname(sock, $0, &addrLen)
            }
        }
        self.port = Int(boundAddr.sin_port.bigEndian)
        self.serverSocket = sock

        DispatchQueue.global(qos: .utility).async { [weak self] in
            self?.acceptLoop()
        }
    }

    func enqueue(status: Int, body: String) {
        queueLock.lock()
        responseQueue.append((status: status, body: Data(body.utf8), contentType: "application/json"))
        queueLock.unlock()
    }

    func enqueueBinary(status: Int, body: Data, contentType: String = "application/octet-stream") {
        queueLock.lock()
        responseQueue.append((status: status, body: body, contentType: contentType))
        queueLock.unlock()
    }

    func close() {
        isClosed = true
        Darwin.close(serverSocket)
    }

    private func acceptLoop() {
        while !isClosed {
            let clientSock = accept(serverSocket, nil, nil)
            if clientSock < 0 { break }
            handleConnection(clientSock)
        }
    }

    private func handleConnection(_ clientSock: Int32) {
        defer { Darwin.close(clientSock) }

        // Read headers
        var headerBytes = [UInt8]()
        while !headerEndsAt(headerBytes) {
            var byte: UInt8 = 0
            let n = read(clientSock, &byte, 1)
            if n <= 0 { return }
            headerBytes.append(byte)
        }

        let headerText = String(bytes: headerBytes, encoding: .isoLatin1) ?? ""
        let headerLines = headerText.components(separatedBy: "\r\n")
        let requestLine = headerLines.first ?? ""

        var headers: [String: String] = [:]
        var contentLength = 0
        for line in headerLines.dropFirst() {
            let sep = line.firstIndex(of: ":") ?? line.endIndex
            if sep != line.endIndex {
                let name = String(line[line.startIndex..<sep])
                let value = String(line[line.index(after: sep)...]).trimmingCharacters(in: .whitespaces)
                headers[name.lowercased()] = value
                if name.lowercased() == "content-length" { contentLength = Int(value) ?? 0 }
            }
        }

        var bodyData = [UInt8](repeating: 0, count: contentLength)
        var offset = 0
        while offset < contentLength {
            let n = read(clientSock, &bodyData[offset], contentLength - offset)
            if n <= 0 { break }
            offset += n
        }

        let bodyString = String(bytes: bodyData.prefix(offset), encoding: .isoLatin1) ?? ""
        let pathWithQuery = requestLine.components(separatedBy: " ").dropFirst().first ?? "/"
        let path = pathWithQuery.components(separatedBy: "?").first ?? pathWithQuery
        let query = pathWithQuery.contains("?") ? String(pathWithQuery.dropFirst(path.count + 1)) : ""

        let recorded = RecordedRequest(
            path: path,
            body: bodyString,
            authorization: headers["authorization"] ?? "",
            contentType: headers["content-type"] ?? "",
            query: query
        )
        requestsLock.lock()
        recordedRequests.append(recorded)
        requestsLock.unlock()

        // Dequeue response
        queueLock.lock()
        let response = responseQueue.isEmpty ? nil : responseQueue.removeFirst()
        queueLock.unlock()

        guard let resp = response else { return }

        let statusLine = "HTTP/1.1 \(resp.status) OK\r\n"
        let headers2 = "Content-Length: \(resp.body.count)\r\nContent-Type: \(resp.contentType)\r\nConnection: close\r\n\r\n"
        let headersData = (statusLine + headers2).data(using: .utf8)!

        _ = headersData.withUnsafeBytes { ptr in
            write(clientSock, ptr.baseAddress!, ptr.count)
        }
        _ = resp.body.withUnsafeBytes { ptr in
            write(clientSock, ptr.baseAddress!, ptr.count)
        }
    }

    private func headerEndsAt(_ bytes: [UInt8]) -> Bool {
        guard bytes.count >= 4 else { return false }
        let n = bytes.count
        return bytes[n-4] == 0x0D && bytes[n-3] == 0x0A &&
               bytes[n-2] == 0x0D && bytes[n-1] == 0x0A
    }

    enum TestServerError: Error {
        case socketFailed, bindFailed, listenFailed
    }
}

// MARK: - HttpApiClientTests

struct HttpApiClientTests {
    // MARK: Helpers

    private func makeSession() -> Session {
        Session(accessToken: "tok1", tokenType: "Bearer", expiresAt: "2026-05-27T12:00:00.000Z", user: MobileUser(id: "usr_1", email: "user@example.com"))
    }

    private func detailForSave() -> MeasurementDetail {
        MeasurementDetail(
            id: "msr_1",
            status: .recognized,
            systolic: 121,
            diastolic: 81,
            pulse: 69,
            armSide: .right,
            measurementTime: "2026-05-27T12:00:00.000Z",
            savedAt: nil,
            imageUrl: "/api/v1/measurements/msr_1/image",
            recognitionError: nil
        )
    }

    private func tempImageFile(name: String, content: String) throws -> URL {
        let dir = FileManager.default.temporaryDirectory
        let url = dir.appendingPathComponent("http-api-client-\(Int.random(in: 10000...99999))\(name)")
        try content.write(to: url, atomically: true, encoding: .utf8)
        return url
    }

    // MARK: Sign In

    @Test func signInPostsCredentialsAndParsesSession() throws {
        let server = try TestHTTPServer()
        defer { server.close() }
        let client = HttpApiClient(baseUrl: "http://127.0.0.1:\(server.port)", fallbackApiMessage: "Unexpected API error", networkMessage: "Network error", timeoutMessage: "Timeout", parseMessage: "Parse error")

        server.enqueue(status: 201, body: "{\"accessToken\":\"tok1\",\"tokenType\":\"Bearer\",\"expiresAt\":\"2026-05-27T12:00:00.000Z\",\"user\":{\"id\":\"usr_1\",\"email\":\"user@example.com\"}}")

        let result = client.signIn(email: "user@example.com", password: "password123")
        guard case .success(let session) = result else { Issue.record("Expected success"); return }

        #expect(session.accessToken == "tok1")
        #expect(session.user.id == "usr_1")
        #expect(server.request.body.contains("\"email\":\"user@example.com\""))
    }

    @Test func signInDefaultsTokenTypeAndMapsMalformedSuccessToParseError() throws {
        let server = try TestHTTPServer()
        defer { server.close() }
        let client = HttpApiClient(baseUrl: "http://127.0.0.1:\(server.port)", fallbackApiMessage: "Unexpected API error", networkMessage: "Network error", timeoutMessage: "Timeout", parseMessage: "Parse error")

        server.enqueue(status: 201, body: "{\"accessToken\":\"tok1\",\"expiresAt\":\"2026-05-27T12:00:00.000Z\",\"user\":{\"id\":\"usr_1\",\"email\":\"user@example.com\"}}")
        let result = client.signIn(email: "quoted\\\\user@example.com", password: "pass\\\"word123")
        guard case .success(let session) = result else { Issue.record("Expected success"); return }
        #expect(session.tokenType == "Bearer")
        #expect(server.request.body.contains("quoted\\\\\\\\user@example.com"))
        #expect(server.request.body.contains("pass\\\\\\\"word123"))

        server.close()
        let server2 = try TestHTTPServer()
        defer { server2.close() }
        let client2 = HttpApiClient(baseUrl: "http://127.0.0.1:\(server2.port)", fallbackApiMessage: "Unexpected API error", networkMessage: "Network error", timeoutMessage: "Timeout", parseMessage: "Parse error")
        server2.enqueue(status: 201, body: "{}")
        let malformed = client2.signIn(email: "user@example.com", password: "password123")
        guard case .failure(let err) = malformed else { Issue.record("Expected failure"); return }
        #expect(err.message == "Parse error")
    }

    @Test func logInSurfacesApiMessageOnUnauthorizedResponse() throws {
        let server = try TestHTTPServer()
        defer { server.close() }
        let client = HttpApiClient(baseUrl: "http://127.0.0.1:\(server.port)", fallbackApiMessage: "Unexpected API error", networkMessage: "Network error", timeoutMessage: "Timeout", parseMessage: "Parse error")

        server.enqueue(status: 401, body: "{\"error\":\"unauthorized\",\"message\":\"Invalid credentials\"}")
        let result = client.logIn(email: "user@example.com", password: "password123")
        guard case .failure(let err) = result else { Issue.record("Expected failure"); return }
        #expect(err.code == "unauthorized")
        #expect(err.message == "Invalid credentials")
    }

    @Test func logInParsesSuccessfulSession() throws {
        let server = try TestHTTPServer()
        defer { server.close() }
        let client = HttpApiClient(baseUrl: "http://127.0.0.1:\(server.port)", fallbackApiMessage: "Unexpected API error", networkMessage: "Network error", timeoutMessage: "Timeout", parseMessage: "Parse error")

        server.enqueue(status: 201, body: "{\"accessToken\":\"tok2\",\"tokenType\":\"Bearer\",\"expiresAt\":\"2026-05-27T12:00:00.000Z\",\"user\":{\"id\":\"usr_2\",\"email\":\"known@example.com\"}}")
        let result = client.logIn(email: "known@example.com", password: "password123")
        guard case .success(let session) = result else { Issue.record("Expected success"); return }
        #expect(session.accessToken == "tok2")
        #expect(session.user.email == "known@example.com")
        #expect(server.request.body.contains("\"password\":\"password123\""))
    }

    @Test func authMapsClosedConnectionToNetworkError() throws {
        let closedServer = try TestHTTPServer()
        let closedPort = closedServer.port
        closedServer.close()

        let client = HttpApiClient(baseUrl: "http://127.0.0.1:\(closedPort)", fallbackApiMessage: "Unexpected API error", networkMessage: "Network error", timeoutMessage: "Timeout", parseMessage: "Parse error")
        let result = client.logIn(email: "known@example.com", password: "password123")
        guard case .failure(let err) = result else { Issue.record("Expected failure"); return }
        #expect(err.message == "Network error")
    }

    @Test func listSendsAuthorizationAndFilterQueryThenParsesSavedRows() throws {
        let server = try TestHTTPServer()
        defer { server.close() }
        let client = HttpApiClient(baseUrl: "http://127.0.0.1:\(server.port)", fallbackApiMessage: "Unexpected API error", networkMessage: "Network error", timeoutMessage: "Timeout", parseMessage: "Parse error")

        server.enqueue(status: 200, body: "{\"items\":[{\"id\":\"msr_1\",\"status\":\"saved\",\"systolic\":120,\"diastolic\":80,\"pulse\":68,\"armSide\":\"left\",\"measurementTime\":\"2026-05-27T12:00:00.000Z\",\"savedAt\":\"2026-05-27T12:05:00.000Z\"}],\"page\":1,\"pageSize\":20,\"total\":1}")

        let result = client.list(session: makeSession(), filter: HistoryFilter(from: "2026-05-01", to: "2026-05-31"))
        guard case .success(let measurements) = result else { Issue.record("Expected success"); return }

        #expect(server.request.authorization == makeSession().authorizationHeader)
        #expect(server.request.query.contains("from=2026-05-01"))
        #expect(server.request.query.contains("to=2026-05-31"))
        #expect(measurements.count == 1)
        #expect(measurements[0].status == .saved)
        #expect(measurements[0].armSide == .left)
    }

    @Test func listSupportsEmptyFiltersAndPendingOrFailedRows() throws {
        let server = try TestHTTPServer()
        defer { server.close() }
        let client = HttpApiClient(baseUrl: "http://127.0.0.1:\(server.port)", fallbackApiMessage: "Unexpected API error", networkMessage: "Network error", timeoutMessage: "Timeout", parseMessage: "Parse error")

        server.enqueue(status: 200, body: "{\"items\":[{\"id\":\"msr_1\",\"status\":\"failed\",\"armSide\":\"right\"},{\"id\":\"msr_2\",\"status\":\"pending\"}],\"page\":1,\"pageSize\":20,\"total\":2}")

        let result = client.list(session: makeSession(), filter: HistoryFilter())
        guard case .success(let measurements) = result else { Issue.record("Expected success"); return }

        #expect(server.request.query == "page=1&pageSize=20")
        #expect(measurements[0].status == .failed)
        #expect(measurements[0].armSide == .right)
        #expect(measurements[1].status == .pending)
        #expect(measurements[1].armSide == .unknown)
        #expect(measurements[1].systolic == 0)
    }

    @Test func listSurfacesApiFailure() throws {
        let server = try TestHTTPServer()
        defer { server.close() }
        let client = HttpApiClient(baseUrl: "http://127.0.0.1:\(server.port)", fallbackApiMessage: "Unexpected API error", networkMessage: "Network error", timeoutMessage: "Timeout", parseMessage: "Parse error")

        server.enqueue(status: 401, body: "{\"error\":\"unauthorized\",\"message\":\"Missing bearer token\"}")
        let result = client.list(session: makeSession(), filter: HistoryFilter())
        guard case .failure(let err) = result else { Issue.record("Expected failure"); return }
        #expect(err.code == "unauthorized")
        #expect(err.message == "Missing bearer token")
    }

    @Test func getMeasurementDetailSendsAuthorizationAndParsesRecognizedValues() throws {
        let server = try TestHTTPServer()
        defer { server.close() }
        let client = HttpApiClient(baseUrl: "http://127.0.0.1:\(server.port)", fallbackApiMessage: "Unexpected API error", networkMessage: "Network error", timeoutMessage: "Timeout", parseMessage: "Parse error")

        server.enqueue(status: 200, body: "{\"id\":\"msr_1\",\"status\":\"recognized\",\"systolic\":120,\"diastolic\":80,\"pulse\":68,\"armSide\":\"left\",\"measurementTime\":\"2026-05-27T12:00:00.000Z\",\"imageUrl\":\"/api/v1/measurements/msr_1/image\"}")

        let result = client.get(session: makeSession(), measurementId: "msr_1")
        guard case .success(let detail) = result else { Issue.record("Expected success"); return }

        #expect(server.request.authorization == makeSession().authorizationHeader)
        #expect(server.request.path == "/api/v1/measurements/msr_1")
        #expect(detail.status == .recognized)
        #expect(detail.systolic == 120)
        #expect(detail.armSide == .left)
        #expect(detail.imageUrl == "/api/v1/measurements/msr_1/image")
    }

    @Test func measurementDetailSupportsPendingRecognizingFailedAndApiFailures() throws {
        var server = try TestHTTPServer()
        var client = HttpApiClient(baseUrl: "http://127.0.0.1:\(server.port)", fallbackApiMessage: "Unexpected API error", networkMessage: "Network error", timeoutMessage: "Timeout", parseMessage: "Parse error")

        server.enqueue(status: 200, body: "{\"id\":\"msr_2\",\"status\":\"recognizing\",\"measurementTime\":\"2026-05-27T12:00:00.000Z\",\"imageUrl\":\"/image\"}")
        let recognizingResult = client.get(session: makeSession(), measurementId: "msr_2")
        server.close()
        guard case .success(let recognizing) = recognizingResult else { Issue.record("Expected success"); return }
        #expect(recognizing.status == .recognizing)
        #expect(recognizing.armSide == .unknown)
        #expect(recognizing.systolic == nil)

        server = try TestHTTPServer()
        client = HttpApiClient(baseUrl: "http://127.0.0.1:\(server.port)", fallbackApiMessage: "Unexpected API error", networkMessage: "Network error", timeoutMessage: "Timeout", parseMessage: "Parse error")
        server.enqueue(status: 404, body: "{\"error\":\"not_found\",\"message\":\"Measurement not found\"}")
        let getFailure = client.get(session: makeSession(), measurementId: "missing")
        server.close()
        guard case .failure(let err) = getFailure else { Issue.record("Expected failure"); return }
        #expect(err.message == "Measurement not found")

        server = try TestHTTPServer()
        client = HttpApiClient(baseUrl: "http://127.0.0.1:\(server.port)", fallbackApiMessage: "Unexpected API error", networkMessage: "Network error", timeoutMessage: "Timeout", parseMessage: "Parse error")
        server.enqueue(status: 409, body: "{\"error\":\"conflict\",\"message\":\"Measurement must be recognized before it can be saved\"}")
        let saveFailure = client.save(session: makeSession(), detail: detailForSave())
        server.close()
        guard case .failure(let saveErr) = saveFailure else { Issue.record("Expected failure"); return }
        #expect(saveErr.code == "conflict")
    }

    @Test func measurementDetailMapsClosedConnectionsToNetworkErrors() throws {
        let server = try TestHTTPServer()
        let port = server.port
        server.close()

        let client = HttpApiClient(baseUrl: "http://127.0.0.1:\(port)", fallbackApiMessage: "Unexpected API error", networkMessage: "Network error", timeoutMessage: "Timeout", parseMessage: "Parse error")

        let getFailure = client.get(session: makeSession(), measurementId: "msr_1")
        let saveFailure = client.save(session: makeSession(), detail: detailForSave())

        if case .failure(let err) = getFailure {
            #expect(err.source == .network || err.source == .timeout)
        } else { Issue.record("Expected failure for get") }

        if case .failure(let err) = saveFailure {
            #expect(err.source == .network || err.source == .timeout)
        } else { Issue.record("Expected failure for save") }
    }

    @Test func measurementDetailMapsMalformedSuccessToParseError() throws {
        let server = try TestHTTPServer()
        defer { server.close() }
        let client = HttpApiClient(baseUrl: "http://127.0.0.1:\(server.port)", fallbackApiMessage: "Unexpected API error", networkMessage: "Network error", timeoutMessage: "Timeout", parseMessage: "Parse error")

        server.enqueue(status: 200, body: "{}")
        let result = client.get(session: makeSession(), measurementId: "msr_1")
        guard case .failure(let err) = result else { Issue.record("Expected failure"); return }
        #expect(err.message == "Parse error")
    }

    @Test func uploadSendsMultipartImageWithAuthorization() throws {
        let server = try TestHTTPServer()
        defer { server.close() }
        let client = HttpApiClient(baseUrl: "http://127.0.0.1:\(server.port)", fallbackApiMessage: "Unexpected API error", networkMessage: "Network error", timeoutMessage: "Timeout", parseMessage: "Parse error")

        server.enqueue(status: 201, body: "{\"id\":\"msr_1\",\"status\":\"pending\",\"measurementTime\":\"2026-05-27T12:00:00.000Z\"}")
        let imageFile = try tempImageFile(name: "measurement.png", content: "png-bytes")
        defer { try? FileManager.default.removeItem(at: imageFile) }

        let fileSize = (try? FileManager.default.attributesOfItem(atPath: imageFile.path)[.size] as? Int) ?? 0
        let result = client.upload(session: makeSession(), image: MeasurementImage(uri: imageFile.absoluteString, mimeType: "image/png", sizeBytes: Int64(fileSize)))
        guard case .success(let id) = result else { Issue.record("Expected success"); return }

        #expect(id == "msr_1")
        #expect(server.request.authorization == makeSession().authorizationHeader)
        #expect(server.request.contentType.hasPrefix("multipart/form-data"))
        #expect(server.request.body.contains("filename=\"\(imageFile.lastPathComponent)\""))
        #expect(server.request.body.contains("png-bytes"))
    }

    @Test func uploadSurfacesApiValidationFailure() throws {
        let server = try TestHTTPServer()
        defer { server.close() }
        let client = HttpApiClient(baseUrl: "http://127.0.0.1:\(server.port)", fallbackApiMessage: "Unexpected API error", networkMessage: "Network error", timeoutMessage: "Timeout", parseMessage: "Parse error")

        server.enqueue(status: 400, body: "{\"error\":\"validation_error\",\"message\":\"Image is required\"}")
        let imageFile = try tempImageFile(name: "measurement.png", content: "png-bytes")
        defer { try? FileManager.default.removeItem(at: imageFile) }

        let fileSize = (try? FileManager.default.attributesOfItem(atPath: imageFile.path)[.size] as? Int) ?? 0
        let result = client.upload(session: makeSession(), image: MeasurementImage(uri: imageFile.absoluteString, mimeType: "image/png", sizeBytes: Int64(fileSize)))
        guard case .failure(let err) = result else { Issue.record("Expected failure"); return }
        #expect(err.code == "validation_error")
        #expect(err.message == "Image is required")
    }

    @Test func uploadFallsBackWhenApiErrorBodyHasNoMessage() throws {
        let server = try TestHTTPServer()
        defer { server.close() }
        let client = HttpApiClient(baseUrl: "http://127.0.0.1:\(server.port)", fallbackApiMessage: "Unexpected API error", networkMessage: "Network error", timeoutMessage: "Timeout", parseMessage: "Parse error")

        server.enqueue(status: 500, body: "{\"error\":\"server_error\"}")
        let imageFile = try tempImageFile(name: "measurement.png", content: "png-bytes")
        defer { try? FileManager.default.removeItem(at: imageFile) }

        let fileSize = (try? FileManager.default.attributesOfItem(atPath: imageFile.path)[.size] as? Int) ?? 0
        let result = client.upload(session: makeSession(), image: MeasurementImage(uri: imageFile.absoluteString, mimeType: "image/png", sizeBytes: Int64(fileSize)))
        guard case .failure(let err) = result else { Issue.record("Expected failure"); return }
        #expect(err.code == "server_error")
        #expect(err.message == "Unexpected API error")
    }

    @Test func uploadMapsUnsupportedUriSchemeToParseError() throws {
        let server = try TestHTTPServer()
        defer { server.close() }
        let client = HttpApiClient(baseUrl: "http://127.0.0.1:\(server.port)", fallbackApiMessage: "Unexpected API error", networkMessage: "Network error", timeoutMessage: "Timeout", parseMessage: "Parse error")

        let result = client.upload(session: makeSession(), image: MeasurementImage(uri: "generated://measurement.png", mimeType: "image/png", sizeBytes: 68))
        guard case .failure(let err) = result else { Issue.record("Expected failure"); return }
        #expect(err.message == "Parse error")
    }

    @Test func fetchMeasurementImageSendsAuthorizationAndReturnsBytes() throws {
        let server = try TestHTTPServer()
        defer { server.close() }
        let client = HttpApiClient(baseUrl: "http://127.0.0.1:\(server.port)", fallbackApiMessage: "Unexpected API error", networkMessage: "Network error", timeoutMessage: "Timeout", parseMessage: "Parse error")

        let imageBytes = "png-bytes".data(using: .utf8)!
        server.enqueueBinary(status: 200, body: imageBytes, contentType: "image/png")

        let result = client.fetchMeasurementImage(
            imageUrl: "http://127.0.0.1:\(server.port)/api/v1/measurements/msr_1/image",
            authorization: makeSession().authorizationHeader
        )
        guard case .success(let payload) = result else { Issue.record("Expected success"); return }

        #expect(payload == imageBytes)
        #expect(server.request.authorization == makeSession().authorizationHeader)
        #expect(server.request.path == "/api/v1/measurements/msr_1/image")
    }

    @Test func fetchMeasurementImageSurfacesApiError() throws {
        let server = try TestHTTPServer()
        defer { server.close() }
        let client = HttpApiClient(baseUrl: "http://127.0.0.1:\(server.port)", fallbackApiMessage: "Unexpected API error", networkMessage: "Network error", timeoutMessage: "Timeout", parseMessage: "Parse error")

        server.enqueue(status: 404, body: "{\"error\":\"not_found\",\"message\":\"Image not found\"}")
        let result = client.fetchMeasurementImage(
            imageUrl: "http://127.0.0.1:\(server.port)/api/v1/measurements/missing/image",
            authorization: makeSession().authorizationHeader
        )
        guard case .failure(let err) = result else { Issue.record("Expected failure"); return }
        #expect(err.code == "not_found")
        #expect(err.message == "Image not found")
    }

    @Test func fetchMeasurementImageMapsClosedConnectionToNetworkError() throws {
        let server = try TestHTTPServer()
        let port = server.port
        server.close()

        let client = HttpApiClient(baseUrl: "http://127.0.0.1:\(port)", fallbackApiMessage: "Unexpected API error", networkMessage: "Network error", timeoutMessage: "Timeout", parseMessage: "Parse error")
        let result = client.fetchMeasurementImage(
            imageUrl: "http://127.0.0.1:\(port)/api/v1/measurements/msr_1/image",
            authorization: makeSession().authorizationHeader
        )
        guard case .failure(let err) = result else { Issue.record("Expected failure"); return }
        #expect(err.source == .network || err.source == .timeout)
    }

    @Test func extractJsonStringParsesSimpleAndEscapedValues() throws {
        let server = try TestHTTPServer()
        defer { server.close() }
        let client = HttpApiClient(baseUrl: "http://127.0.0.1:\(server.port)", fallbackApiMessage: "Unexpected API error", networkMessage: "Network error", timeoutMessage: "Timeout", parseMessage: "Parse error")

        #expect(client.extractJsonString(from: "{\"key\":\"value\"}", field: "key") == "value")
        #expect(client.extractJsonString(from: "{\"key\":\"\"}", field: "key") == "")
        #expect(client.extractJsonString(from: "{}", field: "key") == nil)
        #expect(client.extractJsonInt(from: "{\"key\":42}", field: "key") == 42)
        #expect(client.extractJsonInt(from: "{}", field: "key") == nil)
    }
}
