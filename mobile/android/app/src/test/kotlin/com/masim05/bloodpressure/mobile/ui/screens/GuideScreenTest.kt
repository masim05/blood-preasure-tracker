package com.masim05.bloodpressure.mobile.ui.screens

import com.masim05.bloodpressure.mobile.R
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
                R.drawable.guide_example_good1,
                R.drawable.guide_example_good2,
                R.drawable.guide_example_bad1,
                R.drawable.guide_example_bad2,
            ),
            examples.map { it.drawableRes },
        )
    }
}
