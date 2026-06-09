// ModelsTests.swift
// Blood pressure trackerTests
// Mirrors Android DomainModelsTest.kt

import Testing
@testable import Blood_pressure_tracker

struct ModelsTests {

    @Test func exposesEnumCasesForRoutingDomainErrorsAndMeasurementValues() {
        // Route cases
        let allRoutes: [Route] = [.auth, .guide, .camera, .history, .measurementDetail, .profile]
        #expect(allRoutes.contains(.auth))
        #expect(allRoutes.contains(.camera))

        // AuthMode cases
        let authModes: [AuthMode] = [.login, .newAccount]
        #expect(authModes.contains(.newAccount))

        // ArmSide cases
        #expect(ArmSide.allCases.contains(.left))

        // ApiErrorSource cases
        #expect(ApiErrorSource.allCases.contains(.api))

        // MeasurementStatus cases
        #expect(MeasurementStatus.allCases.contains(.saved))
        #expect(MeasurementStatus.allCases.contains(.recognized))
    }

    @Test func supportsSessionAndStateValueSemantics() {
        let user = MobileUser(id: "usr_1", email: "user@example.com")
        let session = Session(accessToken: "token", tokenType: "Bearer", expiresAt: "2026-12-31T00:00:00.000Z", user: user)
        let error = ApiError(code: "code", message: "message", source: .api)
        let measurement = Measurement(id: "msr_1", status: .saved, systolic: 120, diastolic: 80, pulse: 68, armSide: .left, measurementTime: "2026-05-27T12:00:00.000Z", savedAt: "2026-05-27T12:05:00.000Z")
        let filter = HistoryFilter(from: "2026-05-01", to: "2026-05-31")
        let passwordInput = PasswordInput(value: "password123")
        let row = HistoryTableRow(measurementTimeColumn: "2026-05-27", systolicColumn: "120", diastolicColumn: "80", pulseColumn: "68", armSideColumn: "left", statusColumn: "saved")
        let detail = MeasurementDetail(
            id: "msr_1",
            status: .recognized,
            systolic: 120,
            diastolic: 80,
            pulse: 68,
            armSide: .left,
            measurementTime: "2026-05-27T12:00:00.000Z",
            savedAt: nil,
            imageUrl: "/api/v1/measurements/msr_1/image",
            recognitionError: nil
        )
        let cameraState = CameraScreenState(session: session, isUploading: true, visibleError: error, lastUploadId: "msr_1")

        #expect(session.authorizationHeader == "\(session.tokenType) \(session.accessToken)")
        #expect(user.id == "usr_1")
        #expect(user.email == "user@example.com")
        #expect(error.code == "code")
        #expect(error.source == .api)
        #expect(measurement.id == "msr_1")
        #expect(measurement.systolic == 120)
        #expect(measurement.diastolic == 80)
        #expect(measurement.pulse == 68)
        #expect(measurement.armSide == .left)
        #expect(measurement.measurementTime == "2026-05-27T12:00:00.000Z")
        #expect(measurement.savedAt == "2026-05-27T12:05:00.000Z")
        #expect(session.tokenType == "Bearer")
        #expect(session.expiresAt == "2026-12-31T00:00:00.000Z")
        #expect(session.user == user)
        #expect(filter.page == 1)
        #expect(filter.pageSize == 20)
        #expect(passwordInput.usesPlatformMasking == true)
        #expect(passwordInput.value == "password123")
        #expect(detail.imageUrl == "/api/v1/measurements/msr_1/image")
        #expect(detail.status == .recognized)
        #expect(detail.systolic == 120)
        #expect(detail.diastolic == 80)
        #expect(detail.pulse == 68)
        #expect(detail.armSide == .left)
        #expect(detail.measurementTime == "2026-05-27T12:00:00.000Z")
        #expect(detail.savedAt == nil)
        #expect(detail.recognitionError == nil)
        #expect(detail.withImageUrl("https://cdn.example.com/image.jpg").imageUrl == "https://cdn.example.com/image.jpg")
        #expect(cameraState.lastUploadId == "msr_1")
        #expect(cameraState.session == session)
        #expect(cameraState.isUploading == true)
        #expect(row.measurementTimeColumn == "2026-05-27")
        #expect(row.systolicColumn == "120")
        #expect(row.diastolicColumn == "80")
        #expect(row.pulseColumn == "68")
        #expect(row.armSideColumn == "left")
        #expect(row.statusColumn == "saved")
        #expect(cameraState.visibleError == error)

        let defaultCameraState = CameraScreenState(session: session)
        #expect(defaultCameraState.session == session)
        #expect(defaultCameraState.isUploading == false)
        #expect(defaultCameraState.visibleError == nil)
        #expect(defaultCameraState.lastUploadId == nil)
        #expect(session == session)
    }

    @Test func supportsImageAndResultValueSemantics() {
        let image = MeasurementImage(uri: "uri", mimeType: "image/png", sizeBytes: 12)
        let success: AppResult<MeasurementImage> = .success(image)
        let failure: AppResult<MeasurementImage> = .failure(ApiError(code: nil, message: "message", source: .network))

        #expect(image.uri == "uri")
        #expect(image.mimeType == "image/png")
        #expect(image.sizeBytes == 12)

        if case .success(let value) = success {
            #expect(value == image)
        } else {
            Issue.record("Expected .success")
        }

        if case .failure(let err) = failure {
            #expect(err.message == "message")
        } else {
            Issue.record("Expected .failure")
        }
    }
}
