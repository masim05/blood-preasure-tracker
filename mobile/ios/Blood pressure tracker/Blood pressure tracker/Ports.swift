// Ports.swift
// Blood pressure tracker
// Protocol interfaces mirroring Android's Ports.kt

import Foundation

protocol AuthGateway {
    func signIn(email: String, password: String) -> AppResult<Session>
    func logIn(email: String, password: String) -> AppResult<Session>
}

protocol SessionStore {
    func save(_ session: Session)
    func load() -> Session?
    func loadError() -> String?
    func clear()
}

protocol MeasurementUploadGateway {
    func upload(session: Session, image: MeasurementImage) -> AppResult<String>
}

protocol HistoryGateway {
    func list(session: Session, filter: HistoryFilter) -> AppResult<[Measurement]>
}

protocol MeasurementDetailGateway {
    func get(session: Session, measurementId: String) -> AppResult<MeasurementDetail>
    func save(session: Session, detail: MeasurementDetail) -> AppResult<MeasurementDetail>
}

protocol CameraGateway {
    func isReady() -> Bool
    func openCamera() -> AppResult<MeasurementImage>
}
