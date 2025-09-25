const { resolve } = require('path')

const ROOT_DIR = resolve(__dirname, '../../../../')

const PACKAGE_DIRECTORIES = [
  `${ROOT_DIR}/packages/core`,
  `${ROOT_DIR}/packages/delivery-fetch`,
  `${ROOT_DIR}/packages/platforms/react-native`,
  `${ROOT_DIR}/packages/plugin-react-native-navigation`,
  `${ROOT_DIR}/packages/plugin-react-native-span-access`,
  `${ROOT_DIR}/packages/plugin-react-navigation`,
  `${ROOT_DIR}/packages/request-tracker`,
  `${ROOT_DIR}/packages/plugin-named-spans`,
  `${ROOT_DIR}/test/react-native/scenario-launcher`
]

module.exports = {
  ROOT_DIR,
  PACKAGE_DIRECTORIES
}
