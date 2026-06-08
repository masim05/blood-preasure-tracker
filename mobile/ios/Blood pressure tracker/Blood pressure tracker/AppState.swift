// AppState.swift
// Blood pressure tracker
// Central observable state driver for navigation and screen data.

import Foundation
import Combine

// MARK: - App configuration

let apiBaseUrl: String = {
    #if DEBUG
    return "http://localhost:3000"
    #else
    return "https://bpt.crptmax.com"
    #endif
}()

// MARK: - AppState

@MainActor
class AppState: ObservableObject {
    // MARK: Published state
    @Published var route: Route = .auth
    @Published var authMode: AuthMode = .login
    @Published var session: Session? = nil
    @Published var apiError: ApiError? = nil
    @Published var validationError: ValidationError? = nil
    @Published var measurements: [Measurement] = []
    @Published var measurementDetail: MeasurementDetail? = nil
    @Published var historyFilter: HistoryFilter = HistoryFilter()
    @Published var lastUploadId: String? = nil
    @Published var isLoading: Bool = false
    @Published var selectedLanguageCode: String = systemLanguageCode

    // MARK: Dependencies
    let sessionStore: SessionStore
    private let apiClient: HttpApiClient
    private let authFlow: AuthFlow
    private let guideFlow: GuideFlow
    private let historyFlow: HistoryFlow
    private let detailFlow: MeasurementDetailFlow

    init(sessionStore: SessionStore = UserDefaultsSessionStore(),
         apiClient: HttpApiClient = HttpApiClient(baseUrl: apiBaseUrl)) {
        self.sessionStore = sessionStore
        self.apiClient = apiClient
        self.authFlow = AuthFlow(authGateway: apiClient, sessionStore: sessionStore)
        self.guideFlow = GuideFlow(sessionStore: sessionStore)
        self.historyFlow = HistoryFlow(sessionStore: sessionStore, historyGateway: apiClient)
        self.detailFlow = MeasurementDetailFlow(sessionStore: sessionStore, detailGateway: apiClient)
        restoreSession()
    }

    // MARK: - Navigation helpers

    private func apply(_ state: ScreenState) {
        route = state.route
        authMode = state.authMode
        session = state.session
        apiError = state.error
        validationError = state.validationError
        measurements = state.measurements
        if let d = state.measurementDetail { measurementDetail = d }
        historyFilter = state.filter
        if let id = state.lastUploadId { lastUploadId = id }
    }

    // MARK: - Auth

    func signIn(email: String, password: String) {
        isLoading = true
        apiError = nil
        validationError = nil
        Task.detached { [weak self] in
            guard let self else { return }
            let state = self.authFlow.signIn(email: email, password: password)
            await MainActor.run {
                self.isLoading = false
                self.apply(state)
            }
        }
    }

    func logIn(email: String, password: String) {
        isLoading = true
        apiError = nil
        validationError = nil
        Task.detached { [weak self] in
            guard let self else { return }
            let state = self.authFlow.logIn(email: email, password: password)
            await MainActor.run {
                self.isLoading = false
                self.apply(state)
            }
        }
    }

    // MARK: - Guide

    func enterGuide() { apply(guideFlow.enterGuide()) }
    func continueToCamera() { apply(guideFlow.continueToCamera()) }

    // MARK: - History

    func loadHistory(filter: HistoryFilter? = nil) {
        isLoading = true
        apiError = nil
        validationError = nil
        let f = filter ?? historyFilter
        Task.detached { [weak self] in
            guard let self else { return }
            let state = self.historyFlow.load(filter: f)
            await MainActor.run {
                self.isLoading = false
                self.apply(state)
            }
        }
    }

    func clearFilter() {
        loadHistory(filter: HistoryFilter())
    }

    func rowOpensDetail(_ measurement: Measurement) {
        apply(historyFlow.rowOpensDetail(measurement))
    }

    // MARK: - Measurement detail

    func loadDetail(measurementId: String) {
        isLoading = true
        apiError = nil
        Task.detached { [weak self] in
            guard let self else { return }
            let state = self.detailFlow.load(measurementId: measurementId)
            await MainActor.run {
                self.isLoading = false
                self.apply(state)
            }
        }
    }

    func saveDetail(_ detail: MeasurementDetail) {
        isLoading = true
        apiError = nil
        Task.detached { [weak self] in
            guard let self else { return }
            let state = self.detailFlow.save(detail: detail)
            await MainActor.run {
                self.isLoading = false
                self.apply(state)
            }
        }
    }

    func fetchMeasurementImage(imageUrl: String) -> AppResult<Data> {
        guard let session = sessionStore.load() else {
            return .failure(ApiError(code: nil, message: "No session", source: .unexpected))
        }
        return apiClient.fetchMeasurementImage(imageUrl: imageUrl, authorization: session.authorizationHeader)
    }

    // MARK: - Upload (called from CameraView after capture)

    func uploadImage(_ image: MeasurementImage) {
        isLoading = true
        apiError = nil
        validationError = nil
        guard let session = sessionStore.load() else {
            isLoading = false
            route = .auth
            return
        }
        Task.detached { [weak self] in
            guard let self else { return }
            if case .invalid(let reason) = Validators.image(image) {
                await MainActor.run {
                    self.isLoading = false
                    self.validationError = reason
                }
                return
            }
            let result = self.apiClient.upload(session: session, image: image)
            await MainActor.run {
                self.isLoading = false
                switch result {
                case .success(let id):
                    self.lastUploadId = id
                    self.route = .history
                case .failure(let error):
                    self.apiError = error
                }
            }
        }
    }

    // MARK: - Back navigation

    func goBack() {
        measurementDetail = nil
        route = .history
    }

    // MARK: - Profile / Auth

    func logout() {
        sessionStore.clear()
        session = nil
        measurements = []
        measurementDetail = nil
        lastUploadId = nil
        historyFilter = HistoryFilter()
        route = .auth
    }

    func openGuideFromProfile() { route = .guide }

    // MARK: - Session restore

    private func restoreSession() {
        if let session = sessionStore.load(), session.isActive() {
            self.session = session
            route = .camera
        } else if sessionStore.loadError() != nil {
            route = .auth
        }
    }
}
