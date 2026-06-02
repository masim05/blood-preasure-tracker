package com.masim05.bloodpressure.mobile.ui.screens

import org.junit.Assert.assertEquals
import org.junit.Test

class GuideScreenTest {
    @Test
    fun guideExamplesKeepRequestedGoodThenBadOrdering() {
        val examples = guideExamplePanels()

        assertEquals(4, examples.size)
        assertEquals(listOf(true, true, false, false), examples.map { it.isGood })
        assertEquals(
            listOf(
                GuideExampleVariant.FullDisplayCentered,
                GuideExampleVariant.FullDisplayAngled,
                GuideExampleVariant.CroppedDisplay,
                GuideExampleVariant.MissingArm,
            ),
            examples.map { it.variant },
        )
    }
}
