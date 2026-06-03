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
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CameraAlt
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.masim05.bloodpressure.mobile.R
import com.masim05.bloodpressure.mobile.core.model.MeasurementImage
import com.masim05.bloodpressure.mobile.ui.TestTags
import java.io.File

private val PrimaryGreen = Color(0xFF1D9E75)
private val CardBorder = Color(0xFFE5E5E5)
private val CameraBg = Color(0xFF1A1A1A)

@OptIn(ExperimentalComposeUiApi::class)
@Composable
fun CameraScreen(
    isUploading: Boolean,
    errorText: String?,
    onUpload: () -> Unit,
    onCaptureReady: (MeasurementImage) -> Unit,
    onCaptureFailure: (String) -> Unit,
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
    var previewBindingAttempt by remember { mutableStateOf(0) }

    val cameraController = remember(context) {
        LifecycleCameraController(context).apply {
            setEnabledUseCases(CameraController.IMAGE_CAPTURE)
        }
    }

    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        permissionGranted = granted
        permissionDenied = !granted
        cameraReady = false
        if (!granted) {
            localError = context.getString(R.string.camera_permission_denied)
        } else {
            localError = null
            previewBindingAttempt += 1
        }
    }

    fun bindCameraPreview() {
        try {
            cameraController.bindToLifecycle(lifecycleOwner)
            cameraReady = true
            permissionDenied = false
            localError = null
        } catch (_: Throwable) {
            cameraReady = false
            localError = context.getString(R.string.camera_capture_failed)
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
                    previewBindingAttempt += 1
                } else {
                    cameraReady = false
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
                    onUpload()
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
            .padding(16.dp)
            .testTag(TestTags.CameraScreen),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(stringResource(R.string.camera_title), style = MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(12.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(340.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(CameraBg)
                .border(0.5.dp, CardBorder, RoundedCornerShape(14.dp))
                .testTag(TestTags.CameraPreview),
        ) {
            if (permissionGranted) {
                key(previewBindingAttempt) {
                    AndroidView(
                        modifier = Modifier.fillMaxSize(),
                        factory = { viewContext ->
                            PreviewView(viewContext).apply {
                                implementationMode = PreviewView.ImplementationMode.COMPATIBLE
                                scaleType = PreviewView.ScaleType.FILL_CENTER
                                controller = cameraController
                                bindCameraPreview()
                            }
                        },
                        update = { previewView ->
                            previewView.controller = cameraController
                        },
                    )
                }
            }

            CornerGuides()

            Box(
                modifier = Modifier
                    .align(Alignment.Center)
                    .clip(RoundedCornerShape(30.dp))
                    .background(Color(0x80000000))
                    .padding(horizontal = 10.dp, vertical = 4.dp),
            ) {
                Text(
                    text = stringResource(R.string.camera_overlay_hint),
                    color = Color.White,
                    fontSize = 11.sp,
                )
            }

            Button(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 16.dp)
                    .testTag(if ((errorText ?: localError) == null) TestTags.CameraCapture else "camera_retry"),
                enabled = permissionGranted && cameraReady && !isUploading && !isCapturing,
                shape = RoundedCornerShape(30.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen, contentColor = Color.White),
                onClick = {
                    if (permissionGranted) captureNow() else permissionLauncher.launch(Manifest.permission.CAMERA)
                },
            ) {
                Icon(Icons.Outlined.CameraAlt, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.size(6.dp))
                Text(
                    stringResource(if ((errorText ?: localError) == null) R.string.camera_upload else R.string.camera_retry),
                    fontWeight = FontWeight.Medium,
                )
            }
        }

        Spacer(Modifier.height(10.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .background(Color(0xFFE1F5EE))
                .padding(horizontal = 12.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.Top,
        ) {
            Icon(
                imageVector = Icons.Outlined.Info,
                contentDescription = null,
                tint = Color(0xFF0F6E56),
                modifier = Modifier.size(15.dp),
            )
            Text(
                text = stringResource(R.string.camera_tip),
                color = Color(0xFF0F6E56),
                fontSize = 11.sp,
                lineHeight = 14.sp,
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

        if (!permissionGranted) {
            if (shownError == null) {
                Text(
                    modifier = Modifier
                        .padding(top = 12.dp)
                        .testTag(TestTags.CameraError),
                    text = stringResource(R.string.camera_permission_denied),
                    color = MaterialTheme.colorScheme.error,
                )
            }
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

        if (permissionGranted && !cameraReady && !isUploading) {
            OutlinedButton(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                onClick = {
                    localError = null
                    previewBindingAttempt += 1
                },
            ) {
                Text(stringResource(R.string.camera_retry))
            }
        }
    }
}

@Composable
private fun CornerGuides() {
    Canvas(modifier = Modifier.fillMaxSize()) {
        val stroke = 2.dp.toPx()
        val guide = 28.dp.toPx()
        val alpha = 0.7f
        val color = Color.White.copy(alpha = alpha)
        val w = size.width
        val h = size.height

        drawLine(color, start = androidx.compose.ui.geometry.Offset(14f, 14f), end = androidx.compose.ui.geometry.Offset(14f + guide, 14f), strokeWidth = stroke, cap = StrokeCap.Round)
        drawLine(color, start = androidx.compose.ui.geometry.Offset(14f, 14f), end = androidx.compose.ui.geometry.Offset(14f, 14f + guide), strokeWidth = stroke, cap = StrokeCap.Round)

        drawLine(color, start = androidx.compose.ui.geometry.Offset(w - 14f - guide, 14f), end = androidx.compose.ui.geometry.Offset(w - 14f, 14f), strokeWidth = stroke, cap = StrokeCap.Round)
        drawLine(color, start = androidx.compose.ui.geometry.Offset(w - 14f, 14f), end = androidx.compose.ui.geometry.Offset(w - 14f, 14f + guide), strokeWidth = stroke, cap = StrokeCap.Round)

        drawLine(color, start = androidx.compose.ui.geometry.Offset(14f, h - 14f), end = androidx.compose.ui.geometry.Offset(14f + guide, h - 14f), strokeWidth = stroke, cap = StrokeCap.Round)
        drawLine(color, start = androidx.compose.ui.geometry.Offset(14f, h - 14f - guide), end = androidx.compose.ui.geometry.Offset(14f, h - 14f), strokeWidth = stroke, cap = StrokeCap.Round)

        drawLine(color, start = androidx.compose.ui.geometry.Offset(w - 14f - guide, h - 14f), end = androidx.compose.ui.geometry.Offset(w - 14f, h - 14f), strokeWidth = stroke, cap = StrokeCap.Round)
        drawLine(color, start = androidx.compose.ui.geometry.Offset(w - 14f, h - 14f - guide), end = androidx.compose.ui.geometry.Offset(w - 14f, h - 14f), strokeWidth = stroke, cap = StrokeCap.Round)
    }
}
