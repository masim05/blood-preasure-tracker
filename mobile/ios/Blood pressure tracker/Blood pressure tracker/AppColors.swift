// AppColors.swift
// Blood pressure tracker
// Color constants mirroring Android's AppTheme.kt

import SwiftUI

enum AppColors {
    // Brand
    static let primaryGreen = Color(r: 0x1D, g: 0x9E, b: 0x75)   // #1D9E75
    static let blue         = Color(r: 0x18, g: 0x5F, b: 0xA5)   // #185FA5

    // Status
    static let elevatedRed  = Color(r: 0xE2, g: 0x4B, b: 0x4A)   // #E24B4A
    static let normalGreen  = Color(r: 0x63, g: 0x99, b: 0x22)   // #639922

    // Text
    static let darkText     = Color(r: 0x11, g: 0x11, b: 0x11)   // #111111
    static let mutedText    = Color(r: 0xAA, g: 0xAA, b: 0xAA)   // #AAAAAA
    static let secondaryText = Color(r: 0x88, g: 0x88, b: 0x88)  // #888888
    static let labelColor   = Color(r: 0x99, g: 0x99, b: 0x99)   // #999999

    // Backgrounds
    static let pageBackground = Color(r: 0xF2, g: 0xF2, b: 0xF7) // #F2F2F7
    static let primaryTint    = Color(r: 0xF2, g: 0xF2, b: 0xF7) // #F2F2F7

    // Borders
    static let cardBorder  = Color(r: 0xE5, g: 0xE5, b: 0xE5)   // #E5E5E5
    static let inputBorder = Color(r: 0xE0, g: 0xE0, b: 0xE0)   // #E0E0E0

    // Other
    static let divider     = Color(r: 0xF0, g: 0xF0, b: 0xF0)   // #F0F0F0
    static let danger      = Color(r: 0xE2, g: 0x4B, b: 0x4A)   // #E24B4A  (alias elevatedRed)
    static let cameraBg    = Color(r: 0x1A, g: 0x1A, b: 0x1A)   // #1A1A1A
    static let tipBg       = Color(r: 0xE1, g: 0xF5, b: 0xEE)   // #E1F5EE
    static let tipText     = Color(r: 0x0F, g: 0x6E, b: 0x56)   // #0F6E56
}

extension Color {
    init(r: UInt8, g: UInt8, b: UInt8) {
        self.init(
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255
        )
    }
}
