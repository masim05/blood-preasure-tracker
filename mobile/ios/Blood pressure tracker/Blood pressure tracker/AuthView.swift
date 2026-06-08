// AuthView.swift
// Blood pressure tracker
// Login / sign-up screen mirroring Android's AuthScreen.kt

import SwiftUI

// MARK: - Accessibilty identifiers (mirrors Android TestTags)

enum AccessibilityIdentifiers {
    static let authModeLogin      = "auth_mode_login"
    static let authModeNewAccount = "auth_mode_new_account"
    static let authError          = "auth_error"
    static let guideScreen        = "guide_screen"
    static let guideContinue      = "guide_continue"
    static let cameraScreen       = "camera_screen"
    static let cameraPreview      = "camera_preview"
    static let cameraLoading      = "camera_loading"
    static let cameraError        = "camera_error"
    static let cameraOpenSettings = "camera_open_settings"
    static let cameraCapture      = "camera_upload"
    static let historyScreen      = "history_screen"
    static let historyRefresh     = "history_refresh"
    static let historyError       = "history_error"
    static let historyTable       = "history_table"
    static let historyRow         = "history_row"
    static let historyLastUploadedRow = "history_last_uploaded_row"
    static let historyFromDate    = "history_from"
    static let historyToDate      = "history_to"
    static let historyExportCsv   = "history_export_csv"
    static let historyApplyFilter = "history_apply_filter"
    static let historyClearFilter = "history_clear_filter"
    static let measurementDetailScreen = "measurement_detail_screen"
    static let measurementDetailError  = "measurement_detail_error"
    static let measurementDetailImage  = "measurement_detail_image"
    static let measurementDetailImageLoaded = "measurement_detail_image_loaded"
    static let measurementDetailSystolic = "measurement_detail_systolic"
    static let measurementDetailDiastolic = "measurement_detail_diastolic"
    static let measurementDetailPulse   = "measurement_detail_pulse"
    static let measurementDetailArmSide = "measurement_detail_arm_side"
    static let measurementDetailStatusSaved = "measurement_detail_status_saved"
    static let measurementDetailSave   = "measurement_detail_save"
    static let measurementDetailBack   = "measurement_detail_back"
    static let bottomNav              = "bottom_nav"
    static let bottomNavCapture       = "bottom_nav_capture"
    static let bottomNavHistory       = "bottom_nav_history"
    static let bottomNavProfile       = "bottom_nav_profile"
    static let profileScreen          = "profile_screen"
    static let profileLogout          = "profile_logout"
    static let profileLanguageSelector = "profile_language_selector"
    static let profileGuide           = "profile_guide"
    static let profileStory           = "profile_story"
    static let profilePolicy          = "profile_policy"
    static let profileAboutBack       = "profile_about_back"
    static let profileLanguageOptionPrefix = "profile_language_option_"
    static func loginEmail()    -> String { "login_email" }
    static func loginPassword() -> String { "login_password" }
    static func loginSubmit()   -> String { "login_submit" }
    static func signinEmail()   -> String { "signin_email" }
    static func signinPassword()-> String { "signin_password" }
    static func signinSubmit()  -> String { "signin_submit" }
}

// MARK: - AuthView

struct AuthView: View {
    @EnvironmentObject private var appState: AppState

    @State private var mode: AuthMode = .login
    @State private var email: String = ""
    @State private var password: String = ""
    @State private var revealPassword: Bool = false

    private var isLogin: Bool { mode == .login }

    var body: some View {
        ScrollView {
            VStack(alignment: .center, spacing: 0) {
                Spacer().frame(height: 18)

                // Brand icon
                ZStack {
                    RoundedRectangle(cornerRadius: 14)
                        .fill(Color.white)
                        .frame(width: 52, height: 52)
                    Image(systemName: "heart.fill")
                        .font(.system(size: 26))
                        .foregroundColor(AppColors.primaryGreen)
                }

                Spacer().frame(height: 10)

                Text("Blood Pressure")
                    .font(.system(size: 17, weight: .medium))
                    .foregroundColor(AppColors.darkText)

                Spacer().frame(height: 4)

                Text("Track your readings easily")
                    .font(.system(size: 12))
                    .foregroundColor(AppColors.mutedText)

                Spacer().frame(height: 20)

                // Segmented mode selector
                HStack(spacing: 4) {
                    SegmentedItem(
                        text: "Log in",
                        selected: isLogin,
                        accessibilityId: AccessibilityIdentifiers.authModeLogin
                    ) { mode = .login; resetFields() }

                    SegmentedItem(
                        text: "New account",
                        selected: !isLogin,
                        accessibilityId: AccessibilityIdentifiers.authModeNewAccount
                    ) { mode = .newAccount; resetFields() }
                }
                .padding(3)
                .background(AppColors.primaryTint)
                .cornerRadius(10)

                Spacer().frame(height: 16)

                // Email field
                HStack(spacing: 8) {
                    Image(systemName: "envelope")
                        .font(.system(size: 14))
                        .foregroundColor(Color(white: 0.73))
                    TextField("Email", text: $email)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                        .foregroundColor(AppColors.darkText)
                }
                .padding(12)
                .background(Color.white)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(AppColors.inputBorder, lineWidth: 1)
                )
                .accessibilityIdentifier(isLogin
                    ? AccessibilityIdentifiers.loginEmail()
                    : AccessibilityIdentifiers.signinEmail())

                Spacer().frame(height: 10)

                // Password field
                HStack(spacing: 8) {
                    Image(systemName: "lock")
                        .font(.system(size: 14))
                        .foregroundColor(Color(white: 0.73))
                    if revealPassword {
                        TextField("Password", text: $password)
                            .foregroundColor(AppColors.darkText)
                    } else {
                        SecureField("Password", text: $password)
                            .foregroundColor(AppColors.darkText)
                    }
                }
                .padding(12)
                .background(Color.white)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(AppColors.inputBorder, lineWidth: 1)
                )
                .accessibilityIdentifier(isLogin
                    ? AccessibilityIdentifiers.loginPassword()
                    : AccessibilityIdentifiers.signinPassword())
                .onChange(of: password) { _, newValue in
                    revealPassword = !newValue.isEmpty
                }

                // Error
                if let msg = errorMessage() {
                    Text(msg)
                        .foregroundColor(.red)
                        .font(.system(size: 14))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.top, 12)
                        .accessibilityIdentifier(AccessibilityIdentifiers.authError)
                }

                // Submit button
                Button(action: submit) {
                    Text(submitLabel())
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                }
                .background(AppColors.primaryGreen)
                .cornerRadius(12)
                .disabled(appState.isLoading)
                .padding(.top, 16)
                .accessibilityIdentifier(isLogin
                    ? AccessibilityIdentifiers.loginSubmit()
                    : AccessibilityIdentifiers.signinSubmit())
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 20)
        }
        .background(Color(.systemBackground))
        .onAppear { mode = appState.authMode }
    }

    private func resetFields() {
        email = ""
        password = ""
        revealPassword = false
        appState.apiError = nil
        appState.validationError = nil
    }

    private func submit() {
        if isLogin {
            appState.logIn(email: email, password: password)
        } else {
            appState.signIn(email: email, password: password)
        }
    }

    private func submitLabel() -> String {
        if appState.isLoading { return "Loading" }
        return isLogin ? "Log in" : "Create account"
    }

    private func errorMessage() -> String? {
        if let ve = appState.validationError {
            switch ve {
            case .invalidEmail:    return "Enter a valid email address."
            case .invalidPassword: return "Password must contain at least 8 characters."
            default: return nil
            }
        }
        return appState.apiError?.message
    }
}

// MARK: - Segmented item

private struct SegmentedItem: View {
    let text: String
    let selected: Bool
    let accessibilityId: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(text)
                .font(.system(size: 14, weight: selected ? .medium : .regular))
                .foregroundColor(selected ? AppColors.darkText : AppColors.mutedText)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(selected ? Color.white : Color.clear)
                .cornerRadius(8)
                .shadow(color: selected ? Color.black.opacity(0.08) : .clear, radius: 2, y: 1)
        }
        .accessibilityIdentifier(accessibilityId)
    }
}
