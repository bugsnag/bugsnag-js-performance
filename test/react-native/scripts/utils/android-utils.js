const fs = require('fs')
const { resolve } = require('path')
const { ROOT_DIR } = require('./constants')
const { replaceInFile, appendToFileIfNotExists } = require('./file-utils')

/**
 * Configure Android project settings
 */
function configureAndroidProject (fixtureDir, isNewArchEnabled, reactNativeVersion) {
  const androidManifestPath = `${fixtureDir}/android/app/src/main/AndroidManifest.xml`
  
  if (fs.existsSync(androidManifestPath)) {
    let androidManifestContents = fs.readFileSync(androidManifestPath, 'utf8')

    // 1. Configure cleartext traffic & largeHeap safely without inserting duplicate attributes
    // Handle RN 0.82+ placeholder
    // eslint-disable-next-line no-template-curly-in-string
    if (androidManifestContents.includes('${usesCleartextTraffic}')) {
      // eslint-disable-next-line no-template-curly-in-string
      androidManifestContents = androidManifestContents.replace('${usesCleartextTraffic}', 'true')
    }

    if (!androidManifestContents.includes('android:usesCleartextTraffic=')) {
      androidManifestContents = androidManifestContents.replace(
        '<application',
        '<application android:usesCleartextTraffic="true"'
      )
    }

    if (!androidManifestContents.includes('android:largeHeap=')) {
      androidManifestContents = androidManifestContents.replace(
        '<application',
        '<application android:largeHeap="true"'
      )
    }

    // 2. Ensure MainActivity is explicitly exported for Android 12+ compatibility
    if (!androidManifestContents.includes('android:exported="true"')) {
      androidManifestContents = androidManifestContents.replace(
        /<activity\s+android:name="\.MainActivity"/,
        '<activity\n        android:name=".MainActivity"\n        android:exported="true"'
      )
    }

    // 3. Ensure MAIN/LAUNCHER intent filter exists on MainActivity if missing
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

  // Enable/disable the new architecture in gradle.properties
  const gradlePropertiesPath = `${fixtureDir}/android/gradle.properties`
  replaceInFile(gradlePropertiesPath, /newArchEnabled\s*=\s*(true|false)/, `newArchEnabled=${isNewArchEnabled}`)

  if (!isNewArchEnabled) {
    // React navigation setup
    configureReactNavigationAndroid(fixtureDir, reactNativeVersion)
  }
}

/**
 * Configure React Navigation for Android
 */
function configureReactNavigationAndroid (fixtureDir, reactNativeVersion) {
  const fileExtension = parseFloat(reactNativeVersion) < 0.73 ? 'java' : 'kt'
  let mainActivityPattern, mainActivityReplacement
  if (fileExtension === 'java') {
    mainActivityPattern = 'public class MainActivity extends ReactActivity {'
    mainActivityReplacement = `
import android.os.Bundle;

public class MainActivity extends ReactActivity {

  /**
   * Required for react-navigation/native implementation
   * https://reactnavigation.org/docs/getting-started/#installing-dependencies-into-a-bare-react-native-project
   */
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(null);
  }
`
  } else if (fileExtension === 'kt') {
    mainActivityPattern = 'class MainActivity : ReactActivity() {'
    mainActivityReplacement = `
import android.os.Bundle

class MainActivity : ReactActivity() {

  /**
   * Required for react-navigation/native implementation
   * https://reactnavigation.org/docs/getting-started/#installing-dependencies-into-a-bare-react-native-project
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }
`
  }

  const mainActivityPath = `${fixtureDir}/android/app/src/main/java/com/bugsnag/fixtures/reactnative/performance/MainActivity.${fileExtension}`
  replaceInFile(mainActivityPath, mainActivityPattern, mainActivityReplacement)
}

/**
 * Install Android Performance dependency
 */
function installAndroidPerformance (fixtureDir) {
  const appGradlePath = resolve(fixtureDir, 'android/app/build.gradle')
  const performanceDependency = 'implementation("com.bugsnag:bugsnag-android-performance:2.2.0")'
  const dependenciesSection = 'dependencies {'

  replaceInFile(appGradlePath, dependenciesSection, `${dependenciesSection}\n    ${performanceDependency}`)
}

function installNativeTestUtilsAndroid (fixtureDir) {
  const appGradlePath = resolve(fixtureDir, 'android/app/build.gradle')
  const testUtilsDependency = 'implementation project(":bugsnag-test-utils")'
  const dependenciesSection = 'dependencies {'

  replaceInFile(appGradlePath, dependenciesSection, `${dependenciesSection}\n    ${testUtilsDependency}`)

  const settingsGradlePath = resolve(fixtureDir, 'android/settings.gradle')
  const includeDependency = 'include("bugsnag-test-utils")'
  const dependencyPath = `project(":bugsnag-test-utils").projectDir = file("${resolve(ROOT_DIR, 'test/react-native/native-test-utils/android')}")`

  appendToFileIfNotExists(settingsGradlePath, `\n${includeDependency}\n${dependencyPath}`, 'bugsnag-test-utils')
}

/**
 * Configure MainApplication to import BugsnagTestUtils and call startNativePerformance
 */
function configureMainApplicationForTestUtils (fixtureDir, reactNativeVersion) {
  const fileExtension = parseFloat(reactNativeVersion) < 0.73 ? 'java' : 'kt'
  const mainApplicationPath = `${fixtureDir}/android/app/src/main/java/com/bugsnag/fixtures/reactnative/performance/MainApplication.${fileExtension}`
  
  if (!fs.existsSync(mainApplicationPath)) {
    console.warn(`MainApplication file not found at ${mainApplicationPath}`)
    return
  }
  
  let fileContents = fs.readFileSync(mainApplicationPath, 'utf8')

  const importStatement = fileExtension === 'java' ? 'import com.bugsnag.test.utils.BugsnagTestUtils;' : 'import com.bugsnag.test.utils.BugsnagTestUtils'
  const lastImportMatch = fileExtension === 'java' ? fileContents.match(/import\s+[^;]+;/g) : fileContents.match(/import\s+[^\n]+/g)

  const superOnCreateMatch = fileExtension === 'java' ? fileContents.match(/super\.onCreate\(\);/) : fileContents.match(/super\.onCreate\(\)/)
  const methodCall = fileExtension === 'java' ? 'BugsnagTestUtils.startNativePerformanceIfConfigured(this);' : 'BugsnagTestUtils.startNativePerformanceIfConfigured(this)'

  if (lastImportMatch && !fileContents.includes(importStatement)) {
    // Find the last import statement and add our import after it
    const lastImport = lastImportMatch[lastImportMatch.length - 1]
    replaceInFile(mainApplicationPath, lastImport, `${lastImport}\n${importStatement}`)
  }

  if (superOnCreateMatch && !fileContents.includes(methodCall)) {
    const superOnCreateCall = superOnCreateMatch[0]
    replaceInFile(mainApplicationPath, superOnCreateCall, `${superOnCreateCall}\n    ${methodCall}`)
  }
}

module.exports = {
  configureAndroidProject,
  configureReactNavigationAndroid,
  installAndroidPerformance,
  installNativeTestUtilsAndroid,
  configureMainApplicationForTestUtils
}