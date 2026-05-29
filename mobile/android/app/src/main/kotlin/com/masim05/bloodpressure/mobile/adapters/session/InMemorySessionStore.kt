package com.masim05.bloodpressure.mobile.adapters.session

import com.masim05.bloodpressure.mobile.core.model.Session
import com.masim05.bloodpressure.mobile.core.ports.SessionStore

class InMemorySessionStore : SessionStore {
    private var current: Session? = null

    override fun save(session: Session) {
        current = session
    }

    override fun load(): Session? = current

    override fun loadError(): String? = null

    override fun clear() {
        current = null
    }
}