const { execFileSync } = require('child_process')
const { resolve } = require('path')
const fs = require('fs')

// Import utilities
const { ROOT_DIR } = require('./utils/constants')
const { validateEnvironment, isTruthy, isBooleanString } = require('./utils/env-validation')
const { buildPackages } = require('./utils/build-utils')
const { cleanDirectory } = require('./utils/file-utils')
const { 
  installFixtureDependencies, 
  getReactNativeDependencies, 
  getReactNavigationDependencies,
  getReactNativeNavigationDependencies 
} = require('./utils/dependency-utils')
const {
  replaceGeneratedFixtureFiles,
  configureIOSProject,
  configureAndroidProject,
  installAndroidPerformance,
  installCocoaPerformance,
  configureReactNativeNavigation
} = require('./utils/react-native-config')
const { configureRN064Fixture } = require('./utils/rn-064-config')
const { buildAndroidFixture, buildIOSFixture } = require('./utils/platform-builds')

// Validate environment variables
validateEnvironment({
  RN_VERSION: 'Please provide a React Native version',
  NOTIFIER_VERSION: 'Please provide a Notifier version',
  RCT_NEW_ARCH_ENABLED: 'RCT_NEW_ARCH_ENABLED must be set to 1 or 0'
}, {
  RCT_NEW_ARCH_ENABLED: isBooleanString
})

// Configuration
const reactNativeVersion = process.env.RN_VERSION
const isNewArchEnabled = process.env.RCT_NEW_ARCH_ENABLED === '1'
const isReactNativeNavigation = isTruthy(process.env.REACT_NATIVE_NAVIGATION)
const isNativeIntegration = isTruthy(process.env.NATIVE_INTEGRATION)

// Build fixture path
let fixturePath = 'test/react-native/features/fixtures/generated/'
if (isReactNativeNavigation) {
  fixturePath += 'react-native-navigation/'
}

if (isNativeIntegration) {
  fixturePath += 'native-integration/'
}

if (isNewArchEnabled) {
  fixturePath += 'new-arch/'
} else {
  fixturePath += 'old-arch/'
}

const fixtureDir = resolve(ROOT_DIR, fixturePath, reactNativeVersion)

// Build dependencies
const { baseDependencies } = getReactNativeDependencies(reactNativeVersion, process.env.NOTIFIER_VERSION)
const DEPENDENCIES = [...baseDependencies]

// Add navigation dependencies
if (isReactNativeNavigation) {
  DEPENDENCIES.push(...getReactNativeNavigationDependencies())
} else if (!isNewArchEnabled) {
  DEPENDENCIES.push(...getReactNavigationDependencies(reactNativeVersion))
}

// Build packages
buildPackages()

// Generate fixture
if (!process.env.SKIP_GENERATE_FIXTURE) {
  // Remove existing fixture directory
  cleanDirectory(fixtureDir)

  // Create the test fixture
  const RNInitArgs = [
    '@react-native-community/cli@16', 
    'init', 
    'reactnative', 
    '--package-name', 
    'com.bugsnag.fixtures.reactnative.performance', 
    '--directory', 
    fixtureDir, 
    '--version', 
    reactNativeVersion, 
    '--pm', 
    'npm', 
    '--skip-install'
  ]
  execFileSync('npx', RNInitArgs, { stdio: 'inherit' })

  // Configure fixture files and projects
  replaceGeneratedFixtureFiles(fixtureDir, isReactNativeNavigation)
  configureAndroidProject(fixtureDir, isNewArchEnabled, reactNativeVersion)
  configureIOSProject(fixtureDir, reactNativeVersion)

  // Install dependencies
  installFixtureDependencies(fixtureDir, DEPENDENCIES)

  // Apply RN 0.64 specific configuration
  if (parseFloat(reactNativeVersion) === 0.64) {
    configureRN064Fixture(fixtureDir)
  }

  // Install native performance SDKs if needed
  if (isNativeIntegration) {
    installAndroidPerformance(fixtureDir)
    installCocoaPerformance(fixtureDir)
  }

  // Configure React Native Navigation if needed
  if (isReactNativeNavigation) {
    configureReactNativeNavigation(fixtureDir)
  }
}

// Build platform fixtures
buildAndroidFixture(fixtureDir, isNewArchEnabled)
buildIOSFixture(fixtureDir)
