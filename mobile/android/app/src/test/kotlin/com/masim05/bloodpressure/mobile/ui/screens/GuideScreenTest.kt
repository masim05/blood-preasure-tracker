package com.masim05.bloodpressure.mobile.ui.screens

import com.masim05.bloodpressure.mobile.R
import org.junit.Assert.assertEquals
import org.junit.Test

class GuideScreenTest {
    @Test
    fun guideUsesCompositeReferenceScreenshot() {
        assertEquals(R.drawable.guide_screenshot_pr34, guideReferenceDrawableRes())
    }
}
