const { execFileSync } = require('child_process')
const { readdirSync } = require('fs')
const { ROOT_DIR } = require('./constants')

/**
 * Packs and installs local packages and dependencies
 * @param {string} fixtureDir - Directory where the fixture is located
 * @param {Array} packageDirectories - Array of absolute paths to package directories to pack
 * @param {Array} additionalDependencies - Array of dependency strings
 * @param {Array} additionalInstallArgs - Array of additional npm install arguments
 */
function installFixtureDependencies(fixtureDir, packageDirectories, additionalDependencies = [], additionalInstallArgs = []) {
  // pack the required packages into the fixture directory
  for (const packageDir of packageDirectories) {
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
function getReactNativeDependencies(reactNativeVersion, notifierVersion) {
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
function getReactNavigationDependencies(reactNativeVersion) {
  // react-native-screens new-arch support:
  // library version 	react-native version
  // 4.19.0+ 	        0.81.0+
  // 4.14.0+ 	        0.79.0+
  // 4.5.0+ 	        0.77.0+
  // 4.0.0+ 	        0.76.0+
  // 3.33.0+ 	        0.75.0+
  // 3.32.0+ 	        0.74.0+
  // 3.28.0+ 	        0.73.0+
  // 3.21.0+ 	        0.72.0+
  // 3.19.0+ 	        0.71.0+
  // 3.18.0+ 	        0.70.0+
  // 3.14.0+ 	        0.69.0+

  // default to the latest versions - update here when new versions are released or new RN versions come out
  let reactNavigationVersion = '^7.0.0'
  let reactNavigationNativeStackVersion = '^7.0.0'
  let reactNativeSafeAreaContextVersion = '^5.0.0'
  let reactNativeScreensVersion = '~4.19.0'

  // Adjust versions based on React Native version
  const rnVersion = parseFloat(reactNativeVersion)
  switch (true) {
    case rnVersion >= 0.81:
      reactNativeScreensVersion = '~4.19.0'
      break
    case rnVersion >= 0.79:
      reactNativeScreensVersion = '~4.14.0'
      break
    case rnVersion >= 0.78:
      reactNativeScreensVersion = '~4.11.0'
      break
    case rnVersion >= 0.76:
      reactNativeScreensVersion = '~4.0.0'
      break
    case rnVersion >= 0.75:
      reactNavigationVersion = '^6.0.0'
      reactNavigationNativeStackVersion = '^6.0.0'
      reactNativeScreensVersion = '~3.33.0'
      break
    case rnVersion >= 0.74:
      reactNavigationVersion = '^6.0.0'
      reactNavigationNativeStackVersion = '^6.0.0'
      reactNativeScreensVersion = '~3.32.0'
      break
    case rnVersion >= 0.73:
      reactNavigationVersion = '^6.0.0'
      reactNavigationNativeStackVersion = '^6.0.0'
      reactNativeSafeAreaContextVersion = '4.14.0'
      reactNativeScreensVersion = '~3.28.0'
      break
    case rnVersion >= 0.72:
      reactNavigationVersion = '^6.0.0'
      reactNavigationNativeStackVersion = '^6.0.0'
      reactNativeSafeAreaContextVersion = '4.14.0'
      reactNativeScreensVersion = '~3.21.0'
      break
    case rnVersion <= 0.64:
      reactNavigationVersion = '^6.0.0'
      reactNavigationNativeStackVersion = '^6.0.0'
      reactNativeSafeAreaContextVersion = '4.3.4'
      reactNativeScreensVersion = '~3.14.0'
      break
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
function getReactNativeNavigationDependencies() {
  return [
    'react-native-navigation@7.37.2' // INVESTIGATE: higher than 7.37.2 causes a build error
  ]
}

/**
 * Gets Expo dependencies
 */
function getExpoDependencies() {
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
