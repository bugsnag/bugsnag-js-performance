const { resolve } = require('path')

const ROOT_DIR = resolve(__dirname, '../../../../')

const PACKAGE_NAMES = [
  '@bugsnag/core-performance',
  '@bugsnag/delivery-fetch-performance',
  '@bugsnag/plugin-react-native-navigation-performance',
  '@bugsnag/plugin-react-native-span-access',
  '@bugsnag/plugin-react-navigation-performance',
  '@bugsnag/react-native-performance',
  '@bugsnag/request-tracker-performance',
  '@bugsnag/plugin-named-spans'
]

const PACKAGE_DIRECTORIES = [
  `${ROOT_DIR}/packages/core`,
  `${ROOT_DIR}/packages/delivery-fetch`,
  `${ROOT_DIR}/packages/platforms/react-native`,
  `${ROOT_DIR}/packages/plugin-react-native-navigation`,
  `${ROOT_DIR}/packages/plugin-react-native-span-access`,
  `${ROOT_DIR}/packages/plugin-react-navigation`,
  `${ROOT_DIR}/packages/request-tracker`,
  `${ROOT_DIR}/packages/plugin-named-spans`,
  `${ROOT_DIR}/test/react-native/features/fixtures/scenario-launcher`
]

module.exports = {
  ROOT_DIR,
  PACKAGE_NAMES,
  PACKAGE_DIRECTORIES
}
