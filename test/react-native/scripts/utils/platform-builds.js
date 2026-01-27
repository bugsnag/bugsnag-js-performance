const { execFileSync } = require('child_process')
const fs = require('fs')
const { isTruthy } = require('./env-validation')

/**
 * Build Android fixture
 */
function buildAndroidFixture (fixtureDir, isNewArchEnabled) {
  if (!isTruthy(process.env.BUILD_ANDROID)) {
    return
  }

  const buildArgs = isNewArchEnabled ? ['generateCodegenArtifactsFromSchema', 'assembleRelease'] : ['assembleRelease']
  execFileSync('./gradlew', buildArgs, { cwd: `${fixtureDir}/android`, stdio: 'inherit' })
  fs.copyFileSync(`${fixtureDir}/android/app/build/outputs/apk/release/app-release.apk`, `${fixtureDir}/reactnative.apk`)
}

/**
 * Build iOS fixture for React Native
 */
function buildIOSFixture (fixtureDir) {
  if (!isTruthy(process.env.BUILD_IOS)) {
    return
  }

  fs.rmSync(`${fixtureDir}/reactnative.xcarchive`, { recursive: true, force: true })

  // install pods
  execFileSync('bundle', ['install'], { cwd: `${fixtureDir}/ios`, stdio: 'inherit' })
  execFileSync('bundle', ['exec', 'pod', 'install'], { cwd: `${fixtureDir}/ios`, stdio: 'inherit' })

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
    `${fixtureDir}/reactnative.xcarchive`,
    '-allowProvisioningUpdates',
    'archive'
  ]

  execFileSync('xcrun', archiveArgs, { cwd: `${fixtureDir}/ios`, stdio: 'inherit' })

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

  const easBuildArgs = ['eas-cli@latest', 'build', '--local', '--platform', 'ios', '--profile', 'production', '--output', 'output.ipa', '--non-interactive']
  execFileSync('npx', easBuildArgs, {
    cwd: fixtureDir,
    stdio: 'inherit',
    env: {
      ...process.env,
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
