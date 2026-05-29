# Research: Camera Ready Capture

## Decision: Use CameraX for live preview and one-tap capture

**Rationale**: CameraX is the official AndroidX camera stack for modern Android apps and provides stable lifecycle-aware preview + capture primitives (`ProcessCameraProvider`, `Preview`, `ImageCapture`) that map directly to the requirement for immediate live camera and one-tap capture.

**Alternatives considered**: Camera2 direct APIs were rejected due to higher complexity and higher regression risk for this focused fix. External camera intent-only flow was rejected because it does not satisfy always-visible in-screen live preview.

## Decision: Embed PreviewView into Compose with AndroidView

**Rationale**: The app UI is Compose Material 3, and `PreviewView` is the supported surface for CameraX preview. `AndroidView` lets Compose host `PreviewView` while keeping current screen architecture and avoiding a full View-based screen rewrite.

**Alternatives considered**: Custom OpenGL surface wiring was rejected as unnecessary complexity. Compose-only camera preview without `PreviewView` was rejected because CameraX officially centers around `PreviewView` integration.

## Decision: Keep capture/upload business routing in existing flow state model

**Rationale**: Existing core flow already routes successful upload to History and maps failures to Camera error state. Keep this behavior and adapt camera acquisition so UI provides captured image bytes/metadata to the existing upload path.

**Alternatives considered**: Moving all capture/upload logic into UI was rejected because it would break current ports/adapters boundary and reduce unit testability.

## Decision: Add explicit camera availability and permission error states to UI

**Rationale**: The specification requires user-visible error handling when camera access fails or permission is denied. UI state must represent initialization/ready/error so users are not left on a dead-end screen and can still navigate to History.

**Alternatives considered**: Silent fallback to placeholder copy was rejected because it hides errors and violates API/mobile error-visibility requirements.

## Decision: Keep implementation app-only under mobile/android

**Rationale**: The feature scope explicitly forbids API code and API test changes. Camera behavior can be fixed entirely in Android app adapters, screen state, and mobile tests.

**Alternatives considered**: Backend-assisted camera metadata validation was rejected as out-of-scope.

## Decision: Preserve and update Maestro US4 flow for camera-ready behavior

**Rationale**: Constitution requires happy-path Maestro coverage per Android user story. US4 must verify the intended journey (camera visible and one-tap capture path to history) rather than only button presence.

**Alternatives considered**: Relying only on unit tests was rejected because end-to-end user flow coverage is mandatory.

## Decision: Maintain >=95% Android unit coverage by extending existing flow/adapter tests

**Rationale**: Current project already enforces `androidCoverageVerify` at 95%. Camera behavior changes should extend existing `core/flow` and `adapters/camera` tests to keep gate compliance.

**Alternatives considered**: Excluding new camera code from coverage was rejected because it would weaken CI quality gates and violate constitution.
