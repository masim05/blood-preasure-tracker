// AppFlowsTests.swift
// Blood pressure trackerTests
// Mirrors Android AppFlowsTest.kt

import Testing
@testable import Blood_pressure_tracker

struct AppFlowsTests {

    // MARK: - Auth

    @Test func signInStoresSessionAndRoutesToGuide() {
        let store = MemoryStore()
        let flow = AuthFlow(authGateway: AuthSuccess(), sessionStore: store)

        let state = flow.signIn(email: "new@example.com", password: "password123")

        #expect(state.route == .guide)
        #expect(store.load() != nil)
        #expect(store.load()?.authorizationHeader == "\(store.load()!.tokenType) \(store.load()!.accessToken)")
    }

    @Test func loginStoresSessionAndRoutesToCamera() {
        let state = AuthFlow(authGateway: AuthSuccess(), sessionStore: MemoryStore())
            .logIn(email: "known@example.com", password: "password123")

        #expect(state.route == .camera)
        #expect(state.session?.user.email == "known@example.com")
    }

    @Test func authValidationAndApiErrorsRemainVisibleOnCurrentScreen() {
        let invalid = AuthFlow(authGateway: AuthSuccess(), sessionStore: MemoryStore())
            .signIn(email: "bad", password: "password123")
        #expect(invalid.validationError == .invalidEmail)

        let invalidPassword = AuthFlow(authGateway: AuthSuccess(), sessionStore: MemoryStore())
            .logIn(email: "user@example.com", password: "short")
        #expect(invalidPassword.validationError == .invalidPassword)

        let failed = AuthFlow(authGateway: AuthFailure(), sessionStore: MemoryStore())
            .logIn(email: "user@example.com", password: "password123")
        #expect(failed.route == .auth)
        #expect(failed.error?.message == "api message")
    }

    @Test func guideAndCameraRequireSession() {
        let store = MemoryStore()
        #expect(GuideFlow(sessionStore: store).enterGuide().route == .auth)
        #expect(GuideFlow(sessionStore: store).continueToCamera().route == .auth)
        #expect(CaptureFlow(sessionStore: store, cameraGateway: CameraFailure(), uploadGateway: UploadSuccess()).enterCamera().route == .auth)
        #expect(CaptureFlow(sessionStore: store, cameraGateway: CameraFailure(), uploadGateway: UploadSuccess()).history().route == .auth)

        store.save(Self.makeSession(email: "user@example.com"))

        #expect(GuideFlow(sessionStore: store).enterGuide().session != nil)
        #expect(GuideFlow(sessionStore: store).continueToCamera().route == .camera)
        #expect(CaptureFlow(sessionStore: store, cameraGateway: CameraFailure(), uploadGateway: UploadSuccess()).enterCamera().session != nil)
        #expect(CaptureFlow(sessionStore: store, cameraGateway: CameraFailure(), uploadGateway: UploadSuccess()).history().route == .history)
    }

    @Test func authTokenPersistsAcrossFlowRecreationWithSameSessionStore() {
        let store = MemoryStore()
        let auth = AuthFlow(authGateway: AuthSuccess(), sessionStore: store)
        let loginState = auth.logIn(email: "persist@example.com", password: "password123")

        #expect(loginState.route == .camera)
        #expect(store.load() != nil)

        let recreatedGuideFlow = GuideFlow(sessionStore: store)
        let recreatedCaptureFlow = CaptureFlow(sessionStore: store, cameraGateway: CameraFailure(), uploadGateway: UploadSuccess())

        #expect(recreatedGuideFlow.enterGuide().route == .guide)
        #expect(recreatedCaptureFlow.enterCamera().route == .camera)
        #expect(recreatedCaptureFlow.enterCamera().session != nil)
    }

    @Test func captureValidatesImageAndShowsUploadErrors() {
        let store = MemoryStore()
        store.save(Self.makeSession(email: "user@example.com"))

        let invalid = CaptureFlow(
            sessionStore: store,
            cameraGateway: CameraSuccess(image: MeasurementImage(uri: "uri", mimeType: "image/gif", sizeBytes: 1)),
            uploadGateway: UploadSuccess()
        ).captureAndUpload()
        #expect(invalid.validationError == .invalidImage)

        let uploadFailure = CaptureFlow(
            sessionStore: store,
            cameraGateway: CameraSuccess(image: MeasurementImage(uri: "uri", mimeType: "image/png", sizeBytes: 1)),
            uploadGateway: UploadFailure()
        ).captureAndUpload()
        #expect(uploadFailure.route == .camera)
        #expect(uploadFailure.error?.message == "api message")

        let success = CaptureFlow(
            sessionStore: store,
            cameraGateway: CameraSuccess(image: MeasurementImage(uri: "uri", mimeType: "image/png", sizeBytes: 1)),
            uploadGateway: UploadSuccess()
        ).captureAndUpload()
        #expect(success.route == .history)
        #expect(success.lastUploadId == "msr_1")
    }

    @Test func captureRequiresCameraReadyBeforeUpload() {
        let store = MemoryStore()
        store.save(Self.makeSession(email: "user@example.com"))
        let state = CaptureFlow(
            sessionStore: store,
            cameraGateway: CameraNotReady(),
            uploadGateway: UploadSuccess()
        ).captureAndUpload()

        #expect(state.route == .camera)
        #expect(state.error?.code == "camera_not_ready")
    }

    @Test func captureShowsCameraErrorsAndRequiresSession() {
        let noSession = CaptureFlow(
            sessionStore: MemoryStore(),
            cameraGateway: CameraFailure(),
            uploadGateway: UploadSuccess()
        ).captureAndUpload()
        #expect(noSession.route == .auth)

        let store = MemoryStore()
        store.save(Self.makeSession(email: "user@example.com"))
        let cameraFailure = CaptureFlow(
            sessionStore: store,
            cameraGateway: CameraFailure(),
            uploadGateway: UploadSuccess()
        ).captureAndUpload()
        #expect(cameraFailure.error?.message == "api message")
    }

    @Test func historyLoadsFiltersRejectsInvalidDatesAndOpensRows() {
        let store = MemoryStore()
        store.save(Self.makeSession(email: "user@example.com"))
        let flow = HistoryFlow(sessionStore: store, historyGateway: HistorySuccess())

        let loaded = flow.load(filter: HistoryFilter(from: "2026-05-01", to: "2026-05-31"))
        #expect(loaded.route == .history)
        #expect(loaded.measurements.count == 1)
        #expect(loaded.filter.from == "2026-05-01")

        let invalid = flow.load(filter: HistoryFilter(from: "2026-05-31", to: "2026-05-01"))
        #expect(invalid.validationError == .dateOrder)

        let detailState = flow.rowOpensDetail(Self.makeMeasurement())
        #expect(detailState.route == .measurementDetail)
        #expect(detailState.measurementDetail?.id == "msr_1")

        #expect(HistoryFlow(sessionStore: MemoryStore(), historyGateway: HistorySuccess())
            .rowOpensDetail(Self.makeMeasurement()).route == .auth)
    }

    @Test func measurementDetailLoadsSavesAndRequiresSession() {
        #expect(MeasurementDetailFlow(sessionStore: MemoryStore(), detailGateway: DetailSuccess())
            .load(measurementId: "msr_1").route == .auth)

        let store = MemoryStore()
        store.save(Self.makeSession(email: "user@example.com"))
        let flow = MeasurementDetailFlow(sessionStore: store, detailGateway: DetailSuccess())

        let loaded = flow.load(measurementId: "msr_1")
        #expect(loaded.route == .measurementDetail)
        #expect(loaded.measurementDetail?.status == .recognized)

        guard let detail = loaded.measurementDetail else {
            Issue.record("Expected measurementDetail"); return
        }
        let saved = flow.save(detail: detail)
        #expect(saved.route == .measurementDetail)
        #expect(saved.measurementDetail?.status == .saved)

        #expect(MeasurementDetailFlow(sessionStore: MemoryStore(), detailGateway: DetailSuccess())
            .save(detail: Self.makeDetail(status: .recognized)).route == .auth)
    }

    @Test func measurementDetailDisplaysApiErrors() {
        let store = MemoryStore()
        store.save(Self.makeSession(email: "user@example.com"))

        let failure = MeasurementDetailFlow(sessionStore: store, detailGateway: DetailFailure())
            .load(measurementId: "msr_1")
        #expect(failure.route == .measurementDetail)
        #expect(failure.error?.message == "api message")

        let saveFailure = MeasurementDetailFlow(sessionStore: store, detailGateway: DetailFailure())
            .save(detail: Self.makeDetail(status: .recognized))
        #expect(saveFailure.route == .measurementDetail)
        #expect(saveFailure.error?.message == "api message")
        #expect(saveFailure.measurementDetail?.id == "msr_1")
    }

    @Test func historyRequiresSessionAndDisplaysApiErrors() {
        #expect(HistoryFlow(sessionStore: MemoryStore(), historyGateway: HistorySuccess())
            .load(filter: HistoryFilter()).route == .auth)

        let store = MemoryStore()
        store.save(Self.makeSession(email: "user@example.com"))
        let failure = HistoryFlow(sessionStore: store, historyGateway: HistoryFailure())
            .load(filter: HistoryFilter())
        #expect(failure.error?.message == "api message")
    }

    @Test func restoredPersistedSessionRoutesToCameraOnFlowCreation() {
        let store = MemoryStore()
        store.save(Self.makeSession(email: "restored@example.com"))

        let captureState = CaptureFlow(
            sessionStore: store,
            cameraGateway: CameraFailure(),
            uploadGateway: UploadSuccess()
        ).enterCamera()
        #expect(captureState.route == .camera)
        #expect(captureState.session?.user.email == "restored@example.com")

        let guideState = GuideFlow(sessionStore: store).enterGuide()
        #expect(guideState.route == .guide)
        #expect(guideState.session != nil)
    }

    @Test func unreadableOrMissingPersistedSessionFallsBackToAuth() {
        let emptyStore = MemoryStore()
        #expect(GuideFlow(sessionStore: emptyStore).enterGuide().route == .auth)
        #expect(GuideFlow(sessionStore: emptyStore).continueToCamera().route == .auth)
        #expect(CaptureFlow(sessionStore: emptyStore, cameraGateway: CameraFailure(), uploadGateway: UploadSuccess()).enterCamera().route == .auth)

        let storeWithError = MemoryStoreWithError()
        #expect(GuideFlow(sessionStore: storeWithError).enterGuide().route == .auth)
        #expect(CaptureFlow(sessionStore: storeWithError, cameraGateway: CameraFailure(), uploadGateway: UploadSuccess()).enterCamera().route == .auth)
    }

    // MARK: - Mocks

    private class MemoryStore: SessionStore {
        private var session: Session?
        func save(_ s: Session) { session = s }
        func load() -> Session? { session }
        func loadError() -> String? { nil }
        func clear() { session = nil }
    }

    private class MemoryStoreWithError: SessionStore {
        func save(_ s: Session) {}
        func load() -> Session? { nil }
        func loadError() -> String? { "corrupted" }
        func clear() {}
    }

    private class AuthSuccess: AuthGateway {
        func signIn(email: String, password: String) -> AppResult<Session> { .success(AppFlowsTests.makeSession(email: email)) }
        func logIn(email: String, password: String) -> AppResult<Session> { .success(AppFlowsTests.makeSession(email: email)) }
    }

    private class AuthFailure: AuthGateway {
        func signIn(email: String, password: String) -> AppResult<Session> { .failure(AppFlowsTests.makeApiError()) }
        func logIn(email: String, password: String) -> AppResult<Session> { .failure(AppFlowsTests.makeApiError()) }
    }

    private class CameraSuccess: CameraGateway {
        private let image: MeasurementImage
        init(image: MeasurementImage) { self.image = image }
        func isReady() -> Bool { true }
        func openCamera() -> AppResult<MeasurementImage> { .success(image) }
    }

    private class CameraFailure: CameraGateway {
        func isReady() -> Bool { true }
        func openCamera() -> AppResult<MeasurementImage> { .failure(AppFlowsTests.makeApiError()) }
    }

    private class CameraNotReady: CameraGateway {
        func isReady() -> Bool { false }
        func openCamera() -> AppResult<MeasurementImage> { .failure(AppFlowsTests.makeApiError()) }
    }

    private class UploadSuccess: MeasurementUploadGateway {
        func upload(session: Session, image: MeasurementImage) -> AppResult<String> { .success("msr_1") }
    }

    private class UploadFailure: MeasurementUploadGateway {
        func upload(session: Session, image: MeasurementImage) -> AppResult<String> { .failure(AppFlowsTests.makeApiError()) }
    }

    private class HistorySuccess: HistoryGateway {
        func list(session: Session, filter: HistoryFilter) -> AppResult<[Measurement]> { .success([AppFlowsTests.makeMeasurement()]) }
    }

    private class HistoryFailure: HistoryGateway {
        func list(session: Session, filter: HistoryFilter) -> AppResult<[Measurement]> { .failure(AppFlowsTests.makeApiError()) }
    }

    private class DetailSuccess: MeasurementDetailGateway {
        func get(session: Session, measurementId: String) -> AppResult<MeasurementDetail> { .success(AppFlowsTests.makeDetail(status: .recognized)) }
        func save(session: Session, detail: MeasurementDetail) -> AppResult<MeasurementDetail> { .success(AppFlowsTests.makeDetail(status: .saved)) }
    }

    private class DetailFailure: MeasurementDetailGateway {
        func get(session: Session, measurementId: String) -> AppResult<MeasurementDetail> { .failure(AppFlowsTests.makeApiError()) }
        func save(session: Session, detail: MeasurementDetail) -> AppResult<MeasurementDetail> { .failure(AppFlowsTests.makeApiError()) }
    }

    // MARK: - Factories

    private static func makeSession(email: String) -> Session {
        Session(accessToken: "tok1", tokenType: "Bearer", expiresAt: "2026-12-31T00:00:00.000Z", user: MobileUser(id: "usr_1", email: email))
    }

    private static func makeApiError() -> ApiError {
        ApiError(code: "code", message: "api message", source: .api)
    }

    private static func makeMeasurement() -> Measurement {
        Measurement(id: "msr_1", status: .saved, systolic: 120, diastolic: 80, pulse: 68, armSide: .left, measurementTime: "2026-05-27T12:00:00.000Z", savedAt: "2026-05-27T12:05:00.000Z")
    }

    private static func makeDetail(status: MeasurementStatus) -> MeasurementDetail {
        MeasurementDetail(
            id: "msr_1",
            status: status,
            systolic: 120,
            diastolic: 80,
            pulse: 68,
            armSide: .left,
            measurementTime: "2026-05-27T12:00:00.000Z",
            savedAt: nil,
            imageUrl: "/api/v1/measurements/msr_1/image",
            recognitionError: nil
        )
    }
}

