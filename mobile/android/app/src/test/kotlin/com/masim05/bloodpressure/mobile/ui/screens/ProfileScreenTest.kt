package com.masim05.bloodpressure.mobile.ui.screens

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.masim05.bloodpressure.mobile.R
import com.masim05.bloodpressure.mobile.ui.TestTags
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RuntimeEnvironment
import org.robolectric.RobolectricTestRunner
import java.util.Locale

@RunWith(RobolectricTestRunner::class)
class ProfileScreenTest {
    private val originalLocale: Locale = Locale.getDefault()

    @After
    fun restoreLocale() {
        Locale.setDefault(originalLocale)
        RuntimeEnvironment.setQualifiers(originalLocale.language)
    }

    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun storyPageUsesSameThreeParagraphStructureAsWeb() {
        assertEquals(
            listOf(
                R.string.profile_story_paragraph_1,
                R.string.profile_story_paragraph_2,
                R.string.profile_story_paragraph_3,
            ),
            storyParagraphResIds(),
        )
    }

    @Test
    fun policyPageContainsAllExpectedSections() {
        val sections = policySectionsCopy()

        assertEquals(7, sections.size)
        assertEquals(R.string.profile_policy_heading_data_collect, sections.first().headingRes)
        assertEquals(R.string.profile_policy_heading_contact, sections.last().headingRes)
    }

    @Test
    fun storyPolicyAndBackFlowRendersInteractiveAboutPages() {
        composeRule.setContent {
            ProfileScreen(
                selectedLanguageCode = "en",
                onLanguageSelected = {},
                onOpenGuide = {},
                onLogout = {},
            )
        }

        composeRule.onNodeWithTag(TestTags.ProfileStory).performClick()
        composeRule.onNodeWithTag(TestTags.ProfileAboutBack).assertIsDisplayed()
        composeRule.onNodeWithText("Track your readings easily").assertIsDisplayed()

        composeRule.onNodeWithTag(TestTags.ProfileAboutBack).performClick()
        composeRule.onNodeWithTag(TestTags.ProfilePolicy).performClick()
        composeRule.onNodeWithText("Your privacy matters. This policy explains what data Blood Pressure collects, why, and how it is handled.").assertIsDisplayed()
        composeRule.onNodeWithText("Last updated: July 18, 2026").assertIsDisplayed()
    }


    @Test
    fun localizedPolicyPageShowsTranslatedLastUpdatedLine() {
        Locale.setDefault(Locale("es"))
        RuntimeEnvironment.setQualifiers("es")

        composeRule.setContent {
            ProfileScreen(
                selectedLanguageCode = "en",
                onLanguageSelected = {},
                onOpenGuide = {},
                onLogout = {},
            )
        }

        composeRule.onNodeWithTag(TestTags.ProfilePolicy).performClick()
        composeRule.onNodeWithText("Última actualización: 18 de julio de 2026").assertIsDisplayed()
    }

    @Test
    fun policyPageUsesWebViewWhenPolicyUrlProvided() {
        composeRule.setContent {
            ProfileScreen(
                selectedLanguageCode = "en",
                onLanguageSelected = {},
                onOpenGuide = {},
                onLogout = {},
                policyUrl = "https://example.com/api/v1/policy?lang=en",
            )
        }

        composeRule.onNodeWithTag(TestTags.ProfilePolicy).performClick()
        composeRule.onNodeWithTag(TestTags.ProfilePolicyWebView).assertIsDisplayed()
    }

    @Test
    fun profileGuideRowInvokesGuideCallback() {
        var guideOpenCount = 0
        composeRule.setContent {
            ProfileScreen(
                selectedLanguageCode = "en",
                onLanguageSelected = {},
                onOpenGuide = { guideOpenCount += 1 },
                onLogout = {},
            )
        }

        composeRule.onNodeWithTag(TestTags.ProfileGuide).performClick()

        assertEquals(1, guideOpenCount)
    }

    @Test
    fun languageSelectorInvokesLanguageCallbackWithSelectedCode() {
        var selectedLanguageCode: String? = null
        composeRule.setContent {
            ProfileScreen(
                selectedLanguageCode = "en",
                onLanguageSelected = { selectedLanguageCode = it },
                onOpenGuide = {},
                onLogout = {},
            )
        }

        composeRule.onNodeWithTag(TestTags.ProfileLanguageSelector).performClick()
        composeRule.onNodeWithTag("${TestTags.ProfileLanguageOptionPrefix}es", useUnmergedTree = true).performClick()

        assertEquals("es", selectedLanguageCode)
    }
}
