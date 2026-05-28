package com.masim05.bloodpressure.mobile.core.validation

import com.masim05.bloodpressure.mobile.core.model.HistoryFilter
import com.masim05.bloodpressure.mobile.core.model.MeasurementImage

sealed class ValidationResult {
    data object Valid : ValidationResult()
    data class Invalid(val reason: ValidationError) : ValidationResult()
}

enum class ValidationError {
    InvalidEmail,
    InvalidPassword,
    InvalidImage,
    InvalidDate,
    DateOrder,
}

object Validators {
    private val emailPattern = Regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")
    private val datePattern = Regex("^\\d{4}-\\d{2}-\\d{2}$")

    fun email(value: String): ValidationResult =
        if (emailPattern.matches(value.trim())) ValidationResult.Valid else ValidationResult.Invalid(ValidationError.InvalidEmail)

    fun password(value: String): ValidationResult =
        if (value.length >= 8) ValidationResult.Valid else ValidationResult.Invalid(ValidationError.InvalidPassword)

    fun image(image: MeasurementImage): ValidationResult =
        if (image.sizeBytes in 1..10_485_760 && image.mimeType in setOf("image/jpeg", "image/png")) {
            ValidationResult.Valid
        } else {
            ValidationResult.Invalid(ValidationError.InvalidImage)
        }

    fun historyFilter(filter: HistoryFilter): ValidationResult {
        if (filter.from.isNotBlank() && !datePattern.matches(filter.from)) {
            return ValidationResult.Invalid(ValidationError.InvalidDate)
        }
        if (filter.to.isNotBlank() && !datePattern.matches(filter.to)) {
            return ValidationResult.Invalid(ValidationError.InvalidDate)
        }
        if (filter.from.isNotBlank() && filter.to.isNotBlank() && filter.from > filter.to) {
            return ValidationResult.Invalid(ValidationError.DateOrder)
        }
        return ValidationResult.Valid
    }
}