package com.masim05.bloodpressure.mobile.ui.screens

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.masim05.bloodpressure.mobile.ui.TestTags
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class PrivacyPolicyGateScreenTest {
    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun privacyPolicyGateShowsPolicyAndAcceptButton() {
        composeRule.setContent {
            PrivacyPolicyGateScreen(
                selectedLanguageCode = "en",
                onLanguageSelected = {},
                onAccept = {},
            )
        }

        composeRule.onNodeWithTag(TestTags.PolicyGateScreen).assertIsDisplayed()
        composeRule.onNodeWithText("Privacy Policy").assertIsDisplayed()
        composeRule.onNodeWithTag(TestTags.PolicyGateAccept).assertIsDisplayed()
    }

    @Test
    fun privacyPolicyGateAcceptButtonInvokesCallback() {
        var accepted = false
        composeRule.setContent {
            PrivacyPolicyGateScreen(
                selectedLanguageCode = "en",
                onLanguageSelected = {},
                onAccept = { accepted = true },
            )
        }

        composeRule.onNodeWithTag(TestTags.PolicyGateAccept).performClick()

        assertEquals(true, accepted)
    }

    @Test
    fun privacyPolicyGateLanguageSelectorInvokesCallback() {
        var selectedLanguageCode: String? = null
        composeRule.setContent {
            PrivacyPolicyGateScreen(
                selectedLanguageCode = "en",
                onLanguageSelected = { selectedLanguageCode = it },
                onAccept = {},
            )
        }

        composeRule.onNodeWithTag(TestTags.PolicyGateLanguageSelector).performClick()
        composeRule.onNodeWithTag("${TestTags.PolicyGateLanguageOptionPrefix}es", useUnmergedTree = true).performClick()

        assertEquals("es", selectedLanguageCode)
    }
}
