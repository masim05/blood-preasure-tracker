package com.masim05.bloodpressure.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material.icons.outlined.Logout
import androidx.compose.material.icons.outlined.Straighten
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.masim05.bloodpressure.mobile.R
import com.masim05.bloodpressure.mobile.supportedLanguageOptions
import com.masim05.bloodpressure.mobile.ui.TestTags

private val PageBg = Color(0xFFF2F2F7)
private val CardBorder = Color(0xFFE5E5E5)
private val Divider = Color(0xFFF0F0F0)
private val LabelColor = Color(0xFF999999)
private val PrimaryText = Color(0xFF111111)
private val MutedText = Color(0xFFAAAAAA)
private val Danger = Color(0xFFE24B4A)

@Composable
fun ProfileScreen(
    selectedLanguageCode: String,
    onLanguageSelected: (String) -> Unit,
    onOpenGuide: () -> Unit,
    onLogout: () -> Unit,
) {
    var languageMenuExpanded by remember { mutableStateOf(false) }
    var showLogoutConfirmation by remember { mutableStateOf(false) }
    val selectedLanguage = supportedLanguageOptions
        .firstOrNull { it.code == selectedLanguageCode }
        ?: supportedLanguageOptions.first()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PageBg)
            .padding(16.dp)
            .testTag(TestTags.ProfileScreen),
        verticalArrangement = Arrangement.Top,
    ) {
        Text(stringResource(R.string.profile_title), style = MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(12.dp))

        SectionLabel(stringResource(R.string.profile_settings))
        Spacer(Modifier.height(6.dp))
        CardContainer {
            Box {
                ProfileRow(
                    icon = Icons.Outlined.Language,
                    iconChipBg = Color(0xFFE1F5EE),
                    iconTint = Color(0xFF1D9E75),
                    label = stringResource(R.string.profile_language_title),
                    value = stringResource(selectedLanguage.labelRes),
                    showChevron = true,
                    divider = true,
                    modifier = Modifier.testTag(TestTags.ProfileLanguageSelector),
                    onClick = { languageMenuExpanded = true },
                )
                DropdownMenu(
                    expanded = languageMenuExpanded,
                    onDismissRequest = { languageMenuExpanded = false },
                ) {
                    supportedLanguageOptions.forEach { option ->
                        DropdownMenuItem(
                            modifier = Modifier.testTag("${TestTags.ProfileLanguageOptionPrefix}${option.code}"),
                            text = { Text(stringResource(option.labelRes)) },
                            onClick = {
                                languageMenuExpanded = false
                                onLanguageSelected(option.code)
                            },
                        )
                    }
                }
            }
            ProfileRow(
                icon = Icons.Outlined.Straighten,
                iconChipBg = Color(0xFFE6F1FB),
                iconTint = Color(0xFF185FA5),
                label = stringResource(R.string.guide_title),
                showChevron = true,
                divider = false,
                modifier = Modifier.testTag(TestTags.ProfileGuide),
                onClick = onOpenGuide,
            )
        }

        Spacer(Modifier.height(14.dp))
        SectionLabel(stringResource(R.string.profile_account))
        Spacer(Modifier.height(6.dp))
        CardContainer {
            ProfileRow(
                icon = Icons.Outlined.Logout,
                iconChipBg = Color(0xFFFCEBEB),
                iconTint = Danger,
                label = stringResource(R.string.profile_logout),
                labelColor = Danger,
                labelWeight = FontWeight.Medium,
                showChevron = false,
                divider = false,
                modifier = Modifier.testTag(TestTags.ProfileLogout),
                onClick = { showLogoutConfirmation = true },
            )
        }
    }

    if (showLogoutConfirmation) {
        AlertDialog(
            onDismissRequest = { showLogoutConfirmation = false },
            title = { Text(stringResource(R.string.profile_logout_confirm_title)) },
            text = { Text(stringResource(R.string.profile_logout_confirm_message)) },
            confirmButton = {
                TextButton(
                    onClick = {
                        showLogoutConfirmation = false
                        onLogout()
                    },
                ) {
                    Text(stringResource(R.string.profile_logout_confirm), color = Danger)
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutConfirmation = false }) {
                    Text(stringResource(R.string.date_picker_cancel))
                }
            },
        )
    }
}

@Composable
private fun SectionLabel(text: String) {
    Text(
        text = text,
        color = LabelColor,
        fontSize = 10.sp,
        fontWeight = FontWeight.Medium,
        letterSpacing = 0.6.sp,
    )
}

@Composable
private fun CardContainer(content: @Composable ColumnScope.() -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .border(0.5.dp, CardBorder, RoundedCornerShape(12.dp))
            .background(Color.White, RoundedCornerShape(12.dp))
            .padding(horizontal = 14.dp, vertical = 6.dp),
        content = content,
    )
}

@Composable
private fun ProfileRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconChipBg: Color,
    iconTint: Color,
    label: String,
    modifier: Modifier,
    onClick: () -> Unit,
    value: String? = null,
    showChevron: Boolean,
    divider: Boolean,
    labelColor: Color = PrimaryText,
    labelWeight: FontWeight = FontWeight.Normal,
) {
    Column {
        Row(
            modifier = modifier
                .fillMaxWidth()
                .height(48.dp)
                .clickable(onClick = onClick),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(30.dp)
                    .background(iconChipBg, RoundedCornerShape(7.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(15.dp))
            }
            Spacer(Modifier.size(10.dp))
            Text(
                text = label,
                color = labelColor,
                fontSize = 15.sp,
                fontWeight = labelWeight,
            )
            Spacer(Modifier.weight(1f))
            if (value != null) {
                Text(
                    text = value,
                    color = MutedText,
                    fontSize = 13.sp,
                )
                Spacer(Modifier.size(8.dp))
            }
            if (showChevron) {
                Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = MutedText)
            }
        }
        if (divider) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(0.5.dp)
                    .background(Divider),
            )
        }
    }
}
