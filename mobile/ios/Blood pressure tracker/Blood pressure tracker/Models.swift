// Models.swift
// Blood pressure tracker
// Domain models mirroring the Android app's DomainModels.kt

import Foundation

// MARK: - Auth

enum AuthMode: Equatable {
    case login
    case newAccount
}

// MARK: - Navigation

enum Route: Equatable {
    case auth
    case guide
    case camera
    case history
    case measurementDetail
    case profile
}

// MARK: - User & Session

struct MobileUser: Equatable {
    let id: String
    let email: String
}

struct Session: Equatable {
    let accessToken: String
    let tokenType: String
    let expiresAt: String
    let user: MobileUser

    var authorizationHeader: String { "\(tokenType) \(accessToken)" }

    func expiresAtDate() -> Date? {
        ISO8601DateFormatter().date(from: expiresAt)
    }

    func isActive(now: Date = Date()) -> Bool {
        guard let date = expiresAtDate() else { return false }
        return date > now
    }
}

// MARK: - Measurement

struct MeasurementImage: Equatable {
    let uri: String
    let mimeType: String
    let sizeBytes: Int64
}

enum ArmSide: String, Equatable, CaseIterable {
    case left
    case right
    case unknown
}

enum MeasurementStatus: String, Equatable, CaseIterable {
    case pending
    case recognizing
    case recognized
    case saved
    case failed
}

struct Measurement: Equatable {
    let id: String
    let status: MeasurementStatus
    let systolic: Int
    let diastolic: Int
    let pulse: Int
    let armSide: ArmSide
    let measurementTime: String
    let savedAt: String
}

struct MeasurementDetail: Equatable {
    let id: String
    let status: MeasurementStatus
    let systolic: Int?
    let diastolic: Int?
    let pulse: Int?
    let armSide: ArmSide
    let measurementTime: String
    let savedAt: String?
    let imageUrl: String
    let recognitionError: String?

    func withImageUrl(_ url: String) -> MeasurementDetail {
        MeasurementDetail(
            id: id, status: status, systolic: systolic, diastolic: diastolic,
            pulse: pulse, armSide: armSide, measurementTime: measurementTime,
            savedAt: savedAt, imageUrl: url, recognitionError: recognitionError
        )
    }
}

struct HistoryFilter: Equatable {
    var from: String = ""
    var to: String = ""
    var page: Int = 1
    var pageSize: Int = 20
}

// MARK: - Errors & Results

enum ApiErrorSource: Equatable, CaseIterable {
    case api
    case network
    case timeout
    case parse
    case unexpected
}

struct ApiError: Equatable {
    let code: String?
    let message: String
    let source: ApiErrorSource
}

enum AppResult<T> {
    case success(T)
    case failure(ApiError)
}

// MARK: - Screen State

struct ScreenState {
    let route: Route
    var authMode: AuthMode = .login
    var session: Session? = nil
    var error: ApiError? = nil
    var validationError: ValidationError? = nil
    var measurements: [Measurement] = []
    var measurementDetail: MeasurementDetail? = nil
    var filter: HistoryFilter = HistoryFilter()
    var lastUploadId: String? = nil

    init(
        route: Route,
        authMode: AuthMode = .login,
        session: Session? = nil,
        error: ApiError? = nil,
        validationError: ValidationError? = nil,
        measurements: [Measurement] = [],
        measurementDetail: MeasurementDetail? = nil,
        filter: HistoryFilter = HistoryFilter(),
        lastUploadId: String? = nil
    ) {
        self.route = route
        self.authMode = authMode
        self.session = session
        self.error = error
        self.validationError = validationError
        self.measurements = measurements
        self.measurementDetail = measurementDetail
        self.filter = filter
        self.lastUploadId = lastUploadId
    }
}

// MARK: - Camera UI State

enum CameraUiStatus {
    case initializing
    case ready
    case capturing
    case uploading
    case error
}

struct CameraUiState: Equatable {
    let status: CameraUiStatus
    let previewVisible: Bool
    let canCapture: Bool
    let canOpenHistory: Bool
    let errorMessage: String?

    init(
        status: CameraUiStatus,
        previewVisible: Bool = false,
        canCapture: Bool = false,
        canOpenHistory: Bool = false,
        errorMessage: String? = nil
    ) {
        self.status = status
        self.previewVisible = previewVisible
        self.canCapture = canCapture
        self.canOpenHistory = canOpenHistory
        self.errorMessage = errorMessage
    }
}

extension CameraUiStatus: Equatable {}

// MARK: - Password Input

struct PasswordInput: Equatable {
    let value: String
    let usesPlatformMasking: Bool

    init(value: String, usesPlatformMasking: Bool = true) {
        self.value = value
        self.usesPlatformMasking = usesPlatformMasking
    }
}

// MARK: - Camera Screen State

struct CameraScreenState: Equatable {
    let session: Session
    let isUploading: Bool
    let visibleError: ApiError?
    let lastUploadId: String?

    init(
        session: Session,
        isUploading: Bool = false,
        visibleError: ApiError? = nil,
        lastUploadId: String? = nil
    ) {
        self.session = session
        self.isUploading = isUploading
        self.visibleError = visibleError
        self.lastUploadId = lastUploadId
    }
}

// MARK: - History Table Row

struct HistoryTableRow: Equatable {
    let measurementTimeColumn: String
    let systolicColumn: String
    let diastolicColumn: String
    let pulseColumn: String
    let armSideColumn: String
    let statusColumn: String
}
