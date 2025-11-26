const { execFileSync } = require('child_process')
const { readdirSync } = require('fs')
const { PACKAGE_DIRECTORIES, ROOT_DIR } = require('./constants')

/**
 * Packs and installs local packages and dependencies
 * @param {string} fixtureDir - Directory where the fixture is located
 * @param {Array} additionalDependencies - Array of dependency strings
 * @param {Array} additionalInstallArgs - Array of additional npm install arguments
 */
function installFixtureDependencies (fixtureDir, additionalDependencies = [], additionalInstallArgs = []) {
  // pack the required packages into the fixture directory
  for (const packageDir of PACKAGE_DIRECTORIES) {
    const libraryPackArgs = ['pack', packageDir, '--pack-destination', fixtureDir]
    execFileSync('npm', libraryPackArgs, { cwd: ROOT_DIR, stdio: 'inherit' })
  }

  // build the npm install command args
  const tarballs = readdirSync(fixtureDir).filter(file => file.endsWith('.tgz'))
  const installArgs = ['install', '--save', '--no-audit', ...additionalInstallArgs, ...additionalDependencies, ...tarballs]

  // install test fixture dependencies and local packages
  execFileSync('npm', installArgs, { cwd: fixtureDir, stdio: 'inherit' })
}

/**
 * Gets compatible dependency versions based on React Native version
 */
function getReactNativeDependencies (reactNativeVersion, notifierVersion) {
  const reactNativeFileAccessVersion = parseFloat(reactNativeVersion) <= 0.64 ? '1.7.1' : '3.1.1'
  const netinfoVersion = parseFloat(reactNativeVersion) <= 0.64 ? '10.0.0' : '11.3.2'

  return [
    `@bugsnag/react-native@${notifierVersion}`,
    `@react-native-community/netinfo@${netinfoVersion}`,
    `react-native-file-access@${reactNativeFileAccessVersion}`
  ]
}

/**
 * Gets React Navigation dependencies based on React Native version
 */
function getReactNavigationDependencies (reactNativeVersion) {
  let reactNavigationVersion = '6.1.18'
  let reactNavigationNativeStackVersion = '6.11.0'
  let reactNativeScreensVersion = '3.35.0'
  let reactNativeSafeAreaContextVersion = '4.14.0'

  // RN 0.77 requires react-native-screens 4.6.0, which in turn requires react navigation v7
  if (parseFloat(reactNativeVersion) >= 0.77) {
    reactNavigationVersion = '7.1.14'
    reactNavigationNativeStackVersion = '7.3.21'
    reactNativeScreensVersion = '4.11.1'
    reactNativeSafeAreaContextVersion = '5.5.1'
  } else if (parseFloat(reactNativeVersion) <= 0.64) {
    reactNativeScreensVersion = '3.14.0'
    reactNativeSafeAreaContextVersion = '4.3.4'
  }

  return [
    `@react-navigation/native@${reactNavigationVersion}`,
    `@react-navigation/native-stack@${reactNavigationNativeStackVersion}`,
    `react-native-screens@${reactNativeScreensVersion}`,
    `react-native-safe-area-context@${reactNativeSafeAreaContextVersion}`
  ]
}

/**
 * Gets React Native Navigation (Wix) dependencies
 */
function getReactNativeNavigationDependencies () {
  return [
    'react-native-navigation@7.37.2' // INVESTIGATE: higher than 7.37.2 causes a build error
  ]
}

/**
 * Gets Expo dependencies
 */
function getExpoDependencies () {
  return [
    '@bugsnag/react-native',
    '@react-native-community/netinfo',
    'react-native-file-access',
    'expo-build-properties',
    'expo-constants'
  ]
}

module.exports = {
  installFixtureDependencies,
  getReactNativeDependencies,
  getReactNavigationDependencies,
  getReactNativeNavigationDependencies,
  getExpoDependencies
}
