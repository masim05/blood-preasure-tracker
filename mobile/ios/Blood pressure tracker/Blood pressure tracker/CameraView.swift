// CameraView.swift
// Blood pressure tracker
// Camera capture screen mirroring Android's CameraScreen.kt

import SwiftUI
import AVFoundation
import Combine
import UIKit

// MARK: - CameraView

struct CameraView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var cameraModel = CameraModel()

    var body: some View {
        VStack(alignment: .center, spacing: 0) {
            Text("Camera")
                .font(.title2.bold())
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.bottom, 12)

            // Camera preview box
            ZStack {
                RoundedRectangle(cornerRadius: 14)
                    .fill(AppColors.cameraBg)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(AppColors.cardBorder, lineWidth: 0.5)
                    )
                    .frame(maxWidth: .infinity)
                    .frame(height: 340)

                if cameraModel.permissionGranted {
                    CameraPreviewView(session: cameraModel.captureSession)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }

                // Corner guides overlay
                CornerGuidesView()

                // Overlay hint
                Text("Point at display")
                    .font(.system(size: 11))
                    .foregroundColor(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Color.black.opacity(0.5))
                    .cornerRadius(30)

                // Capture button
                VStack {
                    Spacer()
                    Button(action: captureAction) {
                        HStack(spacing: 6) {
                            Image(systemName: "camera")
                                .font(.system(size: 16))
                            Text(captureButtonLabel())
                                .font(.system(size: 15, weight: .medium))
                        }
                        .foregroundColor(.white)
                        .padding(.horizontal, 18)
                        .padding(.vertical, 10)
                    }
                    .background(AppColors.primaryGreen)
                    .cornerRadius(30)
                    .disabled(!cameraModel.canCapture || appState.isLoading)
                    .padding(.bottom, 16)
                    .accessibilityIdentifier(
                        appState.apiError == nil && cameraModel.localError == nil
                            ? AccessibilityIdentifiers.cameraCapture
                            : "camera_retry"
                    )
                }
            }
            .frame(height: 340)
            .accessibilityIdentifier(AccessibilityIdentifiers.cameraPreview)

            Spacer().frame(height: 10)

            // Tip row
            HStack(alignment: .top, spacing: 6) {
                Image(systemName: "info.circle")
                    .font(.system(size: 13))
                    .foregroundColor(AppColors.tipText)
                Text("Ensure good lighting and keep the screen steady for best results.")
                    .font(.system(size: 11))
                    .foregroundColor(AppColors.tipText)
                    .lineSpacing(2)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(AppColors.tipBg)
            .cornerRadius(8)

            // Loading / uploading indicator
            if !cameraModel.isReady && cameraModel.permissionGranted && cameraModel.localError == nil {
                Text("Starting camera preview…")
                    .font(.system(size: 14))
                    .foregroundColor(AppColors.secondaryText)
                    .padding(.top, 12)
                    .accessibilityIdentifier(AccessibilityIdentifiers.cameraLoading)
            }

            if appState.isLoading {
                Text("Uploading measurement image.")
                    .font(.system(size: 14))
                    .padding(.top, 12)
            }

            // Error display
            let shownError = appState.apiError?.message ?? cameraModel.localError
            if let err = shownError {
                Text(err)
                    .foregroundColor(.red)
                    .font(.system(size: 14))
                    .padding(.top, 12)
                    .accessibilityIdentifier(AccessibilityIdentifiers.cameraError)
            }

            // Permission denied fallback
            if !cameraModel.permissionGranted {
                if shownError == nil {
                    Text("Camera permission is required to take a picture.")
                        .foregroundColor(.red)
                        .font(.system(size: 14))
                        .padding(.top, 12)
                        .accessibilityIdentifier(AccessibilityIdentifiers.cameraError)
                }
                Button("Open settings") {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                }
                .padding(.top, 12)
                .frame(maxWidth: .infinity)
                .accessibilityIdentifier(AccessibilityIdentifiers.cameraOpenSettings)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .accessibilityIdentifier(AccessibilityIdentifiers.cameraScreen)
        .onAppear { cameraModel.start() }
        .onDisappear { cameraModel.stop() }
        .onReceive(cameraModel.$capturedImage) { image in
            guard let image else { return }
            appState.uploadImage(image)
            cameraModel.capturedImage = nil
        }
    }

    private func captureAction() {
        if !cameraModel.permissionGranted {
            cameraModel.requestPermission()
        } else {
            cameraModel.capture()
        }
    }

    private func captureButtonLabel() -> String {
        if appState.isLoading { return "Uploading…" }
        let hasError = appState.apiError != nil || cameraModel.localError != nil
        return hasError ? "Retry" : "Take picture"
    }
}

// MARK: - UIViewRepresentable camera preview

struct CameraPreviewView: UIViewRepresentable {
    let session: AVCaptureSession

    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.backgroundColor = .black
        let layer = AVCaptureVideoPreviewLayer(session: session)
        layer.videoGravity = .resizeAspectFill
        layer.frame = view.bounds
        view.layer.addSublayer(layer)
        context.coordinator.previewLayer = layer
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        context.coordinator.previewLayer?.frame = uiView.bounds
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    class Coordinator {
        var previewLayer: AVCaptureVideoPreviewLayer?
    }
}

// MARK: - CameraModel

@MainActor
class CameraModel: ObservableObject {
    @Published var permissionGranted: Bool = false
    @Published var isReady: Bool = false
    @Published var localError: String? = nil
    @Published var capturedImage: MeasurementImage? = nil

    let captureSession = AVCaptureSession()
    private let photoOutput = AVCapturePhotoOutput()

    var canCapture: Bool { permissionGranted && isReady }

    func start() {
        checkPermission()
    }

    func stop() {
        isReady = false
        Task.detached { [weak self] in
            self?.captureSession.stopRunning()
        }
    }

    func requestPermission() {
        AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
            Task { @MainActor [weak self] in
                guard let self else { return }
                self.permissionGranted = granted
                if granted { self.setupSession() }
                else { self.localError = "Camera permission is required to take a picture." }
            }
        }
    }

    func capture() {
        guard isReady else { return }
        let settings = AVCapturePhotoSettings()
        photoOutput.capturePhoto(with: settings, delegate: makeDelegate())
    }

    // MARK: - Private

    private func checkPermission() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            permissionGranted = true
            setupSession()
        case .notDetermined:
            requestPermission()
        default:
            permissionGranted = false
        }
    }

    private func setupSession() {
        isReady = false
        Task.detached { [weak self] in
            guard let self else { return }
            self.captureSession.beginConfiguration()
            defer { self.captureSession.commitConfiguration() }

            // Remove existing inputs/outputs to avoid duplicates
            for input in self.captureSession.inputs {
                self.captureSession.removeInput(input)
            }
            for output in self.captureSession.outputs {
                self.captureSession.removeOutput(output)
            }

            guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
                  let input = try? AVCaptureDeviceInput(device: device),
                  self.captureSession.canAddInput(input)
            else {
                await MainActor.run {
                    self.isReady = false
                    self.localError = "Unable to capture image. Try again."
                }
                return
            }
            self.captureSession.addInput(input)
            if self.captureSession.canAddOutput(self.photoOutput) {
                self.captureSession.addOutput(self.photoOutput)
            }
            self.captureSession.startRunning()
            await MainActor.run { self.isReady = true }
        }
    }

    private func makeDelegate() -> AVCapturePhotoCaptureDelegate {
        PhotoCaptureDelegate { [weak self] result in
            Task { @MainActor [weak self] in
                guard let self else { return }
                switch result {
                case .success(let image):
                    self.capturedImage = image
                case .failure:
                    self.localError = "Unable to capture image. Try again."
                }
            }
        }
    }
}

// MARK: - Photo capture delegate

private class PhotoCaptureDelegate: NSObject, AVCapturePhotoCaptureDelegate {
    private let completion: (Result<MeasurementImage, Error>) -> Void

    init(completion: @escaping (Result<MeasurementImage, Error>) -> Void) {
        self.completion = completion
    }

    func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        if let error = error {
            completion(.failure(error))
            return
        }
        guard let data = photo.fileDataRepresentation() else {
            completion(.failure(NSError(domain: "CameraCapture", code: -1)))
            return
        }
        let tmpURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("measurement_\(Int(Date().timeIntervalSince1970)).jpg")
        do {
            try data.write(to: tmpURL)
            let image = MeasurementImage(uri: tmpURL.absoluteString, mimeType: "image/jpeg", sizeBytes: Int64(data.count))
            completion(.success(image))
        } catch {
            completion(.failure(error))
        }
    }
}

// MARK: - Corner guides overlay

private struct CornerGuidesView: View {
    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            let guide: CGFloat = 28
            let offset: CGFloat = 14
            let stroke: CGFloat = 2

            Path { path in
                // Top-left
                path.move(to: CGPoint(x: offset, y: offset + guide))
                path.addLine(to: CGPoint(x: offset, y: offset))
                path.addLine(to: CGPoint(x: offset + guide, y: offset))
                // Top-right
                path.move(to: CGPoint(x: w - offset - guide, y: offset))
                path.addLine(to: CGPoint(x: w - offset, y: offset))
                path.addLine(to: CGPoint(x: w - offset, y: offset + guide))
                // Bottom-left
                path.move(to: CGPoint(x: offset, y: h - offset - guide))
                path.addLine(to: CGPoint(x: offset, y: h - offset))
                path.addLine(to: CGPoint(x: offset + guide, y: h - offset))
                // Bottom-right
                path.move(to: CGPoint(x: w - offset - guide, y: h - offset))
                path.addLine(to: CGPoint(x: w - offset, y: h - offset))
                path.addLine(to: CGPoint(x: w - offset, y: h - offset - guide))
            }
            .stroke(Color.white.opacity(0.7), style: StrokeStyle(lineWidth: stroke, lineCap: .round))
        }
    }
}
