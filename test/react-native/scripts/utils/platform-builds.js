const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const { isTruthy } = require('./env-validation')

/**
 * Patch Android Manifest and Network Security Config for Android 13+ & Modern React Native
 */
function patchAndroidFixture (fixtureDir) {
  const mainDir = path.join(fixtureDir, 'android', 'app', 'src', 'main')
  const manifestPath = path.join(mainDir, 'AndroidManifest.xml')
  const resXmlDir = path.join(mainDir, 'res', 'xml')
  const networkConfigPath = path.join(resXmlDir, 'network_security_config.xml')

  if (!fs.existsSync(manifestPath)) return

  // 1. Create network_security_config.xml
  fs.mkdirSync(resXmlDir, { recursive: true })
  fs.writeFileSync(networkConfigPath, `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
</network-security-config>
`, 'utf8')

  let manifest = fs.readFileSync(manifestPath, 'utf8')

  // 2. Add networkSecurityConfig only if not already present
  if (!manifest.includes('android:networkSecurityConfig=')) {
    manifest = manifest.replace(
      '<application',
      '<application\n      android:networkSecurityConfig="@xml/network_security_config"'
    )
  }

  // 3. Add usesCleartextTraffic only if not already present
  if (!manifest.includes('android:usesCleartextTraffic=')) {
    manifest = manifest.replace(
      '<application',
      '<application\n      android:usesCleartextTraffic="true"'
    )
  }

  // 4. Ensure MainActivity has android:exported="true" for Android 12+ compatibility
  if (!manifest.includes('android:exported="true"')) {
    if (manifest.includes('android:name=".MainActivity"')) {
      manifest = manifest.replace(
        /(<activity[^>]*android:name="\.MainActivity"[^>]*?)(\/?>)/,
        (match, p1, p2) => {
          if (!p1.includes('android:exported')) {
            return `${p1}\n        android:exported="true"${p2}`
          }
          return match
        }
      )
    }
  }

  fs.writeFileSync(manifestPath, manifest, 'utf8')
}

/**
 * Build Android fixture
 */
function buildAndroidFixture (fixtureDir, isNewArchEnabled) {
  if (!isTruthy(process.env.BUILD_ANDROID)) {
    return
  }

  patchAndroidFixture(fixtureDir)

  const buildArgs = isNewArchEnabled 
    ? ['generateCodegenArtifactsFromSchema', 'assembleRelease', '--stacktrace', '--console=plain']
    : ['assembleRelease', '--stacktrace', '--console=plain']

  const buildEnv = {
    ...process.env,
    // Ensures OpenSSL legacy provider is available when running on Node 22/24
    NODE_OPTIONS: process.env.NODE_OPTIONS || '--openssl-legacy-provider'
  }

  execFileSync('./gradlew', buildArgs, { 
    cwd: path.join(fixtureDir, 'android'), 
    stdio: 'inherit',
    env: buildEnv
  })

  const standardApkPath = path.join(fixtureDir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk')
  const unsignedApkPath = path.join(fixtureDir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk')
  const destinationApkPath = path.join(fixtureDir, 'reactnative.apk')

  if (fs.existsSync(standardApkPath)) {
    fs.copyFileSync(standardApkPath, destinationApkPath)
  } else if (fs.existsSync(unsignedApkPath)) {
    fs.copyFileSync(unsignedApkPath, destinationApkPath)
  } else {
    throw new Error(`[buildAndroidFixture] Could not find built APK at '${standardApkPath}'`)
  }
}

/**
 * Build iOS fixture for React Native
 */
function buildIOSFixture (fixtureDir) {
  if (!isTruthy(process.env.BUILD_IOS)) {
    return
  }

  fs.rmSync(path.join(fixtureDir, 'reactnative.xcarchive'), { recursive: true, force: true })

  // install pods with bundler
  execFileSync('bundle', ['install'], { cwd: path.join(fixtureDir, 'ios'), stdio: 'inherit' })
  execFileSync('bundle', ['exec', 'pod', 'install'], { cwd: path.join(fixtureDir, 'ios'), stdio: 'inherit' })

  // build the iOS app
  const archiveArgs = [
    'xcodebuild',
    'DEVELOPMENT_TEAM=7W9PZ27Y5F',
    '-workspace',
    'reactnative.xcworkspace',
    '-scheme',
    'reactnative',
    '-configuration',
    'Release',
    '-archivePath',
    path.join(fixtureDir, 'reactnative.xcarchive'),
    '-allowProvisioningUpdates',
    'archive'
  ]

  execFileSync('xcrun', archiveArgs, { cwd: path.join(fixtureDir, 'ios'), stdio: 'inherit' })

  // export the archive
  const exportArgs = [
    'xcodebuild',
    '-exportArchive',
    '-archivePath',
    'reactnative.xcarchive',
    '-exportPath',
    'output/',
    '-exportOptionsPlist',
    'exportOptions.plist'
  ]

  execFileSync('xcrun', exportArgs, { cwd: fixtureDir, stdio: 'inherit' })
}

/**
 * Build Android fixture for Expo
 */
function buildExpoAndroidFixture (fixtureDir, easWorkingDir) {
  if (!isTruthy(process.env.BUILD_ANDROID)) {
    return
  }

  const easBuildArgs = ['eas-cli@latest', 'build', '--local', '--platform', 'android', '--profile', 'production', '--output', 'output.apk']
  execFileSync('npx', easBuildArgs, {
    cwd: fixtureDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || 'production',
      EAS_LOCAL_BUILD_WORKINGDIR: easWorkingDir,
      EAS_LOCAL_BUILD_SKIP_CLEANUP: 1,
      EAS_NO_VCS: 1,
      EAS_PROJECT_ROOT: fixtureDir
    }
  })
}

/**
 * Build iOS fixture for Expo
 */
function buildExpoIOSFixture (fixtureDir, easWorkingDir) {
  if (!isTruthy(process.env.BUILD_IOS)) {
    return
  }

  // Find root Gemfile to force Bundler setup inside EAS subprocesses
  const rootGemfilePath = path.resolve(__dirname, '../../../../Gemfile')

  const easBuildArgs = ['eas-cli@latest', 'build', '--local', '--platform', 'ios', '--profile', 'production', '--output', 'output.ipa', '--non-interactive']
  execFileSync('npx', easBuildArgs, {
    cwd: fixtureDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || 'production',
      EXPO_USE_PRECOMPILED_MODULES: '0',
      RUBYOPT: '-rbundler/setup',
      BUNDLE_GEMFILE: fs.existsSync(rootGemfilePath) ? rootGemfilePath : process.env.BUNDLE_GEMFILE,
      EAS_LOCAL_BUILD_WORKINGDIR: easWorkingDir,
      EAS_LOCAL_BUILD_SKIP_CLEANUP: 1,
      EAS_NO_VCS: 1,
      EAS_PROJECT_ROOT: fixtureDir
    }
  })
}

module.exports = {
  buildAndroidFixture,
  buildIOSFixture,
  buildExpoAndroidFixture,
  buildExpoIOSFixture
}