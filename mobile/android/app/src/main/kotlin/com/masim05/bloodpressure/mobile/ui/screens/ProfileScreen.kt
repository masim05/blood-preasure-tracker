package com.masim05.bloodpressure.mobile.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.masim05.bloodpressure.mobile.R
import com.masim05.bloodpressure.mobile.ui.TestTags

@Composable
fun ProfileScreen(
    selectedLanguageCode: String,
    onLanguageSelected: (String) -> Unit,
    onLogout: () -> Unit,
) {
    var languageMenuExpanded by remember { mutableStateOf(false) }
    val languageOptions = remember { profileLanguageOptions() }
    val selectedLanguage = languageOptions.firstOrNull { it.code == selectedLanguageCode } ?: languageOptions.first()

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
        Text(stringResource(R.string.profile_language_title), style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(8.dp))
        OutlinedButton(
            modifier = Modifier.testTag(TestTags.ProfileLanguageSelector),
            onClick = { languageMenuExpanded = true },
        ) {
            Text(stringResource(selectedLanguage.labelRes))
        }
        DropdownMenu(
            expanded = languageMenuExpanded,
            onDismissRequest = { languageMenuExpanded = false },
        ) {
            languageOptions.forEach { option ->
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
        Spacer(Modifier.height(16.dp))
        Button(
            modifier = Modifier.testTag(TestTags.ProfileLogout),
            onClick = onLogout,
        ) {
            Text(stringResource(R.string.profile_logout))
        }
    }
}

private data class LanguageOption(
    val code: String,
    val labelRes: Int,
)

private fun profileLanguageOptions(): List<LanguageOption> {
    return listOf(
        LanguageOption("system", R.string.language_system_default),
        LanguageOption("es", R.string.language_name_spanish),
        LanguageOption("fr", R.string.language_name_french),
        LanguageOption("pt", R.string.language_name_portuguese),
        LanguageOption("it", R.string.language_name_italian),
        LanguageOption("sv", R.string.language_name_swedish),
        LanguageOption("ru", R.string.language_name_russian),
        LanguageOption("zh", R.string.language_name_chinese),
        LanguageOption("ko", R.string.language_name_korean),
        LanguageOption("ja", R.string.language_name_japanese),
        LanguageOption("th", R.string.language_name_thai),
        LanguageOption("vi", R.string.language_name_vietnamese),
    )
}
