package com.masim05.bloodpressure.mobile.core.validation

import com.masim05.bloodpressure.mobile.core.model.HistoryFilter
import com.masim05.bloodpressure.mobile.core.model.MeasurementImage
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ValidatorsTest {
    @Test
    fun acceptsValidEmailPasswordImageAndFilter() {
        assertEquals(ValidationResult.Valid, Validators.email("user@example.com"))
        assertEquals(ValidationResult.Valid, Validators.password("password123"))
        assertEquals(ValidationResult.Valid, Validators.image(MeasurementImage("file://image.jpg", "image/jpeg", 1024)))
        assertEquals(ValidationResult.Valid, Validators.historyFilter(HistoryFilter("2026-05-01", "2026-05-31")))
    }

    @Test
    fun rejectsInvalidEmailPasswordAndImages() {
        assertInvalid(ValidationError.InvalidEmail, Validators.email("not-email"))
        assertInvalid(ValidationError.InvalidPassword, Validators.password("short"))
        assertInvalid(ValidationError.InvalidImage, Validators.image(MeasurementImage("file://image.gif", "image/gif", 1024)))
        assertInvalid(ValidationError.InvalidImage, Validators.image(MeasurementImage("file://empty.jpg", "image/jpeg", 0)))
        assertInvalid(ValidationError.InvalidImage, Validators.image(MeasurementImage("file://large.jpg", "image/jpeg", 10_485_761)))
    }

    @Test
    fun rejectsInvalidHistoryDates() {
        assertInvalid(ValidationError.InvalidDate, Validators.historyFilter(HistoryFilter("2026/05/01", "")))
        assertInvalid(ValidationError.InvalidDate, Validators.historyFilter(HistoryFilter("", "2026/05/31")))
        assertInvalid(ValidationError.DateOrder, Validators.historyFilter(HistoryFilter("2026-05-31", "2026-05-01")))
    }

    private fun assertInvalid(expected: ValidationError, actual: ValidationResult) {
        assertTrue(actual is ValidationResult.Invalid)
        assertEquals(expected, (actual as ValidationResult.Invalid).reason)
    }
}