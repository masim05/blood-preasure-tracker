package com.masim05.bloodpressure.mobile.ui.screens

import com.masim05.bloodpressure.mobile.R
import org.junit.Assert.assertEquals
import org.junit.Test

class ProfileScreenTest {
    @Test
    fun profileSectionsKeepPreferencesAboutAccountOrder() {
        assertEquals(
            listOf(
                R.string.profile_settings,
                R.string.profile_about,
                R.string.profile_account,
            ),
            profileSectionOrder(),
        )
    }

    @Test
    fun aboutSectionRowsKeepStoryPolicyGuideOrder() {
        assertEquals(
            listOf(
                R.string.profile_story,
                R.string.profile_policy,
                R.string.guide_title,
            ),
            aboutSectionRowOrder(),
        )
    }

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
}
