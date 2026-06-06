package com.masim05.bloodpressure.mobile.ui.screens

import com.masim05.bloodpressure.mobile.R
import org.junit.Assert.assertEquals
import org.junit.Test

class AuthScreenTest {
    @Test
    fun authBrandIconUsesLauncherForegroundDrawable() {
        assertEquals(R.drawable.ic_launcher_foreground, authBrandIconRes())
    }
}
