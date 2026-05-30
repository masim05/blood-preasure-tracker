# Data Model: Camera Ready Capture

## Entity: CameraUiState

Represents the user-visible camera screen state.

Fields:
- status: enum (`Initializing`, `Ready`, `Error`, `Capturing`, `Uploading`)
- previewVisible: boolean
- canCapture: boolean
- canOpenHistory: boolean
- errorMessage: localized string key/value or null
- lastCaptureAt: timestamp or null

Validation rules:
- `previewVisible` MUST be true only when `status` is `Ready` or `Capturing`.
- `canCapture` MUST be false when `status` is `Initializing`, `Uploading`, or `Error`.
- `errorMessage` MUST be non-null only when `status` is `Error`.

State transitions:
1. `Initializing` -> `Ready` when camera provider binds successfully.
2. `Initializing` -> `Error` when permission denied or camera bind fails.
3. `Ready` -> `Capturing` on one-tap capture action.
4. `Capturing` -> `Uploading` when image is produced and upload starts.
5. `Capturing` -> `Error` when image capture fails.
6. `Uploading` -> `Ready` when upload fails (error shown, retry allowed).
7. `Uploading` -> route transition to History when upload succeeds.

## Entity: CaptureRequest

Represents one requested image capture from the camera screen.

Fields:
- requestId: string
- requestedAt: timestamp
- trigger: enum (`PrimaryCaptureButton`)
- sessionId: optional string

Validation rules:
- requestId MUST be unique per trigger event.
- trigger MUST be present and equal to one-tap action for this feature scope.

## Entity: CapturedMeasurementImage

Represents the captured photo payload prepared for upload.

Fields:
- uri: string
- mimeType: string (`image/png` or `image/jpeg`)
- byteCount: integer
- capturedAt: timestamp

Validation rules:
- `mimeType` MUST be supported by existing upload validator.
- `byteCount` MUST be > 0.
- `uri` MUST be non-empty.

## Entity: CameraFailure

Represents user-visible camera setup/capture failures.

Fields:
- type: enum (`PermissionDenied`, `Unavailable`, `BindFailed`, `CaptureFailed`)
- message: localized user-facing text
- isRetryable: boolean

Validation rules:
- Every failure MUST map to a localized message.
- `PermissionDenied` and `Unavailable` MUST leave History navigation available.

## Entity: UploadOutcome

Represents result of uploading a captured image.

Fields:
- status: enum (`Success`, `Failure`)
- uploadId: string or null
- apiErrorMessage: string or null

Validation rules:
- On `Success`, `uploadId` MUST be non-null and route target MUST be History.
- On `Failure`, `apiErrorMessage` MUST be visible in Camera UI state.
