/**
 * Fixture generation utilities
 *
 * This module provides common utilities for generating React Native and Expo test fixtures.
 * It includes functions for environment validation, dependency management, build processes,
 * and platform-specific configuration.
 */

const constants = require('./constants')
const envValidation = require('./env-validation')
const buildUtils = require('./build-utils')
const fileUtils = require('./file-utils')
const dependencyUtils = require('./dependency-utils')
const reactNativeConfig = require('./react-native-config')
const rn064Config = require('./rn-064-config')
const platformBuilds = require('./platform-builds')

module.exports = {
  ...constants,
  ...envValidation,
  ...buildUtils,
  ...fileUtils,
  ...dependencyUtils,
  ...reactNativeConfig,
  ...rn064Config,
  ...platformBuilds
}
