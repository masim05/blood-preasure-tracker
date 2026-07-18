package com.masim05.bloodpressure.mobile.ui.screens

import android.content.Intent
import android.net.Uri
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.Info
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
import androidx.compose.runtime.DisposableEffect
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
import androidx.compose.ui.viewinterop.AndroidView
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

private enum class AboutPage {
    Story,
    Policy,
}

internal data class PolicySectionCopy(
    val headingRes: Int,
    val contentRes: Int,
)

internal fun storyParagraphResIds(): List<Int> = listOf(
    R.string.profile_story_paragraph_1,
    R.string.profile_story_paragraph_2,
    R.string.profile_story_paragraph_3,
)

internal fun policySectionsCopy(): List<PolicySectionCopy> = listOf(
    PolicySectionCopy(R.string.profile_policy_heading_data_collect, R.string.profile_policy_content_data_collect),
    PolicySectionCopy(R.string.profile_policy_heading_data_use, R.string.profile_policy_content_data_use),
    PolicySectionCopy(R.string.profile_policy_heading_third_party, R.string.profile_policy_content_third_party),
    PolicySectionCopy(R.string.profile_policy_heading_storage, R.string.profile_policy_content_storage),
    PolicySectionCopy(R.string.profile_policy_heading_delete, R.string.profile_policy_content_delete),
    PolicySectionCopy(R.string.profile_policy_heading_medical, R.string.profile_policy_content_medical),
    PolicySectionCopy(R.string.profile_policy_heading_contact, R.string.profile_policy_content_contact),
)

@Composable
fun ProfileScreen(
    selectedLanguageCode: String,
    onLanguageSelected: (String) -> Unit,
    onOpenGuide: () -> Unit,
    onLogout: () -> Unit,
    policyUrl: String? = null,
) {
    var languageMenuExpanded by remember { mutableStateOf(false) }
    var showLogoutConfirmation by remember { mutableStateOf(false) }
    var selectedAboutPage by remember { mutableStateOf<AboutPage?>(null) }
    val selectedLanguage = supportedLanguageOptions
        .firstOrNull { it.code == selectedLanguageCode }
        ?: supportedLanguageOptions.first()
    val aboutPage = selectedAboutPage

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PageBg)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
            .testTag(TestTags.ProfileScreen),
    ) {
        Text(stringResource(R.string.profile_title), style = MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(12.dp))

        if (aboutPage == null) {
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
                        divider = false,
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
            }

            Spacer(Modifier.height(14.dp))
            SectionLabel(stringResource(R.string.profile_about))
            Spacer(Modifier.height(6.dp))
            CardContainer {
                ProfileRow(
                    icon = Icons.Outlined.Info,
                    iconChipBg = Color(0xFFE6F1FB),
                    iconTint = Color(0xFF185FA5),
                    label = stringResource(R.string.profile_story),
                    showChevron = true,
                    divider = true,
                    modifier = Modifier.testTag(TestTags.ProfileStory),
                    onClick = { selectedAboutPage = AboutPage.Story },
                )
                ProfileRow(
                    icon = Icons.Outlined.History,
                    iconChipBg = Color(0xFFEFF0FE),
                    iconTint = Color(0xFF5A56D6),
                    label = stringResource(R.string.profile_policy),
                    showChevron = true,
                    divider = true,
                    modifier = Modifier.testTag(TestTags.ProfilePolicy),
                    onClick = { selectedAboutPage = AboutPage.Policy },
                )
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
        } else {
            AboutPageScreen(
                page = aboutPage,
                policyUrl = policyUrl,
                onBack = { selectedAboutPage = null },
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
private fun AboutPageScreen(page: AboutPage, policyUrl: String?, onBack: () -> Unit) {
    TextButton(
        modifier = Modifier.testTag(TestTags.ProfileAboutBack),
        onClick = onBack,
    ) {
        Text(stringResource(R.string.detail_back))
    }
    Spacer(Modifier.height(8.dp))
    Column {
        when (page) {
            AboutPage.Story -> StoryPageContent()
            AboutPage.Policy -> {
                if (policyUrl.isNullOrBlank()) {
                    PolicyPageContent()
                } else {
                    PolicyWebViewContent(policyUrl)
                }
            }
        }
    }
}

@Composable
private fun PolicyWebViewContent(policyUrl: String) {
    val allowedPolicyUri = remember(policyUrl) { Uri.parse(policyUrl) }
    var webViewRef by remember { mutableStateOf<WebView?>(null) }
    DisposableEffect(Unit) {
        onDispose {
            webViewRef?.destroy()
            webViewRef = null
        }
    }

    CardContainer {
        AndroidView(
            modifier = Modifier
                .fillMaxWidth()
                .height(460.dp)
                .testTag(TestTags.ProfilePolicyWebView),
            factory = { context ->
                WebView(context).apply {
                    webViewRef = this
                    webViewClient = object : WebViewClient() {
                        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                            val targetUri = request.url
                            if (targetUri.scheme == "mailto") {
                                val intent = Intent(Intent.ACTION_SENDTO, targetUri)
                                val canHandleIntent = intent.resolveActivity(view.context.packageManager) != null
                                if (canHandleIntent) {
                                    runCatching { view.context.startActivity(intent) }
                                }
                                return true
                            }
                            return !isAllowedPolicyNavigation(targetUri, allowedPolicyUri)
                        }
                    }
                    settings.javaScriptEnabled = false
                    settings.domStorageEnabled = false
                    settings.allowFileAccess = false
                    settings.allowContentAccess = false
                    loadUrl(policyUrl)
                }
            },
            update = { webView ->
                if (webView.url != policyUrl) {
                    webView.loadUrl(policyUrl)
                }
            },
        )
    }
}

private fun isAllowedPolicyNavigation(targetUri: Uri, allowedPolicyUri: Uri): Boolean {
    val targetScheme = targetUri.scheme ?: return false
    if (targetScheme != "http" && targetScheme != "https") return false

    val allowedScheme = allowedPolicyUri.scheme ?: return false
    val allowedHost = allowedPolicyUri.host ?: return false
    val targetHost = targetUri.host ?: return false
    if (targetScheme != allowedScheme || targetHost != allowedHost) return false

    val allowedPort = normalizedPort(allowedPolicyUri)
    val targetPort = normalizedPort(targetUri)
    if (allowedPort != targetPort) return false

    val allowedPath = allowedPolicyUri.path ?: return false
    val targetPath = targetUri.path ?: return false
    return targetPath == allowedPath
}

private fun normalizedPort(uri: Uri): Int {
    if (uri.port != -1) return uri.port
    return when (uri.scheme) {
        "http" -> 80
        "https" -> 443
        else -> -1
    }
}

@Composable
private fun StoryPageContent() {
    val paragraphs = storyParagraphResIds()
    CardContainer {
        Text(
            text = stringResource(R.string.profile_story_page_title),
            style = MaterialTheme.typography.headlineSmall,
        )
        Spacer(Modifier.height(12.dp))
        paragraphs.forEachIndexed { index, paragraphRes ->
            Text(text = stringResource(paragraphRes), color = PrimaryText)
            if (index < paragraphs.lastIndex) {
                Spacer(Modifier.height(10.dp))
            }
        }
    }
}

@Composable
private fun PolicyPageContent() {
    val sections = policySectionsCopy()
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
