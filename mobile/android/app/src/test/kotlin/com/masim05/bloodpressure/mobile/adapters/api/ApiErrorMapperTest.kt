package com.masim05.bloodpressure.mobile.adapters.api

import com.masim05.bloodpressure.mobile.core.model.ApiErrorSource
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import org.junit.Assert.assertEquals
import org.junit.Test

class ApiErrorMapperTest {
    @Test
    fun mapsApiMessageAndCodeFromErrorBody() {
        val error = ApiErrorMapper.fromApiBody("{\"error\":\"duplicate_email\",\"message\":\"Email is already taken\"}", "fallback")

        assertEquals("duplicate_email", error.code)
        assertEquals("Email is already taken", error.message)
        assertEquals(ApiErrorSource.Api, error.source)
    }

    @Test
    fun usesFallbackWhenApiBodyIsMalformedOrEmpty() {
        assertEquals("fallback", ApiErrorMapper.fromApiBody("{}", "fallback").message)
        assertEquals("fallback", ApiErrorMapper.fromApiBody(null, "fallback").message)
        assertEquals("fallback", ApiErrorMapper.fromApiBody("{\"error\":\"\",\"message\":\"\"}", "fallback").message)
    }

    @Test
    fun unescapesApiMessagesFromJsonBodies() {
        val error = ApiErrorMapper.fromApiBody("{\"error\":\"validation\",\"message\":\"Email \\\"bad\\\"\"}", "fallback")

        assertEquals("Email \"bad\"", error.message)
    }

    @Test
    fun mapsThrowableFallbacks() {
        assertEquals(ApiErrorSource.Timeout, ApiErrorMapper.fromThrowable(SocketTimeoutException(), "network", "timeout", "parse").source)
        assertEquals(ApiErrorSource.Network, ApiErrorMapper.fromThrowable(UnknownHostException(), "network", "timeout", "parse").source)
        assertEquals(ApiErrorSource.Parse, ApiErrorMapper.fromThrowable(IllegalArgumentException(), "network", "timeout", "parse").source)
        assertEquals("network", ApiErrorMapper.fromThrowable(RuntimeException(), "network", "timeout", "parse").message)
    }
}