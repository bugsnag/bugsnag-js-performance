import * as ReactNative from 'react-native'

export const Platform = {
  ...ReactNative.Platform,
  OS: 'ios',
  Version: '1.2.3',
  isTesting: true
}

export default Object.setPrototypeOf(
  {
    Platform
  },
  ReactNative
)
