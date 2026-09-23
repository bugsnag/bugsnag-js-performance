const fs = require('fs')
const { resolve } = require('path')
const { ROOT_DIR } = require('./constants')
const { replaceInFile, appendToFileIfNotExists } = require('./file-utils')

/**
 * Configure Android project settings including permissions, cleartext HTTP,
 * network security config for Maze Runner, exported activity flags, and architecture.
 */
function configureAndroidProject (fixtureDir, isNewArchEnabled, reactNativeVersion) {
  const androidManifestPath = resolve(fixtureDir, 'android/app/src/main/AndroidManifest.xml')

  if (fs.existsSync(androidManifestPath)) {
    let androidManifestContents = fs.readFileSync(androidManifestPath, 'utf8')

    // 1. Ensure tools namespace exists
    if (!androidManifestContents.includes('xmlns:tools=')) {
      androidManifestContents = androidManifestContents.replace(
        '<manifest',
        '<manifest\n    xmlns:tools="http://schemas.android.com/tools"'
      )
    }

    // 2. Ensure INTERNET & ACCESS_NETWORK_STATE permissions exist
    if (!androidManifestContents.includes('android.permission.INTERNET')) {
      androidManifestContents = androidManifestContents.replace(
        /<application/,
        '    <uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />\n    <application'
      )
    }

    // 3. Handle React Native template placeholder if present
    // eslint-disable-next-line no-template-curly-in-string
    if (androidManifestContents.includes('${usesCleartextTraffic}')) {
      // eslint-disable-next-line no-template-curly-in-string
      androidManifestContents = androidManifestContents.replace(/\$\{usesCleartextTraffic\}/g, 'true')
    }

    // 4. Ensure usesCleartextTraffic="true" is set on <application>
    if (!androidManifestContents.includes('android:usesCleartextTraffic=')) {
      androidManifestContents = androidManifestContents.replace(
        '<application',
        '<application\n      android:usesCleartextTraffic="true"'
      )
    }

    // 5. Ensure largeHeap="true" is set on <application>
    if (!androidManifestContents.includes('android:largeHeap=')) {
      androidManifestContents = androidManifestContents.replace(
        '<application',
        '<application\n      android:largeHeap="true"'
      )
    }

    // 6. Ensure networkSecurityConfig is set on <application>
    if (!androidManifestContents.includes('android:networkSecurityConfig=')) {
      androidManifestContents = androidManifestContents.replace(
        '<application',
        '<application\n      android:networkSecurityConfig="@xml/network_security_config"'
      )
    }

    // 7. Ensure MainActivity is explicitly exported for Android 12+ (API 31+) / Appium 2.x
    if (!androidManifestContents.includes('android:exported="true"')) {
      androidManifestContents = androidManifestContents.replace(
        /<activity\s+android:name="\.MainActivity"/,
        '<activity\n        android:name=".MainActivity"\n        android:exported="true"'
      )
    }

    // 8. Ensure MAIN & LAUNCHER intent filter is present on MainActivity
    if (!androidManifestContents.includes('android.intent.action.MAIN')) {
      const launcherIntentFilter = `
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>`
      androidManifestContents = androidManifestContents.replace(
        /(<activity[^>]*android:name="\.MainActivity"[^>]*>)/,
        `$1\n${launcherIntentFilter}`
      )
    }

    fs.writeFileSync(androidManifestPath, androidManifestContents, 'utf8')
  }

  // 9. Create res/xml/network_security_config.xml to allow cleartext HTTP to Maze Runner
  const resXmlDir = resolve(fixtureDir, 'android/app/src/main/res/xml')
  if (!fs.existsSync(resXmlDir)) {
    fs.mkdirSync(resXmlDir, { recursive: true })
  }
  const networkSecPath = resolve(resXmlDir, 'network_security_config.xml')
  const networkSecContent = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
</network-security-config>
`
  fs.writeFileSync(networkSecPath, networkSecContent, 'utf8')

  // 10. Configure new architecture flag in gradle.properties
  const gradlePropertiesPath = resolve(fixtureDir, 'android/gradle.properties')
  if (fs.existsSync(gradlePropertiesPath)) {
    const gradleProps = fs.readFileSync(gradlePropertiesPath, 'utf8')
    if (/newArchEnabled\s*=/.test(gradleProps)) {
      replaceInFile(gradlePropertiesPath, /newArchEnabled\s*=\s*(true|false)/, `newArchEnabled=${isNewArchEnabled}`)
    } else {
      appendToFileIfNotExists(gradlePropertiesPath, `\nnewArchEnabled=${isNewArchEnabled}\n`, 'newArchEnabled')
    }
  }

  if (!isNewArchEnabled) {
    configureReactNavigationAndroid(fixtureDir, reactNativeVersion)
  }
}

/**
 * Configure React Navigation for Android (Old Architecture)
 */
function configureReactNavigationAndroid (fixtureDir, reactNativeVersion) {
  const basePath = resolve(fixtureDir, 'android/app/src/main/java/com/bugsnag/fixtures/reactnative/performance')
  const javaPath = resolve(basePath, 'MainActivity.java')
  const ktPath = resolve(basePath, 'MainActivity.kt')

  const isJava = fs.existsSync(javaPath)
  const isKt = fs.existsSync(ktPath)

  if (isJava) {
    let content = fs.readFileSync(javaPath, 'utf8')
    if (!content.includes('import android.os.Bundle;')) {
      content = content.replace(
        'package com.bugsnag.fixtures.reactnative.performance;',
        'package com.bugsnag.fixtures.reactnative.performance;\n\nimport android.os.Bundle;'
      )
    }
    if (!content.includes('savedInstanceState')) {
      const onCreateJava = `
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(null);
  }
`
      content = content.replace(
        /(public class MainActivity extends ReactActivity\s*\{)/,
        `$1\n${onCreateJava}`
      )
    }
    fs.writeFileSync(javaPath, content, 'utf8')
  } else if (isKt) {
    let content = fs.readFileSync(ktPath, 'utf8')
    if (!content.includes('import android.os.Bundle')) {
      content = content.replace(
        'package com.bugsnag.fixtures.reactnative.performance',
        'package com.bugsnag.fixtures.reactnative.performance\n\nimport android.os.Bundle'
      )
    }
    if (!content.includes('savedInstanceState')) {
      const onCreateKt = `
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }
`
      content = content.replace(
        /(class MainActivity : ReactActivity\(\)\s*\{)/,
        `$1\n${onCreateKt}`
      )
    }
    fs.writeFileSync(ktPath, content, 'utf8')
  }
}

/**
 * Install Android Performance dependency into app/build.gradle
 */
function installAndroidPerformance (fixtureDir) {
  const appGradlePath = resolve(fixtureDir, 'android/app/build.gradle')
  const performanceDependency = 'implementation("com.bugsnag:bugsnag-android-performance:2.2.0")'
  const dependenciesSection = 'dependencies {'

  if (fs.existsSync(appGradlePath)) {
    const content = fs.readFileSync(appGradlePath, 'utf8')
    if (!content.includes('bugsnag-android-performance')) {
      replaceInFile(appGradlePath, dependenciesSection, `${dependenciesSection}\n    ${performanceDependency}`)
    }
  }
}

/**
 * Install Native Test Utils module into app/build.gradle and settings.gradle
 */
function installNativeTestUtilsAndroid (fixtureDir) {
  const appGradlePath = resolve(fixtureDir, 'android/app/build.gradle')
  const testUtilsDependency = 'implementation project(":bugsnag-test-utils")'
  const dependenciesSection = 'dependencies {'

  if (fs.existsSync(appGradlePath)) {
    const content = fs.readFileSync(appGradlePath, 'utf8')
    if (!content.includes('project(":bugsnag-test-utils")')) {
      replaceInFile(appGradlePath, dependenciesSection, `${dependenciesSection}\n    ${testUtilsDependency}`)
    }
  }

  const settingsGradlePath = resolve(fixtureDir, 'android/settings.gradle')
  const includeDependency = 'include("bugsnag-test-utils")'
  const dependencyPath = `project(":bugsnag-test-utils").projectDir = file("${resolve(ROOT_DIR, 'test/react-native/native-test-utils/android')}")`

  appendToFileIfNotExists(settingsGradlePath, `\n${includeDependency}\n${dependencyPath}`, 'bugsnag-test-utils')
}

/**
 * Configure MainApplication (Java or Kotlin) to import BugsnagTestUtils and initialize native performance
 */
function configureMainApplicationForTestUtils (fixtureDir, reactNativeVersion) {
  const basePath = resolve(fixtureDir, 'android/app/src/main/java/com/bugsnag/fixtures/reactnative/performance')
  const javaPath = resolve(basePath, 'MainApplication.java')
  const ktPath = resolve(basePath, 'MainApplication.kt')

  const isJava = fs.existsSync(javaPath)
  const isKt = fs.existsSync(ktPath)

  if (!isJava && !isKt) {
    console.warn(`[android-utils] MainApplication file not found in ${basePath}`)
    return
  }

  const mainApplicationPath = isJava ? javaPath : ktPath
  let fileContents = fs.readFileSync(mainApplicationPath, 'utf8')

  const importStatement = isJava
    ? 'import com.bugsnag.test.utils.BugsnagTestUtils;'
    : 'import com.bugsnag.test.utils.BugsnagTestUtils'

  const methodCall = isJava
    ? 'BugsnagTestUtils.startNativePerformanceIfConfigured(this);'
    : 'BugsnagTestUtils.startNativePerformanceIfConfigured(this)'

  if (!fileContents.includes(importStatement)) {
    if (isJava) {
      const lastImportMatch = fileContents.match(/import\s+[^;]+;/g)
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1]
        fileContents = fileContents.replace(lastImport, `${lastImport}\n${importStatement}`)
      }
    } else {
      const lastImportMatch = fileContents.match(/import\s+[^\n]+/g)
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1]
        fileContents = fileContents.replace(lastImport, `${lastImport}\n${importStatement}`)
      }
    }
  }

  if (!fileContents.includes(methodCall)) {
    if (isJava) {
      fileContents = fileContents.replace(
        /(super\.onCreate\(\);)/,
        `$1\n    ${methodCall}`
      )
    } else {
      fileContents = fileContents.replace(
        /(super\.onCreate\(\))/,
        `$1\n    ${methodCall}`
      )
    }
  }

  fs.writeFileSync(mainApplicationPath, fileContents, 'utf8')
}

module.exports = {
  configureAndroidProject,
  configureReactNavigationAndroid,
  installAndroidPerformance,
  installNativeTestUtilsAndroid,
  configureMainApplicationForTestUtils
}