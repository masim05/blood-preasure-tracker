// LanguageSupport.swift
// Blood pressure tracker
// Supported language list mirroring Android's LanguageSupport.kt

import Foundation

struct LanguageOption: Equatable {
    let code: String
    let label: String
}

let systemLanguageCode = "system"

let supportedLanguageOptions: [LanguageOption] = [
    LanguageOption(code: systemLanguageCode, label: "System default"),
    LanguageOption(code: "es", label: "Spanish"),
    LanguageOption(code: "fr", label: "French"),
    LanguageOption(code: "pt", label: "Portuguese"),
    LanguageOption(code: "it", label: "Italian"),
    LanguageOption(code: "sv", label: "Swedish"),
    LanguageOption(code: "ru", label: "Russian"),
    LanguageOption(code: "zh", label: "Chinese"),
    LanguageOption(code: "ko", label: "Korean"),
    LanguageOption(code: "ja", label: "Japanese"),
    LanguageOption(code: "th", label: "Thai"),
    LanguageOption(code: "vi", label: "Vietnamese"),
]

let supportedLanguageCodes: Set<String> = Set(supportedLanguageOptions.map { $0.code })
