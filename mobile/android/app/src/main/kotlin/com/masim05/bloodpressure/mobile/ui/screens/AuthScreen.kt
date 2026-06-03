package com.masim05.bloodpressure.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.DesktopWindows
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.MailOutline
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.masim05.bloodpressure.mobile.R
import com.masim05.bloodpressure.mobile.core.model.AuthMode
import com.masim05.bloodpressure.mobile.ui.TestTags
import kotlinx.coroutines.delay

private val PrimaryGreen = Color(0xFF1D9E75)
private val PrimaryTint = Color(0xFFF2F2F7)
private val BorderColor = Color(0xFFE0E0E0)
private val MutedText = Color(0xFFAAAAAA)
private val DarkText = Color(0xFF111111)

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
    var revealPassword by remember(mode) { mutableStateOf(false) }
    val isLogin = mode == AuthMode.Login

    LaunchedEffect(password) {
        revealPassword = password.isNotEmpty()
        if (password.isNotEmpty()) {
            delay(900)
            revealPassword = false
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .semantics { testTagsAsResourceId = true }
            .padding(horizontal = 24.dp, vertical = 20.dp),
        verticalArrangement = Arrangement.Top,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(18.dp))
        Box(
            modifier = Modifier
                .size(52.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(PrimaryGreen),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = Icons.Outlined.DesktopWindows,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(26.dp),
            )
        }
        Spacer(Modifier.height(10.dp))
        Text(
            text = stringResource(R.string.auth_title),
            style = MaterialTheme.typography.titleMedium.copy(fontSize = 17.sp, fontWeight = FontWeight.Medium),
            color = DarkText,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            text = stringResource(R.string.auth_tagline),
            style = MaterialTheme.typography.bodySmall.copy(fontSize = 12.sp),
            color = MutedText,
        )
        Spacer(Modifier.height(20.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .background(PrimaryTint)
                .padding(3.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            SegmentedItem(
                modifier = Modifier
                    .weight(1f)
                    .testTag(TestTags.AuthModeLogin),
                selected = isLogin,
                text = stringResource(R.string.auth_mode_login),
                onClick = { onModeChange(AuthMode.Login) },
            )
            SegmentedItem(
                modifier = Modifier
                    .weight(1f)
                    .testTag(TestTags.AuthModeNewAccount),
                selected = !isLogin,
                text = stringResource(R.string.auth_mode_new_account),
                onClick = { onModeChange(AuthMode.NewAccount) },
            )
        }

        Spacer(Modifier.height(16.dp))

        OutlinedTextField(
            modifier = Modifier
                .fillMaxWidth()
                .testTag(if (isLogin) "login_email" else "signin_email"),
            value = email,
            onValueChange = { email = it },
            singleLine = true,
            placeholder = { Text(stringResource(R.string.signin_email_hint), color = MutedText) },
            leadingIcon = {
                Icon(Icons.Outlined.MailOutline, contentDescription = null, tint = Color(0xFFBBBBBB), modifier = Modifier.size(16.dp))
            },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            shape = RoundedCornerShape(10.dp),
            colors = authInputColors(),
            textStyle = TextStyle(color = DarkText),
        )

        Spacer(Modifier.height(10.dp))

        OutlinedTextField(
            modifier = Modifier
                .fillMaxWidth()
                .testTag(if (isLogin) "login_password" else "signin_password"),
            value = password,
            onValueChange = { password = it },
            singleLine = true,
            placeholder = { Text(stringResource(R.string.signin_password_hint), color = MutedText) },
            leadingIcon = {
                Icon(Icons.Outlined.Lock, contentDescription = null, tint = Color(0xFFBBBBBB), modifier = Modifier.size(16.dp))
            },
            visualTransformation = if (revealPassword) VisualTransformation.None else PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            shape = RoundedCornerShape(10.dp),
            colors = authInputColors(),
            textStyle = TextStyle(color = DarkText),
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
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen, contentColor = Color.White),
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
                style = MaterialTheme.typography.bodyMedium.copy(fontSize = 14.sp, fontWeight = FontWeight.Medium),
            )
        }
    }
}

@Composable
private fun SegmentedItem(
    modifier: Modifier,
    selected: Boolean,
    text: String,
    onClick: () -> Unit,
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .then(
                if (selected) {
                    Modifier
                        .shadow(1.dp, RoundedCornerShape(8.dp))
                        .background(Color.White)
                } else {
                    Modifier.background(Color.Transparent)
                },
            )
            .clickable(onClick = onClick)
            .padding(vertical = 10.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.bodyMedium.copy(
                fontWeight = if (selected) FontWeight.Medium else FontWeight.Normal,
                color = if (selected) DarkText else MutedText,
            ),
        )
    }
}

@Composable
private fun authInputColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = BorderColor,
    unfocusedBorderColor = BorderColor,
    cursorColor = PrimaryGreen,
    focusedContainerColor = Color.White,
    unfocusedContainerColor = Color.White,
)
