package com.masim05.bloodpressure.mobile

import org.junit.Assert.assertEquals
import org.junit.Test

class MainActivityPolicyUrlTest {
    @Test
    fun `buildPolicyUrl omits lang for system language`() {
        assertEquals(
            "http://10.0.2.2:3000/api/v1/policy",
            buildPolicyUrl("http://10.0.2.2:3000", SYSTEM_LANGUAGE_CODE),
        )
    }

    @Test
    fun `buildPolicyUrl adds lang query for explicit app language`() {
        assertEquals(
            "http://10.0.2.2:3000/api/v1/policy?lang=ru",
            buildPolicyUrl("http://10.0.2.2:3000", "ru"),
        )
    }

    @Test
    fun `buildPolicyUrl trims trailing slash from base URL`() {
        assertEquals(
            "https://bpt.crptmax.com/api/v1/policy?lang=es",
            buildPolicyUrl("https://bpt.crptmax.com/", "es"),
        )
    }
}
