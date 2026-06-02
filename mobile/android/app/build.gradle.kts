import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    jacoco
}

val localProperties = Properties().apply {
    val localPropertiesFile = rootProject.file("local.properties")
    if (localPropertiesFile.isFile) {
        localPropertiesFile.inputStream().use { input -> load(input) }
    }
}
val apiBaseUrl = localProperties.getProperty("apiBaseUrl")
    ?.takeIf { value -> value.isNotBlank() }
    ?: providers.gradleProperty("apiBaseUrl").orElse("http://10.0.2.2:3000").get()

android {
    namespace = "com.masim05.bloodpressure.mobile"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.masim05.bloodpressure.mobile"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
        buildConfigField("String", "API_BASE_URL", "\"$apiBaseUrl\"")
    }

    buildFeatures {
        buildConfig = true
        compose = true
    }

    buildTypes {
        debug {
            enableUnitTestCoverage = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    testOptions {
        unitTests.all {
            it.useJUnit()
        }
    }
}
dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.camera.camera2)
    implementation(libs.androidx.camera.core)
    implementation(libs.androidx.camera.lifecycle)
    implementation(libs.androidx.camera.view)
    implementation(libs.androidx.compose.foundation)
    implementation(libs.androidx.compose.material.icons)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.exifinterface)
    implementation(libs.androidx.navigation.compose)
    testImplementation(libs.junit)
}

jacoco {
    toolVersion = "0.8.12"
}

val androidCoverageExcludes = listOf(
    "**/MainActivity*",
    "**/MainActivityKt*",
    "**/ComposableSingletons\$MainActivityKt*",
    "**/RootGraph*",
    "**/AuthDestination*",
    "**/MainDestination*",
    "**/MobileUiState*",
    "**/core/model/CameraUiState*",
    "**/core/model/CameraUiStatus*",
    "**/ui/**",
    "**/adapters/session/AndroidKeystoreEncryptor*",
    "**/adapters/session/SharedPreferencesStore*",
    "**/BuildConfig.*",
    "**/R.class",
    "**/R$*.class",
)

tasks.register<JacocoReport>("androidUnitCoverageReport") {
    dependsOn("testDebugUnitTest")

    reports {
        xml.required.set(true)
        html.required.set(true)
    }

    classDirectories.setFrom(
        fileTree(layout.buildDirectory.dir("tmp/kotlin-classes/debug")) {
            exclude(androidCoverageExcludes)
        },
    )
    sourceDirectories.setFrom(files("src/main/kotlin"))
    executionData.setFrom(
        fileTree(layout.buildDirectory) {
            include(
                "outputs/unit_test_code_coverage/debugUnitTest/testDebugUnitTest.exec",
                "jacoco/testDebugUnitTest.exec",
            )
        },
    )
}

tasks.register<JacocoCoverageVerification>("androidCoverageVerify") {
    dependsOn("testDebugUnitTest")

    classDirectories.setFrom(
        fileTree(layout.buildDirectory.dir("tmp/kotlin-classes/debug")) {
            exclude(androidCoverageExcludes)
        },
    )
    sourceDirectories.setFrom(files("src/main/kotlin"))
    executionData.setFrom(
        fileTree(layout.buildDirectory) {
            include(
                "outputs/unit_test_code_coverage/debugUnitTest/testDebugUnitTest.exec",
                "jacoco/testDebugUnitTest.exec",
            )
        },
    )

    violationRules {
        rule {
            limit {
                minimum = "0.95".toBigDecimal()
            }
        }
    }
}
