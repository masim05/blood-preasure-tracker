package com.masim05.bloodpressure.mobile.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.masim05.bloodpressure.mobile.R
import com.masim05.bloodpressure.mobile.ui.TestTags

@Composable
fun ProfileScreen(onLogout: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .testTag(TestTags.ProfileScreen),
        verticalArrangement = Arrangement.Top,
    ) {
        Text(stringResource(R.string.profile_title), style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(12.dp))
        Text(stringResource(R.string.profile_settings), style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(16.dp))
        Button(
            modifier = Modifier.testTag(TestTags.ProfileLogout),
            onClick = onLogout,
        ) {
            Text(stringResource(R.string.profile_logout))
        }
    }
}
