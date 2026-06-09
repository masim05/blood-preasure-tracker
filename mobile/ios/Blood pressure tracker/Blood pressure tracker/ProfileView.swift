// ProfileView.swift
// Blood pressure tracker
// Profile / settings screen mirroring Android's ProfileScreen.kt

import SwiftUI

// MARK: - Story & policy content helpers (internal for tests)

func storyParagraphs() -> [String] {
    [
        "I started tracking my blood pressure regularly and quickly realized the most annoying part wasn't taking the measurements — it was typing the numbers from photos of my blood pressure monitor into a spreadsheet.",
        "Since modern AI is pretty good at reading text from images, I figured this could be automated. So I built a simple app that turns a photo of a blood pressure monitor into a measurement record in a few taps.",
        "After using it myself, I thought: maybe I'm not the only one with this problem. That's why I decided to publish it on the App Store.",
    ]
}

struct PolicySection: Equatable {
    let heading: String
    let content: String
}

func policySections() -> [PolicySection] {
    [
        PolicySection(
            heading: "Data We Collect",
            content: "We collect the following information when you use the app: your email address and password (hashed) used to create your account; photos of your blood pressure monitor that you submit for recognition; blood pressure values (systolic, diastolic, pulse, arm side) extracted from those photos or entered manually; and the date and time of each measurement."
        ),
        PolicySection(
            heading: "How We Use Your Data",
            content: "Your data is used solely to provide the app's features: authenticating your account, storing your measurement history so you can review it, and processing photos to extract blood pressure readings automatically."
        ),
        PolicySection(
            heading: "Third-Party Services",
            content: "To recognise blood pressure values from photos, images are sent to third-party AI APIs (such as OpenAI). Images are transmitted for recognition purposes only and are not stored or used for training by those third parties. We do not sell or share your personal data with any other third parties."
        ),
        PolicySection(
            heading: "Data Storage",
            content: "Your data is stored on secure cloud servers. We apply industry-standard measures to protect it from unauthorised access."
        ),
        PolicySection(
            heading: "Deleting Your Account and Data",
            content: "You can request deletion of your account and all associated data at any time by emailing blood.pressure.by.max@gmail.com. We will process your request within 30 days."
        ),
        PolicySection(
            heading: "Medical Disclaimer",
            content: "This app is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. Always consult a qualified healthcare professional regarding your blood pressure and any health concerns."
        ),
        PolicySection(
            heading: "Contact",
            content: "For privacy-related questions, contact us at blood.pressure.by.max@gmail.com."
        ),
    ]
}

// MARK: - About page type

private enum AboutPage {
    case story, policy
}

// MARK: - ProfileView

struct ProfileView: View {
    @EnvironmentObject private var appState: AppState

    @State private var showLanguageMenu = false
    @State private var showLogoutConfirmation = false
    @State private var selectedAboutPage: AboutPage? = nil

    private var selectedLanguage: LanguageOption {
        supportedLanguageOptions.first { $0.code == appState.selectedLanguageCode }
            ?? supportedLanguageOptions[0]
    }

    var body: some View {
        ZStack(alignment: .top) {
            AppColors.pageBackground.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("Profile")
                        .font(.title2.bold())
                        .padding(.bottom, 12)

                    if selectedAboutPage == nil {
                        mainContent
                    } else {
                        aboutPageContent(page: selectedAboutPage!)
                    }
                }
                .padding(16)
            }
        }
        .accessibilityIdentifier(AccessibilityIdentifiers.profileScreen)
        .confirmationDialog(
            "Log out?",
            isPresented: $showLogoutConfirmation,
            titleVisibility: .visible
        ) {
            Button("Log out", role: .destructive) { appState.logout() }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("You will need to sign in again to continue.")
        }
    }

    // MARK: - Main settings content

    private var mainContent: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Preferences section
            SectionLabel("PREFERENCES")
            Spacer().frame(height: 6)
            ProfileCard {
                ProfileRow(
                    icon: "globe",
                    iconBg: Color(r: 0xE1, g: 0xF5, b: 0xEE),
                    iconTint: AppColors.primaryGreen,
                    label: "Language",
                    accessibilityId: AccessibilityIdentifiers.profileLanguageSelector,
                    value: selectedLanguage.label,
                    showChevron: true,
                    divider: false
                ) { showLanguageMenu = true }
            }
            .overlay(alignment: .topLeading) {
                if showLanguageMenu {
                    languageMenuOverlay
                }
            }

            Spacer().frame(height: 14)

            // About section
            SectionLabel("ABOUT")
            Spacer().frame(height: 6)
            ProfileCard {
                ProfileRow(
                    icon: "info.circle",
                    iconBg: Color(r: 0xE6, g: 0xF1, b: 0xFB),
                    iconTint: AppColors.blue,
                    label: "Story",
                    accessibilityId: AccessibilityIdentifiers.profileStory,
                    showChevron: true,
                    divider: true
                ) { selectedAboutPage = .story }

                ProfileRow(
                    icon: "clock.arrow.circlepath",
                    iconBg: Color(r: 0xEF, g: 0xF0, b: 0xFE),
                    iconTint: Color(r: 0x5A, g: 0x56, b: 0xD6),
                    label: "Policy",
                    accessibilityId: AccessibilityIdentifiers.profilePolicy,
                    showChevron: true,
                    divider: true
                ) { selectedAboutPage = .policy }

                ProfileRow(
                    icon: "ruler",
                    iconBg: Color(r: 0xE6, g: 0xF1, b: 0xFB),
                    iconTint: AppColors.blue,
                    label: "Measurement guide",
                    accessibilityId: AccessibilityIdentifiers.profileGuide,
                    showChevron: true,
                    divider: false
                ) { appState.openGuideFromProfile() }
            }

            Spacer().frame(height: 14)

            // Account section
            SectionLabel("ACCOUNT")
            Spacer().frame(height: 6)
            ProfileCard {
                ProfileRow(
                    icon: "arrow.right.square",
                    iconBg: Color(r: 0xFC, g: 0xEB, b: 0xEB),
                    iconTint: AppColors.danger,
                    label: "Log out",
                    accessibilityId: AccessibilityIdentifiers.profileLogout,
                    showChevron: false,
                    divider: false,
                    labelColor: AppColors.danger,
                    labelWeight: .medium,
                ) { showLogoutConfirmation = true }
            }
        }
    }

    // MARK: - Language menu overlay

    private var languageMenuOverlay: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(supportedLanguageOptions, id: \.code) { option in
                Button(action: {
                    appState.selectedLanguageCode = option.code
                    showLanguageMenu = false
                }) {
                    Text(option.label)
                        .font(.system(size: 15))
                        .foregroundColor(AppColors.darkText)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(
                            appState.selectedLanguageCode == option.code
                                ? AppColors.pageBackground
                                : Color.white
                        )
                }
                .accessibilityIdentifier(AccessibilityIdentifiers.profileLanguageOptionPrefix + option.code)
            }
        }
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: Color.black.opacity(0.12), radius: 8, y: 2)
        .frame(width: 200)
        .offset(x: 0, y: 48)
        .zIndex(100)
    }

    // MARK: - About page content

    @ViewBuilder
    private func aboutPageContent(page: AboutPage) -> some View {
        Button(action: { selectedAboutPage = nil }) {
            HStack {
                Image(systemName: "chevron.left")
                Text("Back")
            }
            .font(.system(size: 15))
            .foregroundColor(AppColors.primaryGreen)
        }
        .accessibilityIdentifier(AccessibilityIdentifiers.profileAboutBack)
        .padding(.bottom, 8)

        switch page {
        case .story: StoryPageView()
        case .policy: PolicyPageView()
        }
    }
}

// MARK: - Story page

private struct StoryPageView: View {
    var body: some View {
        ProfileCard {
            Text("Track your readings easily")
                .font(.title3.bold())
                .padding(.bottom, 12)

            let paragraphs = storyParagraphs()
            ForEach(Array(paragraphs.enumerated()), id: \.offset) { idx, text in
                Text(text)
                    .font(.body)
                    .foregroundColor(AppColors.darkText)
                if idx < paragraphs.count - 1 {
                    Spacer().frame(height: 10)
                }
            }
        }
    }
}

// MARK: - Policy page

private struct PolicyPageView: View {
    var body: some View {
        ProfileCard {
            Text("Privacy Policy")
                .font(.title3.bold())
                .padding(.bottom, 12)

            Text("Your privacy matters. This policy explains what data Blood Pressure collects, why, and how it is handled.")
                .font(.body)
                .foregroundColor(AppColors.mutedText)
                .padding(.bottom, 8)

            Text("Last updated: June 6, 2026")
                .font(.body)
                .foregroundColor(AppColors.mutedText)
                .padding(.bottom, 12)

            let sections = policySections()
            ForEach(Array(sections.enumerated()), id: \.offset) { idx, section in
                Text(section.heading)
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(AppColors.labelColor)
                    .kerning(0.6)
                    .padding(.top, idx > 0 ? 12 : 0)
                Spacer().frame(height: 4)
                Text(section.content)
                    .font(.body)
                    .foregroundColor(AppColors.darkText)
            }
        }
    }
}

// MARK: - Profile card

private struct ProfileCard<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        VStack(spacing: 0) { content }
            .padding(.horizontal, 14)
            .padding(.vertical, 6)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12).stroke(AppColors.cardBorder, lineWidth: 0.5)
            )
    }
}

// MARK: - Profile row

private struct ProfileRow: View {
    let icon: String
    let iconBg: Color
    let iconTint: Color
    let label: String
    let accessibilityId: String
    var value: String? = nil
    var showChevron: Bool
    var divider: Bool
    var labelColor: Color = AppColors.darkText
    var labelWeight: Font.Weight = .regular
    let onClick: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            Button(action: onClick) {
                HStack(spacing: 0) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 7)
                            .fill(iconBg)
                            .frame(width: 30, height: 30)
                        Image(systemName: icon)
                            .font(.system(size: 13))
                            .foregroundColor(iconTint)
                    }
                    Spacer().frame(width: 10)
                    Text(label)
                        .font(.system(size: 15, weight: labelWeight))
                        .foregroundColor(labelColor)
                    Spacer()
                    if let v = value {
                        Text(v)
                            .font(.system(size: 13))
                            .foregroundColor(AppColors.mutedText)
                        Spacer().frame(width: 8)
                    }
                    if showChevron {
                        Image(systemName: "chevron.right")
                            .font(.system(size: 12))
                            .foregroundColor(AppColors.mutedText)
                    }
                }
                .frame(height: 48)
            }
            .accessibilityIdentifier(accessibilityId)

            if divider {
                Rectangle()
                    .fill(Color(r: 0xF0, g: 0xF0, b: 0xF0))
                    .frame(height: 0.5)
            }
        }
    }
}

// MARK: - Section label

private struct SectionLabel: View {
    let text: String
    init(_ text: String) { self.text = text }

    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: .medium))
            .foregroundColor(AppColors.labelColor)
            .kerning(0.6)
    }
}
