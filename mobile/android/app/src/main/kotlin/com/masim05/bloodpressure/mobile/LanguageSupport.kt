package com.masim05.bloodpressure.mobile

import androidx.annotation.StringRes

internal data class LanguageOption(
    val code: String,
    @StringRes val labelRes: Int,
)

internal const val SYSTEM_LANGUAGE_CODE = "system"

internal val supportedLanguageOptions = listOf(
    LanguageOption(SYSTEM_LANGUAGE_CODE, R.string.language_system_default),
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

internal val supportedLanguageCodes: Set<String> = supportedLanguageOptions
    .mapTo(linkedSetOf()) { it.code }
