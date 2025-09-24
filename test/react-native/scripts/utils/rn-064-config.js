const fs = require('fs')
const { resolve } = require('path')
const { ROOT_DIR } = require('./constants')
const { replaceInFile, safeCopyFile } = require('./file-utils')

/**
 * Update fixture configuration to support React Native 0.64
 */
function configureRN064Fixture (fixtureDir) {
  configureRN064Android(fixtureDir)
  configureRN064iOS(fixtureDir)
  configureRN064Node(fixtureDir)
  fixYogaCppIssue(fixtureDir)
  copyGemfile(fixtureDir)
}

/**
 * Configure Android for RN 0.64
 */
function configureRN064Android (fixtureDir) {
  const gradlePath = resolve(fixtureDir, 'android/build.gradle')
  let gradle = fs.readFileSync(gradlePath, 'utf8')

  // add kotlinVersion = "1.4.10" to the buildscript ext block
  const buildscriptExt = 'ext {'
  const kotlinVersion = 'kotlinVersion = "1.4.10"'
  gradle = gradle.replace(buildscriptExt, `${buildscriptExt}\n        ${kotlinVersion}`)

  // bump android sdk version to 30
  gradle = gradle.replace(/compileSdkVersion = 29/, 'compileSdkVersion = 30').replace(/targetSdkVersion = 29/, 'targetSdkVersion = 30')

  fs.writeFileSync(gradlePath, gradle)

  const moduleGradlePath = resolve(fixtureDir, 'android/app/build.gradle')
  let moduleGradle = fs.readFileSync(moduleGradlePath, 'utf8')

  // enable hermes and set --openssl-legacy-provider node option
  const currentReactConfig = `project.ext.react = [
    enableHermes: false,  // clean and rebuild if changing
]`

  const updatedReactConfig = `project.ext.react = [
    enableHermes: true,
    nodeExecutableAndArgs: ["node", "--openssl-legacy-provider"]
  ]`

  // remove flipper and associated dependencies
  fs.rmSync(resolve(fixtureDir, 'android/app/src/debug/java'), { recursive: true, force: true })
  const flipperDependencies = `debugImplementation("com.facebook.flipper:flipper:\${FLIPPER_VERSION}") {
      exclude group:'com.facebook.fbjni'
    }

    debugImplementation("com.facebook.flipper:flipper-network-plugin:\${FLIPPER_VERSION}") {
        exclude group:'com.facebook.flipper'
        exclude group:'com.squareup.okhttp3', module:'okhttp'
    }

    debugImplementation("com.facebook.flipper:flipper-fresco-plugin:\${FLIPPER_VERSION}") {
        exclude group:'com.facebook.flipper'
    }`

  moduleGradle = moduleGradle.replace(currentReactConfig, updatedReactConfig).replace(flipperDependencies, '')
  fs.writeFileSync(moduleGradlePath, moduleGradle)
}

/**
 * Configure iOS for RN 0.64
 */
function configureRN064iOS (fixtureDir) {
  // set --openssl-legacy-provider node option in pbxproj file
  const pbxprojPath = resolve(fixtureDir, 'ios/reactnative.xcodeproj/project.pbxproj')
  replaceInFile(pbxprojPath, 'export NODE_BINARY=node\\n', 'export NODE_BINARY=node\\nexport NODE_OPTIONS=--openssl-legacy-provider\\n')
}

/**
 * Configure Node.js for RN 0.64
 */
function configureRN064Node (fixtureDir) {
  // set --openssl-legacy-provider node option in .npmrc file (this is only needed for running the test fixture locally)
  fs.writeFileSync(resolve(fixtureDir, '.npmrc'), 'node-options="--openssl-legacy-provider"\n')
}

/**
 * Fix Yoga.cpp issue with Xcode 14.3+
 */
function fixYogaCppIssue (fixtureDir) {
  // fix Yoga.cpp issue with Xcode 14.3+ (see https://github.com/facebook/react-native/issues/36758)
  const yogaCppPath = resolve(fixtureDir, 'node_modules/react-native/ReactCommon/yoga/yoga/Yoga.cpp')
  if (fs.existsSync(yogaCppPath)) {
    replaceInFile(yogaCppPath, 'node->getLayout().hadOverflow() |', 'node->getLayout().hadOverflow() ||')
  }
}

/**
 * Copy Gemfile for RN 0.64
 */
function copyGemfile (fixtureDir) {
  safeCopyFile(resolve(ROOT_DIR, 'test/react-native/features/fixtures/app/Gemfile'), resolve(fixtureDir, 'Gemfile'))
}

module.exports = {
  configureRN064Fixture
}
