package com.masim05.bloodpressure.mobile.adapters.session

import com.masim05.bloodpressure.mobile.core.model.MobileUser
import com.masim05.bloodpressure.mobile.core.model.Session
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class InMemorySessionStoreTest {
    @Test
    fun storesLoadsAndClearsSession() {
        val store = InMemorySessionStore()
        assertNull(store.load())
        assertNull(store.loadError())

        val session = Session("token", "Bearer", "2026-12-31T00:00:00.000Z", MobileUser("usr_1", "user@example.com"))
        store.save(session)

        assertEquals(session, store.load())

        store.clear()

        assertNull(store.load())
        assertNull(store.loadError())
    }
}