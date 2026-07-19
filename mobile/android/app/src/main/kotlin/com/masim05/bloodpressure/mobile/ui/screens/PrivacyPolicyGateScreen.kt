package com.masim05.bloodpressure.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material3.Button
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
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
import com.masim05.bloodpressure.mobile.SYSTEM_LANGUAGE_CODE
import com.masim05.bloodpressure.mobile.ui.TestTags

private val PageBg = Color(0xFFF2F2F7)
private val CardBorder = Color(0xFFE5E5E5)
private val LabelColor = Color(0xFF999999)
private val PrimaryText = Color(0xFF111111)
private val MutedText = Color(0xFFAAAAAA)
private val LanguageIconTint = Color(0xFF1D9E75)

@Composable
fun PrivacyPolicyGateScreen(
    selectedLanguageCode: String,
    onLanguageSelected: (String) -> Unit,
    onAccept: () -> Unit,
) {
    val selectedLanguage = supportedLanguageOptions.firstOrNull { it.code == selectedLanguageCode }
        ?: supportedLanguageOptions.first()
    val sections = policySectionsCopy()
    var languageMenuExpanded by remember { mutableStateOf(false) }
    val selectedLanguageLabel = languageAutonym(selectedLanguage.code, stringResource(selectedLanguage.labelRes))

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PageBg)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
            .testTag(TestTags.PolicyGateScreen),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        CardContainer {
            Text(
                text = stringResource(R.string.profile_language_title),
                style = MaterialTheme.typography.headlineSmall,
            )
            Spacer(Modifier.height(10.dp))
            Box(modifier = Modifier.fillMaxWidth()) {
                LanguageSelectorRow(
                    modifier = Modifier.testTag(TestTags.PolicyGateLanguageSelector),
                    selectedLabel = selectedLanguageLabel,
                    onClick = { languageMenuExpanded = true },
                )
                DropdownMenu(
                    expanded = languageMenuExpanded,
                    onDismissRequest = { languageMenuExpanded = false },
                ) {
                    supportedLanguageOptions.forEach { option ->
                        DropdownMenuItem(
                            modifier = Modifier.testTag("${TestTags.PolicyGateLanguageOptionPrefix}${option.code}"),
                            text = {
                                Text(
                                    languageAutonym(option.code, stringResource(option.labelRes)),
                                )
                            },
                            onClick = {
                                languageMenuExpanded = false
                                onLanguageSelected(option.code)
                            },
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(14.dp))

        CardContainer {
            Text(
                text = stringResource(R.string.profile_policy_page_title),
                style = MaterialTheme.typography.headlineSmall,
            )
            Spacer(Modifier.height(12.dp))
            Text(
                text = stringResource(R.string.profile_policy_intro),
                color = MutedText,
            )
            Spacer(Modifier.height(12.dp))
            Text(
                text = stringResource(R.string.profile_policy_last_updated),
                color = MutedText,
            )
            Spacer(Modifier.height(12.dp))
            sections.forEachIndexed { index, section ->
                SectionLabel(stringResource(section.headingRes))
                Spacer(Modifier.height(4.dp))
                Text(text = stringResource(section.contentRes), color = PrimaryText)
                if (index < sections.lastIndex) {
                    Spacer(Modifier.height(12.dp))
                }
            }
        }

        Spacer(Modifier.height(16.dp))
        Button(
            modifier = Modifier
                .fillMaxWidth()
                .testTag(TestTags.PolicyGateAccept),
            onClick = onAccept,
        ) {
            Text(stringResource(R.string.privacy_policy_accept))
        }
    }
}

@Composable
private fun LanguageSelectorRow(
    modifier: Modifier = Modifier,
    selectedLabel: String,
    onClick: () -> Unit,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .background(Color.White)
            .padding(horizontal = 14.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = Icons.Outlined.Language,
                contentDescription = null,
                tint = LanguageIconTint,
            )
            Spacer(Modifier.width(6.dp))
            Text(
                text = selectedLabel,
                color = PrimaryText,
                fontWeight = FontWeight.Medium,
            )
        }
        Icon(
            imageVector = Icons.Outlined.ChevronRight,
            contentDescription = null,
            tint = LabelColor,
        )
    }
}

@Composable
private fun CardContainer(content: @Composable ColumnScope.() -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White)
            .border(1.dp, CardBorder)
            .padding(14.dp),
        content = content,
    )
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

private fun languageAutonym(languageCode: String, fallback: String): String {
    if (languageCode == SYSTEM_LANGUAGE_CODE) return fallback
    return when (languageCode) {
        "es" -> "Español"
        "fr" -> "Français"
        "pt" -> "Português"
        "it" -> "Italiano"
        "sv" -> "Svenska"
        "ru" -> "Русский"
        "zh" -> "中文"
        "ko" -> "한국어"
        "ja" -> "日本語"
        "th" -> "ไทย"
        "vi" -> "Tiếng Việt"
        else -> fallback
    }
}
