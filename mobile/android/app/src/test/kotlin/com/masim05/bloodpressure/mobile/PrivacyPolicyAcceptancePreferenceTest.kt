package com.masim05.bloodpressure.mobile

import android.content.Context
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class PrivacyPolicyAcceptancePreferenceTest {
    private val context: Context = RuntimeEnvironment.getApplication()
    private val preferences = context.getSharedPreferences("privacy-policy-test", Context.MODE_PRIVATE)

    @Before
    fun clearPreferences() {
        preferences.edit().clear().commit()
    }

    @Test
    fun privacyPolicyAcceptanceDefaultsToFalse() {
        assertFalse(isPrivacyPolicyAccepted(preferences))
    }

    @Test
    fun privacyPolicyAcceptanceCanBePersisted() {
        markPrivacyPolicyAccepted(preferences)

        assertTrue(isPrivacyPolicyAccepted(preferences))
        assertTrue(preferences.getBoolean(PRIVACY_POLICY_ACCEPTED_PREFERENCE_KEY, false))
    }
}
