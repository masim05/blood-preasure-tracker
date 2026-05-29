package com.masim05.bloodpressure.mobile.ui.screens

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.view.CameraController
import androidx.camera.view.LifecycleCameraController
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.masim05.bloodpressure.mobile.R
import com.masim05.bloodpressure.mobile.core.model.MeasurementImage
import com.masim05.bloodpressure.mobile.ui.TestTags
import androidx.core.content.ContextCompat
import java.io.File

@OptIn(ExperimentalComposeUiApi::class)
@Composable
fun CameraScreen(
    isUploading: Boolean,
    errorText: String?,
    onUpload: () -> Unit,
    onCaptureReady: (MeasurementImage) -> Unit,
    onCaptureFailure: (String) -> Unit,
    onHistory: () -> Unit,
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val appContext = context.applicationContext
    val captureExecutor = remember { ContextCompat.getMainExecutor(context) }
    var permissionGranted by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED,
        )
    }
    var permissionDenied by remember { mutableStateOf(!permissionGranted) }
    var cameraReady by remember { mutableStateOf(false) }
    var localError by remember { mutableStateOf<String?>(null) }
    var isCapturing by remember { mutableStateOf(false) }

    val cameraController = remember(context) {
        LifecycleCameraController(context).apply {
            setEnabledUseCases(CameraController.IMAGE_CAPTURE)
        }
    }

    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        permissionGranted = granted
        permissionDenied = !granted
        if (!granted) {
            localError = context.getString(R.string.camera_permission_denied)
        }
    }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                val granted = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
                permissionGranted = granted
                permissionDenied = !granted
                if (granted) {
                    localError = null
                }
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    LaunchedEffect(Unit) {
        if (!permissionGranted) {
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    fun openSettings() {
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.fromParts("package", appContext.packageName, null)
        }
        context.startActivity(intent)
    }

    fun captureNow() {
        if (!permissionGranted || isUploading || isCapturing) return
        isCapturing = true
        localError = null
        val outputFile = File.createTempFile("measurement_", ".jpg", appContext.cacheDir)
        val outputOptions = ImageCapture.OutputFileOptions.Builder(outputFile).build()
        cameraController.takePicture(
            outputOptions,
            captureExecutor,
            object : ImageCapture.OnImageSavedCallback {
                override fun onImageSaved(outputFileResults: ImageCapture.OutputFileResults) {
                    isCapturing = false
                    val image = MeasurementImage(
                        uri = (outputFileResults.savedUri ?: Uri.fromFile(outputFile)).toString(),
                        mimeType = "image/jpeg",
                        sizeBytes = outputFile.length(),
                    )
                    onCaptureReady(image)
                }

                override fun onError(exception: ImageCaptureException) {
                    isCapturing = false
                    val message = context.getString(R.string.camera_capture_failed)
                    localError = message
                    onCaptureFailure(message)
                }
            },
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .semantics { testTagsAsResourceId = true }
            .padding(24.dp)
            .testTag(TestTags.CameraScreen),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(stringResource(R.string.camera_title), style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(16.dp))
        Text(stringResource(R.string.camera_copy), style = MaterialTheme.typography.bodyLarge)

        if (permissionGranted) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(260.dp)
                    .padding(top = 16.dp)
                    .background(MaterialTheme.colorScheme.surfaceVariant)
                    .testTag(TestTags.CameraPreview),
            ) {
                AndroidView(
                    modifier = Modifier.fillMaxSize(),
                    factory = { viewContext ->
                        PreviewView(viewContext).apply {
                            implementationMode = PreviewView.ImplementationMode.COMPATIBLE
                            scaleType = PreviewView.ScaleType.FILL_CENTER
                            controller = cameraController
                            try {
                                cameraController.bindToLifecycle(lifecycleOwner)
                                cameraReady = true
                                permissionDenied = false
                                localError = null
                            } catch (_: Throwable) {
                                cameraReady = false
                                localError = viewContext.getString(R.string.camera_capture_failed)
                            }
                        }
                    },
                    update = { previewView ->
                        previewView.controller = cameraController
                    },
                )
            }
        }

        if (!permissionGranted) {
            Text(
                modifier = Modifier
                    .padding(top = 12.dp)
                    .testTag(TestTags.CameraError),
                text = stringResource(R.string.camera_permission_denied),
                color = MaterialTheme.colorScheme.error,
            )
        }

        if (!cameraReady && permissionGranted && localError == null) {
            Text(
                modifier = Modifier
                    .padding(top = 12.dp)
                    .testTag(TestTags.CameraLoading),
                text = stringResource(R.string.camera_preview_loading),
                style = MaterialTheme.typography.bodyMedium,
            )
        }

        if (isUploading || isCapturing) {
            Text(
                modifier = Modifier.padding(top = 12.dp),
                text = stringResource(R.string.status_uploading),
                style = MaterialTheme.typography.bodyMedium,
            )
        }

        val shownError = errorText ?: localError
        if (shownError != null) {
            Text(
                modifier = Modifier
                    .padding(top = 12.dp)
                    .testTag(TestTags.CameraError),
                text = shownError,
                color = MaterialTheme.colorScheme.error,
            )
        }

        if (permissionDenied) {
            OutlinedButton(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp)
                    .testTag(TestTags.CameraOpenSettings),
                onClick = ::openSettings,
            ) {
                Text(stringResource(R.string.camera_open_settings))
            }
        }

        Button(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 24.dp)
                .testTag(if (shownError == null) TestTags.CameraCapture else "camera_retry"),
            enabled = permissionGranted && cameraReady && !isUploading && !isCapturing,
            onClick = {
                if (permissionGranted) {
                    captureNow()
                } else {
                    permissionLauncher.launch(Manifest.permission.CAMERA)
                }
            },
        ) {
            Text(stringResource(if (shownError == null) R.string.camera_upload else R.string.camera_retry))
        }
        OutlinedButton(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 8.dp)
                .testTag(TestTags.CameraHistory),
            enabled = !isUploading && !isCapturing,
            onClick = onHistory,
        ) {
            Text(stringResource(R.string.camera_history))
        }

        if (permissionGranted && !cameraReady && !isUploading) {
            OutlinedButton(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                onClick = onUpload,
            ) {
                Text(stringResource(R.string.camera_retry))
            }
        }
    }
}