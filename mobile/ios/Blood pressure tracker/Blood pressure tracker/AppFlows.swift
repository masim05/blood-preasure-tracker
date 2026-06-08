// AppFlows.swift
// Blood pressure tracker
// Business-logic flows mirroring Android's AppFlows.kt

import Foundation

// MARK: - Auth flow

class AuthFlow {
    private let authGateway: AuthGateway
    private let sessionStore: SessionStore

    init(authGateway: AuthGateway, sessionStore: SessionStore) {
        self.authGateway = authGateway
        self.sessionStore = sessionStore
    }

    func signIn(email: String, password: String) -> ScreenState {
        authenticate(email: email, password: password, routeOnSuccess: .guide, authMode: .newAccount) {
            self.authGateway.signIn(email: email.trimmingCharacters(in: .whitespaces), password: password)
        }
    }

    func logIn(email: String, password: String) -> ScreenState {
        authenticate(email: email, password: password, routeOnSuccess: .camera, authMode: .login) {
            self.authGateway.logIn(email: email.trimmingCharacters(in: .whitespaces), password: password)
        }
    }

    private func authenticate(
        email: String,
        password: String,
        routeOnSuccess: Route,
        authMode: AuthMode,
        request: () -> AppResult<Session>
    ) -> ScreenState {
        if case .invalid(let reason) = Validators.email(email) {
            return ScreenState(route: .auth, authMode: authMode, validationError: reason)
        }
        if case .invalid(let reason) = Validators.password(password) {
            return ScreenState(route: .auth, authMode: authMode, validationError: reason)
        }
        switch request() {
        case .success(let session):
            sessionStore.save(session)
            return ScreenState(route: routeOnSuccess, session: session)
        case .failure(let error):
            return ScreenState(route: .auth, authMode: authMode, error: error)
        }
    }
}

// MARK: - Guide flow

class GuideFlow {
    private let sessionStore: SessionStore

    init(sessionStore: SessionStore) {
        self.sessionStore = sessionStore
    }

    func enterGuide() -> ScreenState {
        guard let session = sessionStore.load() else { return ScreenState(route: .auth) }
        return ScreenState(route: .guide, session: session)
    }

    func continueToCamera() -> ScreenState {
        guard let session = sessionStore.load() else { return ScreenState(route: .auth) }
        return ScreenState(route: .camera, session: session)
    }
}

// MARK: - Capture flow

class CaptureFlow {
    private let sessionStore: SessionStore
    private let cameraGateway: CameraGateway
    private let uploadGateway: MeasurementUploadGateway

    init(sessionStore: SessionStore, cameraGateway: CameraGateway, uploadGateway: MeasurementUploadGateway) {
        self.sessionStore = sessionStore
        self.cameraGateway = cameraGateway
        self.uploadGateway = uploadGateway
    }

    func enterCamera() -> ScreenState {
        guard let session = sessionStore.load() else { return ScreenState(route: .auth) }
        return ScreenState(route: .camera, session: session)
    }

    func history() -> ScreenState {
        guard let session = sessionStore.load() else { return ScreenState(route: .auth) }
        return ScreenState(route: .history, session: session)
    }

    func captureAndUpload() -> ScreenState {
        guard let session = sessionStore.load() else { return ScreenState(route: .auth) }
        if !cameraGateway.isReady() {
            return ScreenState(
                route: .camera,
                session: session,
                error: ApiError(code: "camera_not_ready", message: "camera_not_ready", source: .unexpected)
            )
        }
        switch cameraGateway.openCamera() {
        case .failure(let error):
            return ScreenState(route: .camera, session: session, error: error)
        case .success(let image):
            return upload(session: session, image: image)
        }
    }

    private func upload(session: Session, image: MeasurementImage) -> ScreenState {
        if case .invalid(let reason) = Validators.image(image) {
            return ScreenState(route: .camera, session: session, validationError: reason)
        }
        switch uploadGateway.upload(session: session, image: image) {
        case .success(let id):
            return ScreenState(route: .history, session: session, lastUploadId: id)
        case .failure(let error):
            return ScreenState(route: .camera, session: session, error: error)
        }
    }
}

// MARK: - History flow

class HistoryFlow {
    private let sessionStore: SessionStore
    private let historyGateway: HistoryGateway

    init(sessionStore: SessionStore, historyGateway: HistoryGateway) {
        self.sessionStore = sessionStore
        self.historyGateway = historyGateway
    }

    func load(filter: HistoryFilter) -> ScreenState {
        guard let session = sessionStore.load() else { return ScreenState(route: .auth) }
        if case .invalid(let reason) = Validators.historyFilter(filter) {
            return ScreenState(route: .history, session: session, validationError: reason, filter: filter)
        }
        switch historyGateway.list(session: session, filter: filter) {
        case .success(let measurements):
            return ScreenState(route: .history, session: session, measurements: measurements, filter: filter)
        case .failure(let error):
            return ScreenState(route: .history, session: session, error: error, filter: filter)
        }
    }

    func rowOpensDetail(_ measurement: Measurement) -> ScreenState {
        guard let session = sessionStore.load() else { return ScreenState(route: .auth) }
        let detail = MeasurementDetail(
            id: measurement.id,
            status: measurement.status,
            systolic: measurement.systolic,
            diastolic: measurement.diastolic,
            pulse: measurement.pulse,
            armSide: measurement.armSide,
            measurementTime: measurement.measurementTime,
            savedAt: measurement.savedAt,
            imageUrl: "",
            recognitionError: nil
        )
        return ScreenState(route: .measurementDetail, session: session, measurementDetail: detail)
    }
}

// MARK: - Measurement detail flow

class MeasurementDetailFlow {
    private let sessionStore: SessionStore
    private let detailGateway: MeasurementDetailGateway

    init(sessionStore: SessionStore, detailGateway: MeasurementDetailGateway) {
        self.sessionStore = sessionStore
        self.detailGateway = detailGateway
    }

    func load(measurementId: String) -> ScreenState {
        guard let session = sessionStore.load() else { return ScreenState(route: .auth) }
        switch detailGateway.get(session: session, measurementId: measurementId) {
        case .success(let detail):
            return ScreenState(route: .measurementDetail, session: session, measurementDetail: detail)
        case .failure(let error):
            return ScreenState(route: .measurementDetail, session: session, error: error)
        }
    }

    func save(detail: MeasurementDetail) -> ScreenState {
        guard let session = sessionStore.load() else { return ScreenState(route: .auth) }
        switch detailGateway.save(session: session, detail: detail) {
        case .success(let saved):
            return ScreenState(route: .measurementDetail, session: session, measurementDetail: saved)
        case .failure(let error):
            return ScreenState(route: .measurementDetail, session: session, error: error, measurementDetail: detail)
        }
    }
}
