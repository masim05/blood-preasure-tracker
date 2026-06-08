// HttpApiClient.swift
// Blood pressure tracker
// HTTP API client mirroring Android's HttpApiClient.kt using URLSession with synchronous dispatch.

import Foundation

class HttpApiClient: AuthGateway, HistoryGateway, MeasurementUploadGateway, MeasurementDetailGateway {
    let baseUrl: String
    private let fallbackApiMessage: String
    private let networkMessage: String
    private let timeoutMessage: String
    private let parseMessage: String

    init(
        baseUrl: String,
        fallbackApiMessage: String = "Unexpected API error",
        networkMessage: String = "Network error",
        timeoutMessage: String = "Timeout",
        parseMessage: String = "Parse error"
    ) {
        self.baseUrl = baseUrl
        self.fallbackApiMessage = fallbackApiMessage
        self.networkMessage = networkMessage
        self.timeoutMessage = timeoutMessage
        self.parseMessage = parseMessage
    }

    // MARK: - AuthGateway

    func signIn(email: String, password: String) -> AppResult<Session> {
        authenticate(path: "/api/v1/signin", email: email, password: password)
    }

    func logIn(email: String, password: String) -> AppResult<Session> {
        authenticate(path: "/api/v1/login", email: email, password: password)
    }

    // MARK: - MeasurementUploadGateway

    func upload(session: Session, image: MeasurementImage) -> AppResult<String> {
        do {
            let boundary = "----BloodPressureTrackerBoundary"
            let imageData = try readImageData(from: image)
            let filename = resolveFilename(from: image.uri)

            var body = Data()
            body += "--\(boundary)\r\n".utf8Data
            body += "Content-Disposition: form-data; name=\"image\"; filename=\"\(filename)\"\r\n".utf8Data
            body += "Content-Type: \(image.mimeType)\r\n\r\n".utf8Data
            body += imageData
            body += "\r\n--\(boundary)--\r\n".utf8Data

            let response = try request(
                path: "/api/v1/measurements",
                method: "POST",
                body: body,
                contentType: "multipart/form-data; boundary=\(boundary)",
                authorization: session.authorizationHeader
            )
            if (200 ... 299).contains(response.statusCode) {
                return .success(extractJsonString(from: response.body, field: "id") ?? "")
            }
            return .failure(ApiErrorMapper.fromApiBody(response.body, fallback: fallbackApiMessage))
        } catch {
            return .failure(ApiErrorMapper.fromError(error, networkMessage: networkMessage, timeoutMessage: timeoutMessage, parseMessage: parseMessage))
        }
    }

    // MARK: - HistoryGateway

    func list(session: Session, filter: HistoryFilter) -> AppResult<[Measurement]> {
        do {
            var queryParts = ["page=\(filter.page)", "pageSize=\(filter.pageSize)"]
            if !filter.from.isEmpty {
                queryParts.append("from=\(urlEncode(filter.from))T00%3A00%3A00.000Z")
            }
            if !filter.to.isEmpty {
                queryParts.append("to=\(urlEncode(filter.to))T23%3A59%3A59.999Z")
            }
            let query = queryParts.joined(separator: "&")
            let response = try request(
                path: "/api/v1/measurements?\(query)",
                method: "GET",
                authorization: session.authorizationHeader
            )
            if (200 ... 299).contains(response.statusCode) {
                return .success(parseMeasurements(response.body))
            }
            return .failure(ApiErrorMapper.fromApiBody(response.body, fallback: fallbackApiMessage))
        } catch {
            return .failure(ApiErrorMapper.fromError(error, networkMessage: networkMessage, timeoutMessage: timeoutMessage, parseMessage: parseMessage))
        }
    }

    // MARK: - MeasurementDetailGateway

    func get(session: Session, measurementId: String) -> AppResult<MeasurementDetail> {
        do {
            let response = try request(
                path: "/api/v1/measurements/\(urlPathEncode(measurementId))",
                method: "GET",
                authorization: session.authorizationHeader
            )
            if (200 ... 299).contains(response.statusCode) {
                guard let detail = parseMeasurementDetail(response.body) else {
                    return .failure(ApiError(code: nil, message: parseMessage, source: .parse))
                }
                return .success(detail)
            }
            return .failure(ApiErrorMapper.fromApiBody(response.body, fallback: fallbackApiMessage))
        } catch {
            return .failure(ApiErrorMapper.fromError(error, networkMessage: networkMessage, timeoutMessage: timeoutMessage, parseMessage: parseMessage))
        }
    }

    func save(session: Session, detail: MeasurementDetail) -> AppResult<MeasurementDetail> {
        do {
            let bodyString = saveMeasurementBody(detail)
            let response = try request(
                path: "/api/v1/measurements/\(urlPathEncode(detail.id))/save",
                method: "POST",
                body: bodyString.utf8Data,
                contentType: "application/json",
                authorization: session.authorizationHeader
            )
            if (200 ... 299).contains(response.statusCode) {
                guard var saved = parseMeasurementDetail(response.body) else {
                    return .failure(ApiError(code: nil, message: parseMessage, source: .parse))
                }
                if saved.imageUrl.isEmpty {
                    saved = saved.withImageUrl(detail.imageUrl)
                }
                return .success(saved)
            }
            return .failure(ApiErrorMapper.fromApiBody(response.body, fallback: fallbackApiMessage))
        } catch {
            return .failure(ApiErrorMapper.fromError(error, networkMessage: networkMessage, timeoutMessage: timeoutMessage, parseMessage: parseMessage))
        }
    }

    // MARK: - Image fetching

    func fetchMeasurementImage(imageUrl: String, authorization: String) -> AppResult<Data> {
        do {
            let response = try requestBytes(
                urlString: imageUrl,
                method: "GET",
                authorization: authorization,
                accept: "image/*"
            )
            if (200 ... 299).contains(response.statusCode) {
                return .success(response.body)
            }
            let errorBody = String(data: response.body, encoding: .utf8) ?? ""
            return .failure(ApiErrorMapper.fromApiBody(errorBody, fallback: fallbackApiMessage))
        } catch {
            return .failure(ApiErrorMapper.fromError(error, networkMessage: networkMessage, timeoutMessage: timeoutMessage, parseMessage: parseMessage))
        }
    }

    // MARK: - Private HTTP primitives

    private struct HttpResponse {
        let statusCode: Int
        let body: String
    }

    private struct HttpBytesResponse {
        let statusCode: Int
        let body: Data
    }

    private func request(
        path: String,
        method: String,
        body: Data? = nil,
        contentType: String? = nil,
        authorization: String? = nil
    ) throws -> HttpResponse {
        let urlString = baseUrl + path
        guard let url = URL(string: urlString) else { throw URLError(.badURL) }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.timeoutInterval = 15
        if let auth = authorization { req.setValue(auth, forHTTPHeaderField: "Authorization") }
        if let ct = contentType { req.setValue(ct, forHTTPHeaderField: "Content-Type") }
        if let b = body { req.httpBody = b }

        var resultBody: String = ""
        var resultStatus: Int = 0
        var resultError: Error?
        let semaphore = DispatchSemaphore(value: 0)

        URLSession.shared.dataTask(with: req) { data, response, error in
            if let e = error {
                resultError = e
            } else if let http = response as? HTTPURLResponse {
                resultStatus = http.statusCode
                resultBody = data.flatMap { String(data: $0, encoding: .utf8) } ?? ""
            }
            semaphore.signal()
        }.resume()
        semaphore.wait()

        if let e = resultError { throw e }
        return HttpResponse(statusCode: resultStatus, body: resultBody)
    }

    private func requestBytes(
        urlString: String,
        method: String,
        authorization: String? = nil,
        accept: String? = nil
    ) throws -> HttpBytesResponse {
        guard let url = URL(string: urlString) else { throw URLError(.badURL) }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.timeoutInterval = 15
        if let auth = authorization { req.setValue(auth, forHTTPHeaderField: "Authorization") }
        if let acc = accept { req.setValue(acc, forHTTPHeaderField: "Accept") }

        var resultData: Data = Data()
        var resultStatus: Int = 0
        var resultError: Error?
        let semaphore = DispatchSemaphore(value: 0)

        URLSession.shared.dataTask(with: req) { data, response, error in
            if let e = error {
                resultError = e
            } else if let http = response as? HTTPURLResponse {
                resultStatus = http.statusCode
                resultData = data ?? Data()
            }
            semaphore.signal()
        }.resume()
        semaphore.wait()

        if let e = resultError { throw e }
        return HttpBytesResponse(statusCode: resultStatus, body: resultData)
    }

    private func authenticate(path: String, email: String, password: String) -> AppResult<Session> {
        do {
            let json = "{\"email\":\"\(escapeJson(email))\",\"password\":\"\(escapeJson(password))\"}"
            let response = try request(
                path: path,
                method: "POST",
                body: json.utf8Data,
                contentType: "application/json"
            )
            if (200 ... 299).contains(response.statusCode) {
                guard let session = parseSession(response.body) else {
                    return .failure(ApiError(code: nil, message: parseMessage, source: .parse))
                }
                return .success(session)
            }
            return .failure(ApiErrorMapper.fromApiBody(response.body, fallback: fallbackApiMessage))
        } catch {
            return .failure(ApiErrorMapper.fromError(error, networkMessage: networkMessage, timeoutMessage: timeoutMessage, parseMessage: parseMessage))
        }
    }

    // MARK: - JSON parsing

    private func parseSession(_ body: String) -> Session? {
        guard let accessToken = extractJsonString(from: body, field: "accessToken"),
              let expiresAt = extractJsonString(from: body, field: "expiresAt"),
              let id = extractJsonString(from: body, field: "id"),
              let email = extractJsonString(from: body, field: "email") else { return nil }
        let tokenType = extractJsonString(from: body, field: "tokenType") ?? "Bearer"
        return Session(
            accessToken: accessToken,
            tokenType: tokenType,
            expiresAt: expiresAt,
            user: MobileUser(id: id, email: email)
        )
    }

    private func parseMeasurements(_ body: String) -> [Measurement] {
        guard let pattern = try? NSRegularExpression(pattern: #"\{[^{}]*"id"[^{}]*\}"#) else { return [] }
        let range = NSRange(body.startIndex..., in: body)
        return pattern.matches(in: body, range: range).compactMap { match -> Measurement? in
            guard let r = Range(match.range, in: body) else { return nil }
            let item = String(body[r])
            guard let id = extractJsonString(from: item, field: "id"),
                  let statusStr = extractJsonString(from: item, field: "status") else { return nil }
            return Measurement(
                id: id,
                status: parseStatus(statusStr),
                systolic: extractJsonInt(from: item, field: "systolic") ?? 0,
                diastolic: extractJsonInt(from: item, field: "diastolic") ?? 0,
                pulse: extractJsonInt(from: item, field: "pulse") ?? 0,
                armSide: parseArmSide(extractJsonString(from: item, field: "armSide")),
                measurementTime: extractJsonString(from: item, field: "measurementTime") ?? "",
                savedAt: extractJsonString(from: item, field: "savedAt") ?? ""
            )
        }
    }

    private func parseMeasurementDetail(_ body: String) -> MeasurementDetail? {
        guard let id = extractJsonString(from: body, field: "id") else { return nil }
        return MeasurementDetail(
            id: id,
            status: parseStatus(extractJsonString(from: body, field: "status")),
            systolic: extractJsonInt(from: body, field: "systolic"),
            diastolic: extractJsonInt(from: body, field: "diastolic"),
            pulse: extractJsonInt(from: body, field: "pulse"),
            armSide: parseArmSide(extractJsonString(from: body, field: "armSide")),
            measurementTime: extractJsonString(from: body, field: "measurementTime") ?? "",
            savedAt: extractJsonString(from: body, field: "savedAt"),
            imageUrl: extractJsonString(from: body, field: "imageUrl") ?? "",
            recognitionError: extractJsonString(from: body, field: "recognitionError")
        )
    }

    private func parseStatus(_ status: String?) -> MeasurementStatus {
        switch status {
        case "recognizing": return .recognizing
        case "recognized": return .recognized
        case "saved": return .saved
        case "failed": return .failed
        default: return .pending
        }
    }

    private func parseArmSide(_ value: String?) -> ArmSide {
        switch value {
        case "left": return .left
        case "right": return .right
        default: return .unknown
        }
    }

    func extractJsonString(from body: String, field: String) -> String? {
        let escapedField = NSRegularExpression.escapedPattern(for: field)
        guard let pattern = try? NSRegularExpression(
            pattern: "\"" + escapedField + "\"\\s*:\\s*\"([^\"]*)\""
        ) else { return nil }
        let range = NSRange(body.startIndex..., in: body)
        guard let match = pattern.firstMatch(in: body, range: range),
              let valueRange = Range(match.range(at: 1), in: body) else { return nil }
        return String(body[valueRange])
    }

    func extractJsonInt(from body: String, field: String) -> Int? {
        let escapedField = NSRegularExpression.escapedPattern(for: field)
        guard let pattern = try? NSRegularExpression(
            pattern: "\"" + escapedField + "\"\\s*:\\s*(\\d+)"
        ) else { return nil }
        let range = NSRange(body.startIndex..., in: body)
        guard let match = pattern.firstMatch(in: body, range: range),
              let valueRange = Range(match.range(at: 1), in: body) else { return nil }
        return Int(String(body[valueRange]))
    }

    private func escapeJson(_ value: String) -> String {
        value.replacingOccurrences(of: "\\", with: "\\\\")
             .replacingOccurrences(of: "\"", with: "\\\"")
    }

    private func urlEncode(_ value: String) -> String {
        value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? value
    }

    private func urlPathEncode(_ value: String) -> String {
        (value.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? value)
            .replacingOccurrences(of: "+", with: "%20")
    }

    private func saveMeasurementBody(_ detail: MeasurementDetail) -> String {
        var parts: [String] = []
        if let s = detail.systolic { parts.append("\"systolic\":\(s)") }
        if let d = detail.diastolic { parts.append("\"diastolic\":\(d)") }
        if let p = detail.pulse { parts.append("\"pulse\":\(p)") }
        parts.append("\"armSide\":\"\(serializeArmSide(detail.armSide))\"")
        return "{\(parts.joined(separator: ","))}"
    }

    private func serializeArmSide(_ armSide: ArmSide) -> String {
        switch armSide {
        case .left: return "left"
        case .right: return "right"
        case .unknown: return "unknown"
        }
    }

    private func readImageData(from image: MeasurementImage) throws -> Data {
        guard let url = URL(string: image.uri) else {
            throw NSError(domain: NSCocoaErrorDomain, code: NSFileNoSuchFileError)
        }
        let fileUrl: URL
        if url.scheme == nil || url.scheme == "file" {
            fileUrl = url.scheme == nil ? URL(fileURLWithPath: image.uri) : url
        } else {
            throw NSError(domain: NSCocoaErrorDomain, code: NSFileNoSuchFileError)
        }
        return try Data(contentsOf: fileUrl)
    }

    private func resolveFilename(from uri: String) -> String {
        URL(string: uri)?.lastPathComponent.isEmpty == false
            ? URL(string: uri)!.lastPathComponent
            : "measurement"
    }
}

// MARK: - Helpers

private extension String {
    var utf8Data: Data { Data(utf8) }
}

private func += (lhs: inout Data, rhs: Data) { lhs.append(rhs) }
