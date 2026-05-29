package com.masim05.bloodpressure.mobile.ui.screens

import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.unit.dp
import com.masim05.bloodpressure.mobile.R
import com.masim05.bloodpressure.mobile.ui.TestTags

@OptIn(ExperimentalComposeUiApi::class)
@Composable
fun CameraScreen(
    isUploading: Boolean,
    errorText: String?,
    onUpload: () -> Unit,
    onHistory: () -> Unit,
) {
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
        if (isUploading) {
            Text(
                modifier = Modifier.padding(top = 12.dp),
                text = stringResource(R.string.status_uploading),
                style = MaterialTheme.typography.bodyMedium,
            )
        }
        if (errorText != null) {
            Text(
                modifier = Modifier
                    .padding(top = 12.dp)
                    .testTag(TestTags.CameraError),
                text = errorText,
                color = MaterialTheme.colorScheme.error,
            )
        }
        Button(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 24.dp)
                .testTag(if (errorText == null) "camera_upload" else "camera_retry"),
            enabled = !isUploading,
            onClick = onUpload,
        ) {
            Text(stringResource(if (errorText == null) R.string.camera_upload else R.string.camera_retry))
        }
        OutlinedButton(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 8.dp)
                .testTag("camera_history"),
            enabled = !isUploading,
            onClick = onHistory,
        ) {
            Text(stringResource(R.string.camera_history))
        }
    }
}