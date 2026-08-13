package com.masim05.bloodpressure.mobile

import java.io.File
import javax.xml.parsers.DocumentBuilderFactory
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.w3c.dom.Element

class AndroidSecurityConfigurationTest {
    @Test
    fun `manifests enforce release and debug network policies and configure backups`() {
        val mainApplication = document("src/main/AndroidManifest.xml")
            .getElementsByTagName("application")
            .item(0) as Element
        val debugApplication = document("src/debug/AndroidManifest.xml")
            .getElementsByTagName("application")
            .item(0) as Element

        assertEquals("true", mainApplication.androidAttribute("allowBackup"))
        assertEquals("false", mainApplication.androidAttribute("usesCleartextTraffic"))
        assertEquals("@xml/backup_rules", mainApplication.androidAttribute("fullBackupContent"))
        assertEquals("@xml/data_extraction_rules", mainApplication.androidAttribute("dataExtractionRules"))
        assertEquals("true", debugApplication.androidAttribute("usesCleartextTraffic"))
    }

    @Test
    fun `legacy backup excludes session preferences and health-capable file domains`() {
        val exclusions = exclusions("src/main/res/xml/backup_rules.xml")

        assertTrue(exclusions.contains("sharedpref" to "auth_session_store.xml"))
        assertTrue(exclusions.contains("file" to "."))
        assertTrue(exclusions.contains("device_file" to "."))
    }

    @Test
    fun `modern backup and transfer exclude session preferences and health-capable file domains`() {
        val rules = document("src/main/res/xml/data_extraction_rules.xml")

        listOf("cloud-backup", "device-transfer").forEach { sectionName ->
            val section = rules.getElementsByTagName(sectionName).item(0) as Element
            val exclusions = section.getElementsByTagName("exclude").asExclusions()
            assertTrue(exclusions.contains("sharedpref" to "auth_session_store.xml"))
            assertTrue(exclusions.contains("file" to "."))
            assertTrue(exclusions.contains("device_file" to "."))
        }
    }

    private fun exclusions(path: String) =
        document(path).getElementsByTagName("exclude").asExclusions()

    private fun org.w3c.dom.NodeList.asExclusions() =
        (0 until length).map { index ->
            val exclusion = item(index) as Element
            exclusion.getAttribute("domain") to exclusion.getAttribute("path")
        }.toSet()

    private fun document(path: String) =
        DocumentBuilderFactory.newInstance().apply {
            isNamespaceAware = true
        }.newDocumentBuilder().parse(File(path))

    private fun Element.androidAttribute(name: String) =
        getAttributeNS("http://schemas.android.com/apk/res/android", name)
}
