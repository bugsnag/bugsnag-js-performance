const { execFileSync } = require('child_process')
const { resolve } = require('path')
const fs = require('fs')

// Import utilities
const { ROOT_DIR } = require('./utils/constants')
const { validateEnvironment } = require('./utils/env-validation')
const { buildPackages } = require('./utils/build-utils')
const { cleanDirectory, ensureDirectory } = require('./utils/file-utils')
const { installFixtureDependencies, getExpoDependencies } = require('./utils/dependency-utils')
const { buildExpoAndroidFixture, buildExpoIOSFixture } = require('./utils/platform-builds')

// Validate environment variables
validateEnvironment({
  EXPO_VERSION: {
    message: 'Please provide an Expo version'
  },
  EXPO_EAS_PROJECT_ID: {
    message: 'EXPO_EAS_PROJECT_ID is not set'
  },
  EXPO_CREDENTIALS_DIR: {
    message: 'EXPO_CREDENTIALS_DIR is not set'
  }
})

// Configuration
const expoVersion = process.env.EXPO_VERSION
const buildDir = resolve(ROOT_DIR, `test/react-native/features/fixtures/generated/expo/${expoVersion}`)
const easWorkingDir = `${buildDir}/build`
const fixtureDir = `${buildDir}/test-fixture`

// Dependencies
const fixtureDeps = getExpoDependencies()

// Build packages
buildPackages()

// Generate fixture
if (!process.env.SKIP_GENERATE_FIXTURE) {
  // Clean directories
  cleanDirectory(fixtureDir)
  cleanDirectory(easWorkingDir)
  ensureDirectory(fixtureDir)

  // create the test fixture
  const expoInitArgs = ['create-expo-app', 'test-fixture', '--no-install', '--template', `tabs@${expoVersion}`]
  execFileSync('npx', expoInitArgs, { cwd: buildDir, stdio: 'inherit' })

  // install the required packages
  installFixtureDependencies(fixtureDir, fixtureDeps, ['--legacy-peer-deps'])

  // modify the app.json file
  const appConfig = require(`${fixtureDir}/app.json`)
  appConfig.expo.ios = {
    ...appConfig.expo.ios,
    bundleIdentifier: 'com.bugsnag.expo.fixture',
    buildNumber: '1',
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true
      }
    }
  }

  appConfig.expo.android = {
    ...appConfig.expo.android,
    package: 'com.bugsnag.expo.fixture',
    versionCode: 1,
    permissions: ['INTERNET'],
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY
      }
    }
  }

  // set usesCleartextTraffic to true for Android
  appConfig.expo.plugins.push([
    'expo-build-properties',
    {
      android: {
        usesCleartextTraffic: true
      }
    }
  ])

  // for SDK 50 and below we need to add a config plugin to remove the aps-environment entitlement for iOS
  // TODO: remove this when we drop support for SDK 50
  if (parseInt(expoVersion) < 51) {
    const configPlugin = resolve(ROOT_DIR, `test/react-native/features/fixtures/expo/withRemoveiOSNotificationEntitlement.js`)
    fs.copyFileSync(configPlugin, resolve(fixtureDir, 'withRemoveiOSNotificationEntitlement.js'))
    appConfig.expo.plugins.push('./withRemoveiOSNotificationEntitlement')
  }

  fs.writeFileSync(`${fixtureDir}/app.json`, JSON.stringify(appConfig, null, 2))

  // eas init
  const easInitArgs = ['eas-cli@latest', 'init', '--id', `${process.env.EXPO_EAS_PROJECT_ID}`]
  execFileSync('npx', easInitArgs, { cwd: fixtureDir, stdio: 'inherit' })
  
  // eas build configure
  const easBuildConfigArgs = ['eas-cli@latest', 'build:configure', '--platform', 'all']
  execFileSync('npx', easBuildConfigArgs, { cwd: fixtureDir, stdio: 'inherit', env: { ...process.env, EAS_NO_VCS: 1 } })

  // modify the eas.json file
  const easConfig = require(`${fixtureDir}/eas.json`)

  easConfig.cli.appVersionSource = 'local'
  easConfig.build.production = {
    distribution: 'internal',
    credentialsSource: 'local',
    android: {
      buildType: 'apk'
    },
    ios: {
      enterpriseProvisioning: 'universal'
    }
  }

  fs.writeFileSync(`${fixtureDir}/eas.json`, JSON.stringify(easConfig, null, 2))

  // replace the fixture's tabs directory with our own routes
  // most of these are for expo router tests but need to be injected into the fixture 
  // because expo-router is file-based
  const fixtureTabsDir = resolve(fixtureDir, 'app/(tabs)')
  fs.rmSync(fixtureTabsDir, { recursive: true, force: true })

  const replacementTabsDir = resolve(ROOT_DIR, `test/react-native/features/fixtures/expo/tabs`)
  fs.cpSync(replacementTabsDir, fixtureTabsDir, { recursive: true })
  
  // copy keystore to the fixture directory
  const keyStorePath = resolve(ROOT_DIR, `test/react-native/features/fixtures/expo/fakekeys.jks`)
  fs.copyFileSync(keyStorePath, resolve(fixtureDir, 'fakekeys.jks'))

  // add .npmrc
  fs.writeFileSync(resolve(fixtureDir, '.npmrc'), 'registry=https://registry.npmjs.org/\n')

  // copy credentials to the fixture directory
  const credentialsFiles = fs.readdirSync(process.env.EXPO_CREDENTIALS_DIR)

  for (const file of credentialsFiles) {
    fs.copyFileSync(resolve(process.env.EXPO_CREDENTIALS_DIR, file), resolve(fixtureDir, file))
  }
}

// Build platform fixtures
buildExpoAndroidFixture(fixtureDir, easWorkingDir)
buildExpoIOSFixture(fixtureDir, easWorkingDir)


