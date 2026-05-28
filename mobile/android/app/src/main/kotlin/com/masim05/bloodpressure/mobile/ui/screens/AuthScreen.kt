package com.masim05.bloodpressure.mobile.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.masim05.bloodpressure.mobile.R
import com.masim05.bloodpressure.mobile.core.model.AuthMode
import com.masim05.bloodpressure.mobile.ui.TestTags

@OptIn(ExperimentalComposeUiApi::class)
@Composable
fun AuthScreen(
    mode: AuthMode,
    isSubmitting: Boolean,
    errorText: String?,
    onModeChange: (AuthMode) -> Unit,
    onSubmit: (AuthMode, String, String) -> Unit,
) {
    var email by remember(mode) { mutableStateOf("") }
    var password by remember(mode) { mutableStateOf("") }
    val isLogin = mode == AuthMode.Login

    Column(
        modifier = Modifier
            .fillMaxSize()
            .semantics { testTagsAsResourceId = true }
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(stringResource(R.string.auth_title), style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(24.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            TextButton(
                modifier = Modifier.testTag(TestTags.AuthModeLogin),
                enabled = mode != AuthMode.Login,
                onClick = { onModeChange(AuthMode.Login) },
            ) { Text(stringResource(R.string.auth_mode_login)) }
            TextButton(
                modifier = Modifier.testTag(TestTags.AuthModeNewAccount),
                enabled = mode != AuthMode.NewAccount,
                onClick = { onModeChange(AuthMode.NewAccount) },
            ) { Text(stringResource(R.string.auth_mode_new_account)) }
        }
        Spacer(Modifier.height(16.dp))
        Text(
            stringResource(if (isLogin) R.string.login_title else R.string.signin_title),
            style = MaterialTheme.typography.titleLarge,
        )
        OutlinedTextField(
            modifier = Modifier
                .fillMaxWidth()
                .testTag(if (isLogin) "login_email" else "signin_email"),
            value = email,
            onValueChange = { email = it },
            singleLine = true,
            label = { Text(stringResource(R.string.signin_email_hint)) },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
        )
        OutlinedTextField(
            modifier = Modifier
                .fillMaxWidth()
                .testTag(if (isLogin) "login_password" else "signin_password"),
            value = password,
            onValueChange = { password = it },
            singleLine = true,
            label = { Text(stringResource(R.string.signin_password_hint)) },
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
        )
        if (errorText != null) {
            Text(
                modifier = Modifier
                    .padding(top = 12.dp)
                    .testTag(TestTags.AuthError),
                text = errorText,
                color = MaterialTheme.colorScheme.error,
            )
        }
        Button(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 16.dp)
                .testTag(if (isLogin) "login_submit" else "signin_submit"),
            enabled = !isSubmitting,
            onClick = { onSubmit(mode, email, password) },
        ) {
            Text(
                stringResource(
                    when {
                        isSubmitting -> R.string.status_loading
                        isLogin -> R.string.login_submit
                        else -> R.string.signin_submit
                    },
                ),
            )
        }
    }
}